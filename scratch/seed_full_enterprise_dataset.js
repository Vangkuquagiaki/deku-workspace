const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("=== SEEDING FULL LARK & LARK BASE ENTERPRISE DATASET (B8) ===");

  // 1. Get or Create Default Server
  let server = await db.server.findFirst();
  let adminProfile = await db.profile.findFirst();

  if (!adminProfile) {
    adminProfile = await db.profile.create({
      data: {
        userId: "user_seed_admin",
        name: "Nguyễn Minh Thiện",
        email: "thien.nguyen@congty.com",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      },
    });
  }

  if (!server) {
    server = await db.server.create({
      data: {
        name: "Doanh Nghiệp Số - Enterprise Workspace",
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300",
        inviteCode: `corp_${Date.now()}`,
        profileId: adminProfile.id,
      },
    });
  }
  console.log(`Using Server: "${server.name}" (${server.id})`);

  // 2. Org Units: 2 Departments, 4 Teams
  async function upsertOrg(name, type, parentId = null) {
    let org = await db.orgUnit.findFirst({ where: { name, type } });
    if (!org) {
      org = await db.orgUnit.create({
        data: { name, type, parentId },
      });
    } else if (parentId && org.parentId !== parentId) {
      org = await db.orgUnit.update({
        where: { id: org.id },
        data: { parentId },
      });
    }
    return org;
  }

  const deptSales = await upsertOrg("Phòng Kinh Doanh", "DEPARTMENT");
  const deptTech = await upsertOrg("Phòng Công Nghệ", "DEPARTMENT");

  const teamDomestic = await upsertOrg("Tổ Kinh Doanh Nội Địa", "TEAM", deptSales.id);
  const teamGlobal = await upsertOrg("Tổ Kinh Doanh Quốc Tế", "TEAM", deptSales.id);
  const teamBackend = await upsertOrg("Tổ Nền Tảng & Cloud", "TEAM", deptTech.id);
  const teamQA = await upsertOrg("Tổ Đảm Bảo Chất Lượng (QA)", "TEAM", deptTech.id);

  console.log("Org Hierarchy: 2 Departments, 4 Teams verified.");

  // 3. Create or Link Team Channels in Discord Server
  async function ensureChannel(channelName, orgUnitId) {
    let ch = await db.channel.findFirst({
      where: { serverId: server.id, name: channelName },
    });
    if (!ch) {
      ch = await db.channel.create({
        data: {
          serverId: server.id,
          profileId: adminProfile.id,
          name: channelName,
          type: "TEXT",
          orgUnitId: orgUnitId,
        },
      });
    } else if (ch.orgUnitId !== orgUnitId) {
      ch = await db.channel.update({
        where: { id: ch.id },
        data: { orgUnitId },
      });
    }
    return ch;
  }

  const chDomestic = await ensureChannel("kinh-doanh-noi-dia", teamDomestic.id);
  const chGlobal = await ensureChannel("kinh-doanh-quoc-te", teamGlobal.id);
  const chBackend = await ensureChannel("nen-tang-cloud", teamBackend.id);
  const chQA = await ensureChannel("qa-ha-tang", teamQA.id);
  console.log("Team Private Discord Channels configured.");

  // 4. Seed 25 Enterprise Personnel (Mixed Vietnamese & International)
  const personnelList = [
    // 4 Key Demo Accounts
    {
      code: "EMP001",
      name: "Nguyễn Minh Thiện",
      email: "thien.nguyen@congty.com",
      title: "Chuyên viên Quản trị & Nhân sự (HR Lead)",
      orgId: null,
      role: "MEMBER",
      isHr: true,
      hiredOn: "2021-03-01",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    {
      code: "EMP002",
      name: "Trần Văn Hùng",
      email: "hung.tran@congty.com",
      title: "Trưởng phòng Công Nghệ (CTO/Head)",
      orgId: deptTech.id,
      role: "HEAD",
      isHr: false,
      hiredOn: "2020-01-15",
      workedDays: 21.5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    {
      code: "EMP003",
      name: "Sarah Chen",
      email: "sarah.chen@congty.com",
      title: "Tổ trưởng Nền Tảng & Cloud (Lead)",
      orgId: teamBackend.id,
      role: "LEAD",
      isHr: false,
      hiredOn: "2022-04-10",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    },
    {
      code: "EMP004",
      name: "Lê Hoàng Long",
      email: "long.le@congty.com",
      title: "Chuyên viên Kinh Doanh Nội Địa (Member)",
      orgId: teamDomestic.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-08-01",
      workedDays: 20.0,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },

    // Department Heads & Team Leads
    {
      code: "EMP005",
      name: "Nguyễn Thị Mai",
      email: "mai.nguyen@congty.com",
      title: "Trưởng phòng Kinh Doanh (Head of Sales)",
      orgId: deptSales.id,
      role: "HEAD",
      isHr: false,
      hiredOn: "2020-05-20",
      workedDays: 21.0,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    },
    {
      code: "EMP006",
      name: "Đặng Quốc Bảo",
      email: "bao.dang@congty.com",
      title: "Tổ trưởng Kinh Doanh Nội Địa (Lead)",
      orgId: teamDomestic.id,
      role: "LEAD",
      isHr: false,
      hiredOn: "2021-11-15",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
    },
    {
      code: "EMP007",
      name: "Emily Carter",
      email: "emily.carter@congty.com",
      title: "Tổ trưởng Kinh Doanh Quốc Tế (Global Lead)",
      orgId: teamGlobal.id,
      role: "LEAD",
      isHr: false,
      hiredOn: "2022-01-10",
      workedDays: 21.5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    },
    {
      code: "EMP008",
      name: "Vũ Đình Trọng",
      email: "trong.vu@congty.com",
      title: "Tổ trưởng QA & Hạ Tầng (Lead)",
      orgId: teamQA.id,
      role: "LEAD",
      isHr: false,
      hiredOn: "2021-07-01",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    },
    {
      code: "EMP009",
      name: "Phạm Thu Hà",
      email: "ha.pham@congty.com",
      title: "Chuyên viên Quan hệ Lao động & Đãi ngộ",
      orgId: null,
      role: "MEMBER",
      isHr: true,
      hiredOn: "2022-09-15",
      workedDays: 21.0,
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
    },

    // Backend & Cloud Team Members
    {
      code: "EMP010",
      name: "Kim Min-jun",
      email: "minjun.kim@congty.com",
      title: "Senior Backend Engineer (Python & Go)",
      orgId: teamBackend.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2022-10-01",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    },
    {
      code: "EMP011",
      name: "David Miller",
      email: "david.miller@congty.com",
      title: "Cloud & DevOps Specialist (Kubernetes)",
      orgId: teamBackend.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-02-15",
      workedDays: 20.5,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    },
    {
      code: "EMP012",
      name: "Trần Thị Bích",
      email: "bich.tran@congty.com",
      title: "Fullstack Engineer (React & Node.js)",
      orgId: teamBackend.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-05-10",
      workedDays: 21.0,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    {
      code: "EMP013",
      name: "Hoàng Văn Tuấn",
      email: "tuan.hoang@congty.com",
      title: "AI & Speech-to-Text Engineer",
      orgId: teamBackend.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-11-01",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
    },

    // QA & Infrastructure Team Members
    {
      code: "EMP014",
      name: "Priya Sharma",
      email: "priya.sharma@congty.com",
      title: "Senior QA Automation Engineer",
      orgId: teamQA.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2022-08-20",
      workedDays: 21.5,
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150",
    },
    {
      code: "EMP015",
      name: "Đỗ Thành Đạt",
      email: "dat.do@congty.com",
      title: "Quality Assurance Specialist",
      orgId: teamQA.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-04-01",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    },
    {
      code: "EMP016",
      name: "Bùi Phương Thảo",
      email: "thao.bui@congty.com",
      title: "Load & Security Testing Specialist",
      orgId: teamQA.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-09-12",
      workedDays: 19.5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    },
    {
      code: "EMP017",
      name: "Michael Chang",
      email: "michael.chang@congty.com",
      title: "Infrastructure & Security Engineer",
      orgId: teamQA.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2024-01-15",
      workedDays: 21.0,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },

    // Domestic Sales Team Members
    {
      code: "EMP018",
      name: "Ngô Gia Huy",
      email: "huy.ngo@congty.com",
      title: "Senior Account Executive",
      orgId: teamDomestic.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2022-03-01",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
    {
      code: "EMP019",
      name: "Dương Thùy Linh",
      email: "linh.duong@congty.com",
      title: "Enterprise Sales Consultant",
      orgId: teamDomestic.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2022-11-15",
      workedDays: 21.0,
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
    },
    {
      code: "EMP020",
      name: "Lý Tuấn Kiệt",
      email: "kiet.ly@congty.com",
      title: "Customer Success Representative",
      orgId: teamDomestic.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-06-01",
      workedDays: 20.0,
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
    },
    {
      code: "EMP021",
      name: "Võ Minh Khôi",
      email: "khoi.vo@congty.com",
      title: "Sales Operations Specialist",
      orgId: teamDomestic.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2024-02-01",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    },

    // Global Sales Team Members
    {
      code: "EMP022",
      name: "Jessica Taylor",
      email: "jessica.taylor@congty.com",
      title: "Global Enterprise Executive (Americas)",
      orgId: teamGlobal.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2022-06-15",
      workedDays: 21.5,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    },
    {
      code: "EMP023",
      name: "Takeshi Sato",
      email: "takeshi.sato@congty.com",
      title: "Japan & Asia Market Specialist",
      orgId: teamGlobal.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-01-10",
      workedDays: 22.0,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    },
    {
      code: "EMP024",
      name: "Hà Thị Yến",
      email: "yen.ha@congty.com",
      title: "International Partnership Specialist",
      orgId: teamGlobal.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-07-20",
      workedDays: 20.5,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    },
    {
      code: "EMP025",
      name: "Carlos Rodriguez",
      email: "carlos.rodriguez@congty.com",
      title: "EMEA Regional Sales Director",
      orgId: teamGlobal.id,
      role: "MEMBER",
      isHr: false,
      hiredOn: "2023-10-05",
      workedDays: 21.0,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  ];

  console.log(`Seeding ${personnelList.length} personnel profiles...`);
  const profileIdMap = {};

  for (const p of personnelList) {
    let prof = await db.profile.findFirst({ where: { email: p.email } });
    if (!prof) {
      prof = await db.profile.create({
        data: {
          userId: `user_${p.code.toLowerCase()}`,
          name: p.name,
          email: p.email,
          imageUrl: p.avatar,
        },
      });
    } else {
      prof = await db.profile.update({
        where: { id: prof.id },
        data: { name: p.name, imageUrl: p.avatar },
      });
    }
    profileIdMap[p.code] = prof.id;

    // Server membership
    const sMember = await db.member.findFirst({
      where: { serverId: server.id, profileId: prof.id },
    });
    if (!sMember) {
      await db.member.create({
        data: {
          serverId: server.id,
          profileId: prof.id,
          role: p.isHr || p.role === "HEAD" ? "ADMIN" : p.role === "LEAD" ? "MODERATOR" : "GUEST",
        },
      });
    }

    // EmployeeProfile
    const emp = await db.employeeProfile.upsert({
      where: { employeeCode: p.code },
      update: {
        jobTitle: p.title,
        hiredOn: new Date(p.hiredOn),
        employmentStatus: "ACTIVE",
        isHr: p.isHr,
      },
      create: {
        profileId: prof.id,
        employeeCode: p.code,
        jobTitle: p.title,
        hiredOn: new Date(p.hiredOn),
        employmentStatus: "ACTIVE",
        isHr: p.isHr,
      },
    });

    // Attendance record
    const monthDate = new Date("2026-10-01T00:00:00.000Z");
    await db.attendanceRecord.upsert({
      where: {
        employeeProfileId_month: {
          employeeProfileId: emp.id,
          month: monthDate,
        },
      },
      update: {
        workedDays: p.workedDays,
      },
      create: {
        employeeProfileId: emp.id,
        month: monthDate,
        workedDays: p.workedDays,
        source: "CSV",
      },
    });

    // Org Unit Member
    if (p.orgId) {
      await db.orgUnitMember.upsert({
        where: {
          orgUnitId_profileId: {
            orgUnitId: p.orgId,
            profileId: prof.id,
          },
        },
        update: {
          role: p.role,
          isPrimary: true,
        },
        create: {
          orgUnitId: p.orgId,
          profileId: prof.id,
          role: p.role,
          isPrimary: true,
        },
      });
    }
  }
  console.log("All 25 Employee Profiles, Org memberships, and Attendance records seeded!");

  // 5. Seed 12 Authentic Company Bulletin Posts (B5)
  // Categories: Nhân sự, Pháp luật, Công ty
  async function ensureCategory(name) {
    let cat = await db.postCategory.findFirst({ where: { name } });
    if (!cat) {
      cat = await db.postCategory.create({ data: { name } });
    }
    return cat;
  }

  const catHr = await ensureCategory("Nhân sự");
  const catLaw = await ensureCategory("Pháp luật");
  const catCorp = await ensureCategory("Công ty");

  const authorHrId = profileIdMap["EMP001"]; // Minh Thiện

  const bulletinPosts = [
    // NHÂN SỰ (4 posts)
    {
      categoryId: catHr.id,
      title: "Chính Sách Làm Việc Linh Hoạt (Hybrid Work) Và Đăng Ký Lịch Tuần",
      body: "Nhằm tối ưu hóa hiệu suất và cân bằng công việc, công ty áp dụng chính sách làm việc kết hợp (Hybrid Work). Nhân viên có thể đăng ký tối đa 2 ngày làm việc từ xa mỗi tuần thông qua sự phê duyệt của Tổ trưởng trực tiếp. Vui lòng cập nhật trạng thái làm việc trước 17h thứ Sáu hàng tuần.",
      isPinned: true,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catHr.id,
      title: "Thông Báo Lịch Khám Sức Khỏe Định Kỳ Doanh Nghiệp Năm 2026",
      body: "Chương trình khám sức khỏe định kỳ hàng năm cho toàn thể nhân viên sẽ diễn ra từ ngày 15/11 đến 20/11 tại Bệnh viện Đa khoa Quốc tế. Gói khám bao gồm đầy đủ xét nghiệm chuyên sâu, tầm soát chức năng và tư vấn dinh dưỡng y khoa. Nhân viên vui lòng kiểm tra khung giờ cụ thể theo danh sách phòng ban.",
      isPinned: false,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catHr.id,
      title: "Khởi Động Chương Trình Đào Tạo AI & Kỹ Năng Số Hóa Nội Bộ",
      body: "Phòng Nhân sự phối hợp cùng Phòng Công Nghệ tổ chức chuỗi hội thảo chuyên đề 'Ứng Dụng Mô Hình AI Tạo Sinh Trong Tự Động Hóa Công Việc Hàng Ngày'. Khóa học được thiết kế dành cho mọi phòng ban từ Kinh Doanh đến Vận Hành, kéo dài 4 tuần vào các chiều thứ Tư.",
      isPinned: false,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catHr.id,
      title: "Vinh Danh Cá Nhân & Tập Thể Xuất Sắc Quý 3/2026",
      body: "Ban Giám Đốc xin chúc mừng Tổ Backend & AI (Phòng Công Nghệ) và Tổ Kinh Doanh Quốc Tế (Phòng Kinh Doanh) đã hoàn thành xuất sắc các chỉ tiêu trọng điểm trong Quý 3. Phần thưởng chuyên đề và cúp lưu niệm sẽ được trao tại buổi gặp mặt toàn thể sắp tới.",
      isPinned: false,
      audienceOrgUnitId: null,
    },

    // PHÁP LUẬT (4 posts)
    {
      categoryId: catLaw.id,
      title: "Quy Chế Tuân Thủ Bảo Vệ Dữ Liệu Cá Nhân Theo Nghị Định 13/2023/NĐ-CP",
      body: "Doanh nghiệp cam kết tuân thủ nghiêm ngặt quy định về bảo vệ dữ liệu cá nhân. Toàn bộ các buổi họp trực tuyến có thu âm hoặc ghi hình bắt buộc phải phát thông báo và nhận được sự đồng thuận 100% của người tham gia. Dữ liệu âm thanh và hồ sơ nhân sự chỉ được lưu trữ và truy cập đúng phân quyền.",
      isPinned: true,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catLaw.id,
      title: "Quy Định Về Bảo Mật Tài Sản Trí Tuệ & Dữ Liệu Mã Nguồn Dự Án",
      body: "Mọi mã nguồn, tài liệu thiết kế, dữ liệu huấn luyện AI và thông tin khách hàng đều thuộc quyền sở hữu trí tuệ của doanh nghiệp. Nghiêm cấm chia sẻ hoặc sao chép ra khỏi hạ tầng được quản lý khi chưa có văn bản phê duyệt của Trưởng phòng Công nghệ.",
      isPinned: false,
      audienceOrgUnitId: deptTech.id, // dành riêng cho phòng Công nghệ
    },
    {
      categoryId: catLaw.id,
      title: "Bộ Quy Tắc Ứng Xử & Đạo Đức Nghề Nghiệp Trong Môi Trường Số",
      body: "Quy định chuẩn mực giao tiếp trong các kênh thảo luận Discord và văn bản doanh nghiệp: Tôn trọng sự đa dạng văn hóa của đồng nghiệp đa quốc gia, giữ tính chuyên nghiệp, minh bạch và lịch sự trong mọi luồng trao đổi nội bộ.",
      isPinned: false,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catLaw.id,
      title: "Hướng Dẫn Tuân Thủ An Toàn Thông Tin Khi Làm Việc Từ Xa",
      body: "Khi làm việc ngoài văn phòng, nhân viên bắt buộc bật xác thực 2 bước (2FA), kết nối qua VPN nội bộ công ty và không sử dụng mạng Wi-Fi công cộng mở khi xử lý tài liệu mật hoặc cơ sở dữ liệu khách hàng.",
      isPinned: false,
      audienceOrgUnitId: null,
    },

    // CÔNG TY (4 posts)
    {
      categoryId: catCorp.id,
      title: "Thông Điệp Của Ban Lãnh Đạo Về Chiến Lược Chuyển Đổi Số Toàn Diện",
      body: "Năm 2026 đánh dấu bước chuyển mình quan trọng khi toàn bộ hoạt động giao tiếp, quản lý công việc và họp hội nghị của công ty được chuyển đổi số trên nền tảng tích hợp trí tuệ nhân tạo. Ban Lãnh đạo tin tưởng toàn thể đội ngũ sẽ tiên phong thích ứng và tạo ra đột phá mới.",
      isPinned: true,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catCorp.id,
      title: "Kế Hoạch Tổ Chức Ngày Hội Văn Hóa Doanh Nghiệp (Enterprise Culture Day)",
      body: "Sự kiện thường niên kỷ niệm thành lập công ty sẽ diễn ra vào cuối tháng này với chủ đề 'Kết Nối Đa Biên Giới'. Rất nhiều hoạt động giao lưu văn hóa, mini-hackathon và tiệc gala đang chờ đón các thành viên từ khắp các chi nhánh tham gia.",
      isPinned: false,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catCorp.id,
      title: "Cập Nhật Tiến Độ Triển Khai Không Gian Số Lark Base",
      body: "Hệ thống quản lý công việc Lark Base với hai góc nhìn Grid Table và Kanban đã chính thức đi vào hoạt động tại các phòng ban. Tính năng liên kết tự động việc cần làm từ biên bản cuộc họp AI giúp giảm 80% thời gian ghi chép thủ công.",
      isPinned: false,
      audienceOrgUnitId: null,
    },
    {
      categoryId: catCorp.id,
      title: "Hướng Dẫn Sử Dụng Nền Tảng Họp Trực Tuyến & Phiên Dịch AI Song Ngữ",
      body: "Để chuẩn bị cho các cuộc họp song ngữ Việt - Anh, thành viên vui lòng bật tính năng 'Phụ đề CC' trên thanh điều khiển. Hệ thống sẽ tự động lắng nghe và dịch thuật phụ đề thời gian thực theo đúng từ điển GlossaryTerm của doanh nghiệp.",
      isPinned: false,
      audienceOrgUnitId: null,
    },
  ];

  console.log("Seeding 12 Company Bulletin Posts...");
  for (const post of bulletinPosts) {
    let existingPost = await db.post.findFirst({
      where: { title: post.title },
    });
    if (!existingPost) {
      existingPost = await db.post.create({
        data: {
          authorId: authorHrId,
          categoryId: post.categoryId,
          title: post.title,
          body: post.body,
          isPinned: post.isPinned,
          audienceOrgUnitId: post.audienceOrgUnitId,
        },
      });
    }

    // Mark as read by a few demo employees
    await db.postRead.upsert({
      where: {
        postId_profileId: {
          postId: existingPost.id,
          profileId: authorHrId,
        },
      },
      update: {},
      create: {
        postId: existingPost.id,
        profileId: authorHrId,
      },
    });
  }
  console.log("12 Company Bulletin posts seeded with read tracking!");

  // 6. Seed Sample Meeting with Action Items & Evidence Quotes (B6 & B7)
  let sampleMeeting = await db.meeting.findFirst({
    where: { code: "hop-chien-luoc-ai" },
  });

  if (!sampleMeeting) {
    sampleMeeting = await db.meeting.create({
      data: {
        code: "hop-chien-luoc-ai",
        title: "Họp Chiến Lược: Đánh Giá Tiến Độ Hệ Thống Phòng Họp AI & Phiên Dịch",
        hostId: "user_seed_admin",
        status: "SCHEDULED",
        orgUnitId: teamBackend.id,
        recordingNoticeBy: authorHrId,
        recordingNoticeAt: new Date(),
      },
    });
  } else {
    sampleMeeting = await db.meeting.update({
      where: { id: sampleMeeting.id },
      data: {
        orgUnitId: teamBackend.id,
        recordingNoticeBy: authorHrId,
        recordingNoticeAt: new Date(),
      },
    });
  }

  // Meeting Participants
  const participantsData = [
    { name: "Nguyễn Minh Thiện", userId: "user_seed_admin", role: "HOST", consent: "AGREED" },
    { name: "Sarah Chen", userId: "user_emp003", role: "COHOST", consent: "AGREED" },
    { name: "Kim Min-jun", userId: "user_emp010", role: "MEMBER", consent: "AGREED" },
  ];

  for (const p of participantsData) {
    let part = await db.participant.findFirst({
      where: { meetingId: sampleMeeting.id, name: p.name },
    });
    if (!part) {
      await db.participant.create({
        data: {
          meetingId: sampleMeeting.id,
          name: p.name,
          userId: p.userId,
          role: p.role,
          consentStatus: p.consent,
          respondedAt: new Date(),
        },
      });
    } else {
      await db.participant.update({
        where: { id: part.id },
        data: { consentStatus: p.consent, respondedAt: new Date() },
      });
    }
  }

  // 7. Seed Lark Base Tasks across 4 Teams with Evidence Text
  const enterpriseTasks = [
    // Backend & Cloud Team Tasks
    {
      title: "Tối ưu hóa độ trễ mô hình nhận dạng tiếng Việt dưới 2 giây",
      description: "Điều chỉnh pipeline VIVOS và bộ đệm âm thanh Whisper để giảm độ trễ STT khi phát biểu.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      orgUnitId: teamBackend.id,
      assigneeId: profileIdMap["EMP003"], // Sarah Chen
      assigneeName: "Sarah Chen",
      deadlineText: "thứ 6 tuần này",
      dueDate: new Date(Date.now() + 86400000 * 4),
      evidenceText: "Chúng ta cần đưa độ trễ nhận dạng giọng nói xuống dưới ba giây trước buổi nghiệm thu thứ 6.",
      meetingId: sampleMeeting.id,
    },
    {
      title: "Triển khai Egress Template 720p vào bucket R2 Singapore",
      description: "Cấu hình webhook egress ghi hình composite video và đồng bộ link download về database.",
      status: "DONE",
      priority: "MEDIUM",
      orgUnitId: teamBackend.id,
      assigneeId: profileIdMap["EMP010"], // Kim Min-jun
      assigneeName: "Kim Min-jun",
      deadlineText: "đã hoàn thành",
      dueDate: new Date(Date.now() - 86400000 * 2),
      evidenceText: "Phần ghi hình Egress cần lưu vào kho Singapore để người tham gia tải lại nhanh nhất.",
      meetingId: sampleMeeting.id,
    },
    {
      title: "Bổ sung từ điển thuật ngữ GlossaryTerm cho các từ viết tắt kỹ thuật",
      description: "Thêm cặp từ STT, WebRTC, Egress, Latency vào cơ chế ép dịch của LLM.",
      status: "TODO",
      priority: "MEDIUM",
      orgUnitId: teamBackend.id,
      assigneeId: profileIdMap["EMP013"], // Hoàng Văn Tuấn
      assigneeName: "Hoàng Văn Tuấn",
      deadlineText: "thứ 4 tuần tới",
      dueDate: new Date(Date.now() + 86400000 * 7),
      evidenceText: "Tuyệt vời, từ điển thuật ngữ GlossaryTerm đã đồng bộ tốt với các từ kỹ thuật chưa?",
      meetingId: sampleMeeting.id,
    },

    // QA & Infrastructure Team Tasks
    {
      title: "Kiểm thử kết nối phòng họp 20 người đồng thời",
      description: "Chạy kịch bản tải mô phỏng 20 client kết nối WebRTC audio và video cùng lúc.",
      status: "TODO",
      priority: "HIGH",
      orgUnitId: teamQA.id,
      assigneeId: profileIdMap["EMP014"], // Priya Sharma
      assigneeName: "Priya Sharma",
      deadlineText: "chủ nhật này",
      dueDate: new Date(Date.now() + 86400000 * 6),
      evidenceText: "Bên QA sẽ chạy kịch bản thử nghiệm tải với 20 người dùng cùng lúc.",
      meetingId: sampleMeeting.id,
    },
    {
      title: "Đo đạc chỉ số WER trên bộ dữ liệu kiểm thử VIVOS",
      description: "Tính tỷ lệ lỗi từ (Word Error Rate) trên tập test 760 câu của VIVOS.",
      status: "DONE",
      priority: "MEDIUM",
      orgUnitId: teamQA.id,
      assigneeId: profileIdMap["EMP015"], // Đỗ Thành Đạt
      assigneeName: "Đỗ Thành Đạt",
      deadlineText: "tuần trước",
      dueDate: new Date(Date.now() - 86400000 * 3),
      evidenceText: "Bên mình cần đo chính xác tỷ lệ WER để đưa vào báo cáo nghiệm thu.",
      meetingId: sampleMeeting.id,
    },
    {
      title: "Kiểm toán bảo mật quyền truy cập hồ sơ nhân sự (Security Audit)",
      description: "Rà soát ma trận 5 quan hệ, bảo đảm tuyệt đối không lộ ngày công ra ngoài tổ chuyên môn.",
      status: "OVERDUE",
      priority: "HIGH",
      orgUnitId: teamQA.id,
      assigneeId: profileIdMap["EMP017"], // Michael Chang
      assigneeName: "Michael Chang",
      deadlineText: "hôm qua (Quá hạn)",
      dueDate: new Date(Date.now() - 86400000),
      evidenceText: "Cần kiểm tra kỹ chính sách ba tầng để phòng ngừa rò rỉ dữ liệu cá nhân.",
      meetingId: sampleMeeting.id,
    },

    // Domestic Sales Team Tasks
    {
      title: "Soạn thảo tài liệu hướng dẫn sử dụng tính năng phiên dịch cho nhân sự",
      description: "Viết cẩm nang 2 trang hướng dẫn bật phụ đề CC và chọn ngôn ngữ nói.",
      status: "OVERDUE",
      priority: "MEDIUM",
      orgUnitId: teamDomestic.id,
      assigneeId: profileIdMap["EMP004"], // Lê Hoàng Long
      assigneeName: "Lê Hoàng Long",
      deadlineText: "3 ngày trước (Quá hạn)",
      dueDate: new Date(Date.now() - 86400000 * 3),
      evidenceText: "Cần có hướng dẫn ngắn cho nhân viên mới vào họp biết cách bật dải phụ đề CC.",
      meetingId: sampleMeeting.id,
    },
    {
      title: "Thuyết trình demo giải pháp phòng họp thông minh cho đối tác nội địa",
      description: "Trình diễn trực tiếp khả năng nhận diện tiếng Việt và tóm tắt biên bản tự động.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      orgUnitId: teamDomestic.id,
      assigneeId: profileIdMap["EMP006"], // Đặng Quốc Bảo
      assigneeName: "Đặng Quốc Bảo",
      deadlineText: "thứ 5 tuần này",
      dueDate: new Date(Date.now() + 86400000 * 3),
      evidenceText: "Tuần này team kinh doanh nội địa sẽ có buổi trình diễn sản phẩm cho khách hàng.",
      meetingId: sampleMeeting.id,
    },

    // Global Sales Team Tasks
    {
      title: "Gặp gỡ khách hàng thị trường Nhật Bản qua phiên dịch đa ngữ",
      description: "Thực hiện phiên làm việc song ngữ Anh - Nhật sử dụng dải phụ đề thời gian thực.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      orgUnitId: teamGlobal.id,
      assigneeId: profileIdMap["EMP023"], // Takeshi Sato
      assigneeName: "Takeshi Sato",
      deadlineText: "thứ 6 tuần tới",
      dueDate: new Date(Date.now() + 86400000 * 8),
      evidenceText: "Khách hàng Nhật rất quan tâm đến tính năng dịch tức thời trong cuộc họp.",
      meetingId: sampleMeeting.id,
    },
    {
      title: "Xây dựng biểu giá dịch vụ phòng họp trực tuyến cho thị trường EMEA",
      description: "Lập bảng phân tích chi phí máy chủ LiveKit và định giá gói doanh nghiệp toàn cầu.",
      status: "TODO",
      priority: "MEDIUM",
      orgUnitId: teamGlobal.id,
      assigneeId: profileIdMap["EMP007"], // Emily Carter
      assigneeName: "Emily Carter",
      deadlineText: "cuối tháng 11",
      dueDate: new Date(Date.now() + 86400000 * 15),
      evidenceText: "Chúng ta cần chuẩn bị phương án giá cạnh tranh cho thị trường quốc tế.",
      meetingId: sampleMeeting.id,
    },
  ];

  console.log("Seeding Lark Base Tasks across 4 teams with evidence_text quotes...");
  for (const t of enterpriseTasks) {
    let existing = await db.task.findFirst({
      where: { title: t.title, orgUnitId: t.orgUnitId },
    });
    if (!existing) {
      await db.task.create({
        data: {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          orgUnitId: t.orgUnitId,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName,
          dueDate: t.dueDate,
          deadlineText: t.deadlineText,
          evidenceText: t.evidenceText,
          meetingId: t.meetingId,
          isHumanConfirmed: true,
        },
      });
    }
  }

  console.log("\n=======================================================");
  console.log("🎉 SEEDING COMPLETE! ALL SPECIFICATIONS MET:");
  console.log(" - 2 Departments, 4 Teams linked to Private Channels");
  console.log(" - 25 Personnel with Employee Profiles, Tenure & Attendance");
  console.log(" - 12 Company Bulletin Posts (Nhân sự, Pháp luật, Công ty)");
  console.log(" - 10 Lark Base Tasks across all teams with quotes");
  console.log(" - Meeting consent workflow under Nghị định 13/2023/NĐ-CP");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
  })
  .finally(() => db.$disconnect());
