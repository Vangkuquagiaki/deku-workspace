const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Lark & Lark Base Enterprise data...");

  // 1. Get or create primary Profile
  let profile = await prisma.profile.findFirst();
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: "user_seed_admin",
        name: "Nguyễn Minh Thiện (Admin/HR)",
        email: "thien.nguyen@company.com",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      },
    });
  }

  // 2. Org Units: Phòng ban & Tổ
  let deptSales = await prisma.orgUnit.findFirst({ where: { name: "Phòng Kinh Doanh" } });
  if (!deptSales) {
    deptSales = await prisma.orgUnit.create({
      data: {
        name: "Phòng Kinh Doanh",
        type: "DEPARTMENT",
      },
    });
  }

  let deptTech = await prisma.orgUnit.findFirst({ where: { name: "Phòng Công Nghệ" } });
  if (!deptTech) {
    deptTech = await prisma.orgUnit.create({
      data: {
        name: "Phòng Công Nghệ",
        type: "DEPARTMENT",
      },
    });
  }

  let teamDomesticSales = await prisma.orgUnit.findFirst({ where: { name: "Tổ Kinh Doanh Nội Địa" } });
  if (!teamDomesticSales) {
    teamDomesticSales = await prisma.orgUnit.create({
      data: {
        name: "Tổ Kinh Doanh Nội Địa",
        type: "TEAM",
        parentId: deptSales.id,
      },
    });
  }

  let teamGlobalSales = await prisma.orgUnit.findFirst({ where: { name: "Tổ Kinh Doanh Quốc Tế" } });
  if (!teamGlobalSales) {
    teamGlobalSales = await prisma.orgUnit.create({
      data: {
        name: "Tổ Kinh Doanh Quốc Tế",
        type: "TEAM",
        parentId: deptSales.id,
      },
    });
  }

  let teamBackend = await prisma.orgUnit.findFirst({ where: { name: "Tổ Backend & AI" } });
  if (!teamBackend) {
    teamBackend = await prisma.orgUnit.create({
      data: {
        name: "Tổ Backend & AI",
        type: "TEAM",
        parentId: deptTech.id,
      },
    });
  }

  let teamQA = await prisma.orgUnit.findFirst({ where: { name: "Tổ QA & Hạ Tầng" } });
  if (!teamQA) {
    teamQA = await prisma.orgUnit.create({
      data: {
        name: "Tổ QA & Hạ Tầng",
        type: "TEAM",
        parentId: deptTech.id,
      },
    });
  }

  console.log("Org Units created: 2 Departments, 4 Teams.");

  // 3. Employee Profile & Attendance for Current User
  let empProfile = await prisma.employeeProfile.findUnique({
    where: { profileId: profile.id },
  });

  if (!empProfile) {
    empProfile = await prisma.employeeProfile.create({
      data: {
        profileId: profile.id,
        employeeCode: "EMP-001",
        jobTitle: "Kỹ sư Trưởng & Quản trị AI",
        hiredOn: new Date("2022-03-15"),
        employmentStatus: "ACTIVE",
        isHr: true,
      },
    });
  }

  // Assign user to Team Backend as LEAD and primary
  await prisma.orgUnitMember.upsert({
    where: {
      orgUnitId_profileId: {
        orgUnitId: teamBackend.id,
        profileId: profile.id,
      },
    },
    update: { role: "LEAD" },
    create: {
      orgUnitId: teamBackend.id,
      profileId: profile.id,
      role: "LEAD",
      isPrimary: true,
    },
  });

  // Attendance records
  await prisma.attendanceRecord.upsert({
    where: {
      employeeProfileId_month: {
        employeeProfileId: empProfile.id,
        month: new Date("2026-10-01"),
      },
    },
    update: { workedDays: 22.0 },
    create: {
      employeeProfileId: empProfile.id,
      month: new Date("2026-10-01"),
      workedDays: 22.0,
      source: "CSV",
    },
  });

  // 4. Tasks (Lark Base style with Grid & Kanban support)
  const sampleTasks = [
    {
      title: "Tối ưu hóa độ trễ mô hình nhận dạng tiếng Việt",
      description: "Đo đạc và giảm độ trễ Streaming STT xuống dưới 2.5 giây cho cuộc họp",
      status: "IN_PROGRESS",
      priority: "HIGH",
      orgUnitId: teamBackend.id,
      assigneeId: profile.id,
      assigneeName: profile.name,
      deadlineText: "Thứ 6 tuần này",
      dueDate: new Date(Date.now() + 86400000 * 3),
      evidenceText: '"Chúng ta cần đưa độ trễ nhận dạng giọng nói xuống dưới ba giây trước buổi nghiệm thu thứ 6."',
      isHumanConfirmed: true,
    },
    {
      title: "Triển khai Egress Template 720p vào bucket R2 Singapore",
      description: "Cấu hình LiveKit Egress xuất MP4 trực tiếp vào bộ nhớ đám mây có phân quyền",
      status: "DONE",
      priority: "HIGH",
      orgUnitId: teamBackend.id,
      assigneeId: profile.id,
      assigneeName: profile.name,
      deadlineText: "Đầu tuần",
      dueDate: new Date(Date.now() - 86400000),
      evidenceText: '"Phần ghi hình Egress cần lưu vào kho Singapore để người tham gia tải lại nhanh nhất."',
      isHumanConfirmed: true,
    },
    {
      title: "Kiểm thử kết nối phòng họp 20 người đồng thời",
      description: "Mô phỏng 20 client bật mic và camera để đo lường băng thông SFU",
      status: "TODO",
      priority: "MEDIUM",
      orgUnitId: teamQA.id,
      assigneeName: "Đội ngũ QA",
      deadlineText: "Thứ 4 tuần sau",
      dueDate: new Date(Date.now() + 86400000 * 5),
      evidenceText: '"Bên QA sẽ chạy kịch bản thử nghiệm tải với 20 người dùng cùng lúc."',
      isHumanConfirmed: true,
    },
    {
      title: "Soạn thảo tài liệu hướng dẫn sử dụng tính năng phiên dịch cho nhân sự",
      description: "Cung cấp bản hướng dẫn 1 trang để nhân viên chọn ngôn ngữ nói và đọc phụ đề",
      status: "OVERDUE",
      priority: "LOW",
      orgUnitId: teamDomesticSales.id,
      assigneeName: "Trưởng nhóm hỗ trợ",
      deadlineText: "Hôm qua",
      dueDate: new Date(Date.now() - 86400000 * 2),
      evidenceText: '"Cần có hướng dẫn ngắn cho nhân viên mới vào họp biết cách bật dải phụ đề CC."',
      isHumanConfirmed: true,
    },
  ];

  for (const t of sampleTasks) {
    const existing = await prisma.task.findFirst({
      where: { title: t.title, orgUnitId: t.orgUnitId },
    });
    if (!existing) {
      await prisma.task.create({ data: t });
    }
  }

  console.log("Tasks created for Team Base.");

  // 5. Post Categories & Bulletin Posts
  let catHR = await prisma.postCategory.findFirst({ where: { name: "Nhân Sự & Đãi Ngộ" } });
  if (!catHR) {
    catHR = await prisma.postCategory.create({ data: { name: "Nhân Sự & Đãi Ngộ" } });
  }

  let catCorp = await prisma.postCategory.findFirst({ where: { name: "Thông Báo Công Ty" } });
  if (!catCorp) {
    catCorp = await prisma.postCategory.create({ data: { name: "Thông Báo Công Ty" } });
  }

  const samplePosts = [
    {
      title: "Ban hành Quy chế Họp Trực tuyến & Bảo mật Thông tin Cuộc họp",
      body: "Toàn thể cán bộ nhân viên lưu ý: Mọi cuộc họp có tính năng ghi hình và dịch tự động đều được lưu trữ bảo mật trên máy chủ nội bộ. Vui lòng thông báo cho đối tác bên ngoài trước khi bật tính năng ghi hình.",
      isPinned: true,
      categoryId: catCorp.id,
      authorId: profile.id,
    },
    {
      title: "Chính sách Làm việc Linh hoạt và Quy định Chấm công Tháng 11/2026",
      body: "Phòng Nhân sự thông báo lịch đối soát ngày công tháng 10 và kế hoạch làm việc kết hợp linh hoạt cho các khối phòng ban.",
      isPinned: false,
      categoryId: catHR.id,
      authorId: profile.id,
    },
  ];

  for (const p of samplePosts) {
    const existing = await prisma.post.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.post.create({ data: p });
    }
  }

  console.log("Seed finished successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
