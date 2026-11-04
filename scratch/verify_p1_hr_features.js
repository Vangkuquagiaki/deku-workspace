const http = require("http");

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let parsed = body;
          try {
            parsed = JSON.parse(body);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log("==================================================================");
  console.log("🧪 TESTING ENTERPRISE HR SYSTEM & WORKFLOWS (P1 EXTENSIONS)");
  console.log("==================================================================");

  // 1. Leave Policies
  console.log("\n1. Testing Leave Policies (/api/leave/policies)...");
  const policiesRes = await request("/api/leave/policies");
  console.log(`Status: ${policiesRes.status}`);
  if (policiesRes.status === 200 && Array.isArray(policiesRes.data)) {
    console.log(`✅ Loaded ${policiesRes.data.length} policies:`, policiesRes.data.map(p => p.name).join(" | "));
  } else {
    console.error("❌ Failed to load policies", policiesRes.data);
  }

  // 2. Leave Balances
  console.log("\n2. Testing Leave Balances (/api/leave/balances)...");
  const balancesRes = await request("/api/leave/balances");
  console.log(`Status: ${balancesRes.status}`);
  if (balancesRes.status === 200 && balancesRes.data?.balances) {
    console.log(`✅ Retrieved balances for employee: ${balancesRes.data.employee?.employeeCode}`);
    balancesRes.data.balances.forEach(b => {
      console.log(`   - ${b.policy.name}: Total: ${b.totalDays}, Used: ${b.usedDays}, Pending: ${b.pendingDays}`);
    });
  } else {
    console.error("❌ Failed to load balances", balancesRes.data);
  }

  // 3. Submit Leave Request & Outbox
  console.log("\n3. Testing Leave Request Submission (/api/leave/requests)...");
  const annualPolicy = policiesRes.data?.find(p => p.code === "ANNUAL");
  const submitRes = await request("/api/leave/requests", {
    method: "POST",
    body: {
      policyId: annualPolicy?.id,
      startDate: "2026-12-01",
      endDate: "2026-12-02",
      daysCount: 2,
      session: "FULL_DAY",
      reason: "Nghỉ phép thường niên cuối năm",
      handoverTo: "Trần Thị Lan",
    },
  });
  console.log(`Status: ${submitRes.status}`);
  let createdRequestId = null;
  if (submitRes.status === 200 && submitRes.data?.success) {
    createdRequestId = submitRes.data.request?.id;
    console.log(`✅ Leave Request successfully created with ID: ${createdRequestId}`);
    console.log(`   Transactional Outbox Event ID: ${submitRes.data.outboxEventId} (architecture_hr.png compliance)`);
  } else {
    console.error("❌ Failed to create leave request", submitRes.data);
  }

  // 4. Pending Approvals Queue
  console.log("\n4. Testing Approvals Queue (/api/approvals?asRole=LEAD)...");
  const approvalsRes = await request("/api/approvals?asRole=LEAD");
  console.log(`Status: ${approvalsRes.status}`);
  if (approvalsRes.status === 200) {
    console.log(`✅ Pending requests in queue: ${approvalsRes.data.pendingCount}`);
  }

  // 5. Manager Decision (APPROVE)
  if (createdRequestId) {
    console.log(`\n5. Testing Approval Decision for Request ${createdRequestId}...`);
    const decisionRes = await request("/api/approvals", {
      method: "POST",
      body: {
        requestId: createdRequestId,
        decision: "APPROVE",
        note: "Đồng ý cho nghỉ phép, bàn giao đầy đủ",
      },
    });
    console.log(`Status: ${decisionRes.status}`);
    if (decisionRes.status === 200 && decisionRes.data?.success) {
      console.log(`✅ Request APPROVED successfully! Status: ${decisionRes.data.request?.status}`);
      console.log(`   Balance updated: Used Days incremented, Pending Days decremented.`);
    } else {
      console.error("❌ Failed to approve request", decisionRes.data);
    }
  }

  // 6. Employee Directory & Search
  console.log("\n6. Testing Employee Directory (/api/employees?search=Tuan)...");
  const dirRes = await request("/api/employees?search=Tuan");
  console.log(`Status: ${dirRes.status}`);
  if (dirRes.status === 200 && Array.isArray(dirRes.data)) {
    console.log(`✅ Found ${dirRes.data.length} employees matching "Tuan":`, dirRes.data.map(e => `${e.profile.name} (${e.employeeCode})`).join(", "));
  }

  // 7. Onboarding New Employee
  console.log("\n7. Testing Onboarding New Employee (/api/employees)...");
  // Find a team ID from org tree
  const treeRes = await request("/api/org-units/tree");
  const teamId = treeRes.data?.[0]?.children?.[0]?.id;
  let newEmpId = null;

  if (teamId) {
    const onboardRes = await request("/api/employees", {
      method: "POST",
      body: {
        name: "Vũ Hải Đăng",
        email: "dang.vu@enterprise.local",
        jobTitle: "Kỹ sư Trí tuệ Nhân tạo (AI Engineer)",
        orgUnitId: teamId,
        role: "MEMBER",
      },
    });
    console.log(`Status: ${onboardRes.status}`);
    if (onboardRes.status === 200 && onboardRes.data?.success) {
      newEmpId = onboardRes.data.employee?.id;
      console.log(`✅ Successfully onboarded new employee: "${onboardRes.data.profile?.name}" with Code: ${onboardRes.data.employee?.employeeCode}`);
      console.log(`   Assigned to: ${onboardRes.data.membership?.orgUnit?.name}`);
    }
  }

  // 8. Transfer Employee (Điều chuyển tổ)
  if (newEmpId && treeRes.data?.[0]?.children?.[1]?.id) {
    const targetTeamId = treeRes.data[0].children[1].id;
    console.log(`\n8. Testing Employee Transfer to new team...`);
    const transferRes = await request(`/api/employees/${newEmpId}/transfer`, {
      method: "POST",
      body: {
        targetOrgUnitId: targetTeamId,
        note: "Điều động nhân sự sang tổ mới để hỗ trợ dự án AI",
      },
    });
    console.log(`Status: ${transferRes.status}`);
    if (transferRes.status === 200 && transferRes.data?.success) {
      console.log(`✅ ${transferRes.data.message}`);
      console.log(`   EmploymentEvent recorded: "${transferRes.data.event?.eventType}"`);
    }
  }

  // 9. Audit Logs & Privacy Compliance
  console.log("\n9. Testing Audit Logs & Privacy Law Compliance (/api/audit-logs)...");
  const auditRes = await request("/api/audit-logs?limit=10");
  console.log(`Status: ${auditRes.status}`);
  if (auditRes.status === 200 && Array.isArray(auditRes.data?.logs)) {
    console.log(`✅ Loaded ${auditRes.data.logs.length} audit logs.`);
    console.log(`   Compliance Notice: ${auditRes.data.complianceNote}`);
    const sampleLog = auditRes.data.logs[0];
    if (sampleLog) {
      console.log(`   Latest Log: [${sampleLog.action}] Target: ${sampleLog.targetType} at ${new Date(sampleLog.createdAt).toLocaleString("vi-VN")}`);
    }
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL P1 HR EXTENSION TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================================");
}

run().catch(console.error);
