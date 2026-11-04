const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function seedHrWorkflows() {
  console.log("🌱 SEEDING P1 HR WORKFLOWS (LEAVE, APPROVALS, LIFECYCLE, OUTBOX)...");

  // 1. Policies
  console.log("1. Upserting Leave Policies...");
  const policyConfigs = [
    {
      code: "ANNUAL",
      name: "Nghỉ phép năm (Annual Leave)",
      defaultDays: 12,
      isPaid: true,
      description: "Chế độ nghỉ phép hưởng nguyên lương tiêu chuẩn theo Bộ luật Lao động",
    },
    {
      code: "SICK",
      name: "Nghỉ ốm đau (Sick Leave)",
      defaultDays: 10,
      isPaid: true,
      description: "Nghỉ ốm hưởng trợ cấp bảo hiểm xã hội theo chứng nhận y tế",
    },
    {
      code: "UNPAID",
      name: "Nghỉ không lương (Unpaid Leave)",
      defaultDays: 15,
      isPaid: false,
      description: "Nghỉ việc riêng không hưởng lương theo thỏa thuận với quản lý",
    },
    {
      code: "MATERNITY",
      name: "Nghỉ thai sản / Chế độ (Maternity)",
      defaultDays: 180,
      isPaid: true,
      description: "Nghỉ thai sản theo quy định nhà nước và quy chế công ty",
    },
  ];

  const policies = [];
  for (const p of policyConfigs) {
    let policy = await db.leavePolicy.findUnique({ where: { code: p.code } });
    if (!policy) {
      policy = await db.leavePolicy.create({ data: p });
    }
    policies.push(policy);
  }
  console.log(`✅ Loaded ${policies.length} policies.`);

  // 2. Fetch all employees
  const employees = await db.employeeProfile.findMany({
    include: { profile: true },
  });
  console.log(`2. Initializing leave balances for ${employees.length} employees...`);

  const annualPolicy = policies.find((p) => p.code === "ANNUAL");
  const sickPolicy = policies.find((p) => p.code === "SICK");
  const unpaidPolicy = policies.find((p) => p.code === "UNPAID");

  for (const emp of employees) {
    for (const pol of policies) {
      const existing = await db.leaveBalance.findUnique({
        where: {
          employeeProfileId_policyId_year: {
            employeeProfileId: emp.id,
            policyId: pol.id,
            year: 2026,
          },
        },
      });

      if (!existing) {
        await db.leaveBalance.create({
          data: {
            employeeProfileId: emp.id,
            policyId: pol.id,
            year: 2026,
            totalDays: pol.defaultDays,
            usedDays: Math.floor(Math.random() * 3),
            pendingDays: 0,
          },
        });
      }
    }
  }
  console.log("✅ All employee leave balances initialized.");

  // 3. Create Sample Pending & Approved Leave Requests
  console.log("3. Seeding realistic Leave Requests...");
  // Clear old test requests if any
  const sampleEmp1 = employees[3]; // Nguyen Minh Tuan (Tổ Nền Tảng)
  const sampleEmp2 = employees[5]; // Tran Thi Lan (Kinh doanh)
  const sampleEmp3 = employees[10]; // Pham Thu Ha (HR)

  if (sampleEmp1 && annualPolicy) {
    await db.leaveRequest.create({
      data: {
        employeeProfileId: sampleEmp1.id,
        policyId: annualPolicy.id,
        startDate: new Date("2026-11-10T00:00:00Z"),
        endDate: new Date("2026-11-12T00:00:00Z"),
        daysCount: 3,
        session: "FULL_DAY",
        reason: "Nghỉ phép giải quyết việc gia đình",
        handoverTo: "Hoàng Văn Tuấn",
        status: "PENDING",
      },
    });

    // Update pending days
    await db.leaveBalance.updateMany({
      where: {
        employeeProfileId: sampleEmp1.id,
        policyId: annualPolicy.id,
        year: 2026,
      },
      data: { pendingDays: 3 },
    });
  }

  if (sampleEmp2 && sickPolicy) {
    await db.leaveRequest.create({
      data: {
        employeeProfileId: sampleEmp2.id,
        policyId: sickPolicy.id,
        startDate: new Date("2026-11-05T00:00:00Z"),
        endDate: new Date("2026-11-06T00:00:00Z"),
        daysCount: 1.5,
        session: "MORNING",
        reason: "Nghỉ khám sức khỏe định kỳ theo chỉ định bác sĩ",
        handoverTo: "Lê Thị Mai",
        status: "PENDING",
      },
    });

    await db.leaveBalance.updateMany({
      where: {
        employeeProfileId: sampleEmp2.id,
        policyId: sickPolicy.id,
        year: 2026,
      },
      data: { pendingDays: 1.5 },
    });
  }

  if (sampleEmp3 && annualPolicy) {
    await db.leaveRequest.create({
      data: {
        employeeProfileId: sampleEmp3.id,
        policyId: annualPolicy.id,
        startDate: new Date("2026-10-20T00:00:00Z"),
        endDate: new Date("2026-10-22T00:00:00Z"),
        daysCount: 2,
        session: "FULL_DAY",
        reason: "Nghỉ thường niên đã được Giám đốc phê duyệt",
        handoverTo: "Nguyễn Văn Hùng",
        status: "APPROVED",
        approvedAt: new Date("2026-10-18T10:00:00Z"),
      },
    });
  }
  console.log("✅ Seeded sample pending and approved leave requests.");

  // 4. Seed Employment Lifecycle Events & Onboarding Tasks
  console.log("4. Seeding Employment Lifecycle & Onboarding Tasks...");
  for (let i = 0; i < Math.min(5, employees.length); i++) {
    const emp = employees[i];
    const existingEvents = await db.employmentEvent.count({
      where: { employeeProfileId: emp.id },
    });
    if (existingEvents === 0) {
      await db.employmentEvent.create({
        data: {
          employeeProfileId: emp.id,
          eventType: "ONBOARDING",
          note: `Tiếp nhận nhân sự ${emp.profile.name} vào công ty với mã ${emp.employeeCode}`,
          effectiveDate: emp.hiredOn || new Date("2024-03-01"),
        },
      });

      await db.onboardingTask.createMany({
        data: [
          {
            employeeProfileId: emp.id,
            title: "Cấp tài khoản & máy tính làm việc",
            category: "IT",
            isCompleted: true,
            completedAt: new Date(),
          },
          {
            employeeProfileId: emp.id,
            title: "Ký kết hợp đồng lao động & phổ biến nội quy công ty",
            category: "HR",
            isCompleted: true,
            completedAt: new Date(),
          },
          {
            employeeProfileId: emp.id,
            title: "Tham gia buổi chào đón thành viên mới của tổ",
            category: "MANAGER",
            isCompleted: true,
            completedAt: new Date(),
          },
        ],
      });
    }
  }

  // 5. Seed Outbox Events to match architecture_hr.png
  console.log("5. Seeding initial Outbox events...");
  await db.outboxEvent.create({
    data: {
      aggregateType: "LEAVE_REQUEST",
      aggregateId: "sample_leave_01",
      eventType: "LEAVE_SUBMITTED",
      payload: {
        employeeName: sampleEmp1?.profile.name || "Nguyễn Minh Tuấn",
        daysCount: 3,
        reason: "Nghỉ phép giải quyết việc gia đình",
      },
      status: "PROCESSED",
      processedAt: new Date(),
    },
  });

  console.log("\n========================================================");
  console.log("🎉 P1 HR WORKFLOWS SEEDING COMPLETED SUCCESSFULLY!");
  console.log("========================================================");
}

seedHrWorkflows()
  .catch(console.error)
  .finally(() => process.exit(0));
