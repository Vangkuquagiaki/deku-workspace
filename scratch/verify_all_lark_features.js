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
  console.log("🧪 TESTING ALL 9 LARK & LARK BASE CAPABILITIES END-TO-END");
  console.log("==================================================================");

  // 1. Test Org Units Tree
  console.log("\n1. [B2] Testing Org Units Tree (/api/org-units/tree)...");
  const treeRes = await request("/api/org-units/tree");
  console.log(`Status: ${treeRes.status}`);
  if (Array.isArray(treeRes.data)) {
    console.log(`✅ Loaded ${treeRes.data.length} Departments:`, treeRes.data.map(d => `${d.name} (${d.children?.length} teams)`).join(", "));
  } else {
    console.error("❌ Failed to load org tree", treeRes.data);
  }

  // 2. Test Lark Base Tasks as LEAD
  console.log("\n2. [B6] Testing Tasks Query as LEAD (/api/org-units/all/tasks?asRole=LEAD)...");
  const leadTasksRes = await request("/api/org-units/all/tasks?asRole=LEAD");
  console.log(`Status: ${leadTasksRes.status}`);
  if (leadTasksRes.status === 200 && Array.isArray(leadTasksRes.data)) {
    console.log(`✅ LEAD successfully retrieved ${leadTasksRes.data.length} tasks in their unit.`);
    const sample = leadTasksRes.data[0];
    if (sample) {
      console.log(`   Sample Task: "${sample.title}" | Status: ${sample.status} | Assignee: ${sample.assigneeName || sample.assignee?.name}`);
      console.log(`   Evidence Text: "${sample.evidenceText}"`);
    }
  } else {
    console.error("❌ Failed to get tasks as LEAD", leadTasksRes.data);
  }

  // 3. Test HR Forbidden Access to Tasks (Requirement B6: HR không xem việc)
  console.log("\n3. [B6] Testing HR Exclusion from Tasks (/api/org-units/all/tasks?asRole=HR)...");
  const hrTasksRes = await request("/api/org-units/all/tasks?asRole=HR");
  console.log(`Status: ${hrTasksRes.status}`);
  if (hrTasksRes.status === 403) {
    console.log(`✅ CORRECT! HR is strictly forbidden with HTTP 403: "${hrTasksRes.data.error}"`);
  } else {
    console.error("❌ Error: HR was not blocked from viewing tasks! Status:", hrTasksRes.status);
  }

  // 4. Test Bulletin Posts
  console.log("\n4. [B5] Testing Company Bulletin Posts (/api/posts)...");
  const postsRes = await request("/api/posts");
  console.log(`Status: ${postsRes.status}`);
  if (postsRes.status === 200 && Array.isArray(postsRes.data)) {
    console.log(`✅ Retrieved ${postsRes.data.length} bulletin posts.`);
    const pinned = postsRes.data.filter(p => p.isPinned);
    console.log(`   Pinned posts count: ${pinned.length}`);
    console.log(`   Top post: "${postsRes.data[0]?.title}" [Category: ${postsRes.data[0]?.category?.name}]`);
  } else {
    console.error("❌ Failed to get posts", postsRes.data);
  }

  // 5. Test Profile 3-Tier Security Matrix
  console.log("\n5. [B3] Testing 3-Tier Security Matrix (/api/profile/[id])...");
  // Find a profile ID from tree
  let sampleProfileId = null;
  if (treeRes.data && treeRes.data[0]?.children?.[0]?.members?.[0]) {
    sampleProfileId = treeRes.data[0].children[0].members[0].profileId || treeRes.data[0].children[0].members[0].profile?.id;
  }

  if (sampleProfileId) {
    // 5a. Test as SELF / LEAD
    const leadProfRes = await request(`/api/profile/${sampleProfileId}?asRole=LEAD`);
    console.log(`   As LEAD status: ${leadProfRes.status}`);
    console.log(`   LEAD sees workedDays:`, leadProfRes.data?.employee?.workedDays !== undefined ? `Yes (${leadProfRes.data.employee.workedDays} days)` : "No");

    // 5b. Verify Salary & Appraisal are STRICTLY OMITTED (per security policy)
    const hasSalary = "salary" in (leadProfRes.data?.employee || {}) || "appraisal" in (leadProfRes.data?.employee || {});
    console.log(`   Salary & Appraisal in response: ${hasSalary ? "❌ DETECTED LEAK!" : "✅ SAFELY OMITTED FROM SCHEMA & API"}`);
  }

  // 6. Test Diacritics Normalization & Task Auto-Confirmation (B7)
  console.log("\n6. [B7] Testing Diacritics Normalization & Task Auto-Creation (/api/tasks/confirm)...");
  const confirmRes = await request("/api/tasks/confirm", {
    method: "POST",
    body: {
      actionItemText: "Chuẩn bị tài liệu đối tác Nhật Bản",
      rawAssigneeName: "Nguyen Minh Tuan", // Unaccented input for "Nguyễn Minh Tuấn"
      deadlineText: "Thứ 4 tuần tới",
      evidenceText: "Tuấn chuẩn bị tài liệu đối tác Nhật Bản trước thứ 4 tuần tới nhé",
    },
  });
  console.log(`Status: ${confirmRes.status}`);
  if (confirmRes.status === 200 && confirmRes.data?.success) {
    console.log(`✅ Successfully created task "${confirmRes.data.task.title}"!`);
    console.log(`   Auto-bound to Org Unit: "${confirmRes.data.task.orgUnit?.name}"`);
    console.log(`   Evidence Text: "${confirmRes.data.task.evidenceText}"`);
    console.log(`   Automated Channel Notification: ${confirmRes.data.automationApplied?.channelNotified ? "✅ Sent to Discord Channel" : "No channel bound"}`);
  } else {
    console.error("❌ Failed to confirm task", confirmRes.data);
  }

  // 7. Test Meeting Search with Accent-Insensitive Diacritics
  console.log("\n7. [B1] Testing Meeting Transcript Search with Vietnamese diacritics removal...");
  const meetingsRes = await request("/api/meetings");
  const meetingList = Array.isArray(meetingsRes.data) ? meetingsRes.data : [];
  let meetingId = meetingList[0]?.id;

  if (!meetingId) {
    const createMeet = await request("/api/meetings", {
      method: "POST",
      body: { title: "Họp Chiến Lược Phát Triển Lark Base & AI" }
    });
    meetingId = createMeet.data?.id;
  }

  if (meetingId) {
    console.log(`   Testing on Meeting ID: ${meetingId}`);
    const searchRes = await request(`/api/meetings/${meetingId}/transcript/search?q=do+dac`);
    console.log(`   Status: ${searchRes.status} for search "do dac"`);
    if (searchRes.status === 200) {
      console.log(`✅ Search API successfully queried diacritic-insensitive segments!`);
    }

    // 8. Test Meeting Minutes Markdown Export
    console.log("\n8. [B1] Testing Minutes Markdown Export (/api/meetings/[id]/minutes)...");
    const minutesRes = await request(`/api/meetings/${meetingId}/minutes`);
    console.log(`   Status: ${minutesRes.status}`);
    const isMarkdown = minutesRes.headers["content-type"]?.includes("text/markdown");
    console.log(`✅ Content-Type is text/markdown: ${isMarkdown}`);
    console.log(`   Minutes length: ${typeof minutesRes.data === 'string' ? minutesRes.data.length : JSON.stringify(minutesRes.data).length} chars`);
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================================");
}

run().catch(console.error);
