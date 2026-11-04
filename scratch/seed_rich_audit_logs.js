const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("🚀 Seeding rich enterprise audit logs for compliance...");

  const profiles = await db.profile.findMany();
  const primary = profiles[0];
  const sarah = profiles.find((p) => p.name.includes("Sarah")) || profiles[1];
  const alex = profiles.find((p) => p.name.includes("Alex")) || profiles[2];
  const thien = profiles.find((p) => p.name.includes("Thiện")) || profiles[0];

  const now = Date.now();
  const oneHour = 3600 * 1000;
  const oneDay = 24 * 3600 * 1000;

  const sampleLogs = [
    {
      action: "PROFILE_SENSITIVE_VIEW",
      targetType: "PROFILE",
      targetId: thien?.id || "p1",
      userId: thien?.userId || "user_self",
      detail: {
        viewer: thien?.name || "Minh Thiện",
        viewerRole: "MEMBER",
        viewedTarget: "Bản thân (Self Profile)",
        fieldsAccessed: ["personalInfo", "compensation", "bankAccount", "baseSalary"],
        purpose: "Kiểm tra phiếu lương & công nhật cá nhân hàng tháng",
        law: "Nghị định 13/2023/NĐ-CP Điều 9 (Quyền của chủ thể dữ liệu)",
      },
      createdAt: new Date(now - 15 * 60 * 1000), // 15 mins ago
    },
    {
      action: "TASK_CREATED_FROM_AI",
      targetType: "TASK",
      targetId: "task_egress_livekit",
      userId: sarah?.userId || "user_sarah",
      detail: {
        meetingCode: "hop-giao-ban-tuan",
        meetingTitle: "Họp Giao Ban Dự Án Hàng Tuần - Meeting Intelligence Platform",
        taskTitle: "Triển khai Egress Template 720p vào bucket R2 Singapore",
        assignee: thien?.name || "Minh Thiện",
        aiModel: "Whisper-Large-v3 + Gemini 1.5 Pro Flash",
        confidenceScore: 0.96,
        law: "Luật Giao dịch điện tử số 20/2023/QH15",
      },
      createdAt: new Date(now - 45 * 60 * 1000), // 45 mins ago
    },
    {
      action: "CONSENT_AGREED",
      targetType: "MEETING_CONSENT",
      targetId: "hop-giao-ban-tuan",
      userId: thien?.userId || "user_self",
      detail: {
        participantName: thien?.name || "Minh Thiện",
        meetingTitle: "Họp Giao Ban Dự Án Hàng Tuần",
        consentType: "AUDIO_RECORDING_AND_AI_TRANSCRIPTION",
        decree: "Nghị định 13/2023/NĐ-CP Điều 11 & Luật 91/2025/QH15",
        status: "AGREED",
        ipAddress: "118.69.182.102 (Viettel Telecom HCM)",
      },
      createdAt: new Date(now - 2 * oneHour),
    },
    {
      action: "CONSENT_AGREED",
      targetType: "MEETING_CONSENT",
      targetId: "hop-giao-ban-tuan",
      userId: sarah?.userId || "user_sarah",
      detail: {
        participantName: sarah?.name || "Sarah Chen",
        meetingTitle: "Họp Giao Ban Dự Án Hàng Tuần",
        consentType: "AUDIO_RECORDING_AND_AI_TRANSCRIPTION",
        decree: "Nghị định 13/2023/NĐ-CP & Luật 91/2025/QH15",
        status: "AGREED",
        ipAddress: "115.79.208.54 (FPT Telecom HCM)",
      },
      createdAt: new Date(now - 2 * oneHour + 5 * 60 * 1000),
    },
    {
      action: "LEAVE_APPROVED",
      targetType: "LEAVE_REQUEST",
      targetId: "leave_req_01",
      userId: sarah?.userId || "user_sarah",
      detail: {
        approver: sarah?.name || "Sarah Chen (Tech Lead)",
        requester: "Đỗ Thành Đạt",
        leaveType: "Nghỉ phép năm (Annual Leave)",
        durationDays: 2.0,
        reason: "Giải quyết việc gia đình",
        status: "APPROVED",
        policyCode: "AL-2026",
      },
      createdAt: new Date(now - 5 * oneHour),
    },
    {
      action: "PROFILE_SENSITIVE_VIEW",
      targetType: "PROFILE",
      targetId: alex?.id || "p2",
      userId: thien?.userId || "user_self",
      detail: {
        viewer: "HR Lead / Ban Giám Đốc",
        viewerRole: "HR",
        viewedTarget: alex?.name || "Alexandre Dumas",
        fieldsAccessed: ["personalInfo", "compensation", "idCardNumber", "address"],
        purpose: "Đối soát hồ sơ đóng bảo hiểm xã hội định kỳ tháng 11/2026",
        law: "Nghị định 13/2023/NĐ-CP Điều 17 (Xử lý dữ liệu nhạy cảm)",
      },
      createdAt: new Date(now - 8 * oneHour),
    },
    {
      action: "EMPLOYEE_TRANSFERRED",
      targetType: "EMPLOYEE",
      targetId: "emp_transfer_01",
      userId: thien?.userId || "user_self",
      detail: {
        employeeName: "Hoàng Văn Tuấn",
        fromUnit: "Tổ QA & Hạ Tầng",
        toUnit: "Tổ Nền Tảng & Cloud",
        effectiveDate: "2026-11-01",
        transferType: "PROMOTION",
        approver: "Ban Giám Đốc Công Nghệ",
      },
      createdAt: new Date(now - 1 * oneDay),
    },
    {
      action: "LEAVE_REQUEST_SUBMITTED",
      targetType: "LEAVE_REQUEST",
      targetId: "leave_req_02",
      userId: alex?.userId || "user_alex",
      detail: {
        requester: alex?.name || "Alexandre Dumas",
        leaveType: "Nghỉ phép năm",
        dates: "08/11/2026 - 09/11/2026",
        durationDays: 1.5,
        reason: "Khám sức khỏe tổng quát định kỳ",
      },
      createdAt: new Date(now - 1 * oneDay - 3 * oneHour),
    },
    {
      action: "PROFILE_ATTENDANCE_VIEW",
      targetType: "ATTENDANCE",
      targetId: "att_nov_2026",
      userId: thien?.userId || "user_self",
      detail: {
        viewerRole: "LEAD",
        viewedDepartment: "Tổ Nền Tảng & Cloud",
        month: "2026-11",
        totalWorkedDays: 22.0,
        purpose: "Kiểm tra ngày công tiêu chuẩn để nghiệm thu sprint",
      },
      createdAt: new Date(now - 2 * oneDay),
    },
    {
      action: "SECURITY_POLICY_UPDATE",
      targetType: "SYSTEM_SETTING",
      targetId: "policy_privacy_tier3",
      userId: thien?.userId || "user_self",
      detail: {
        policyName: "Bảo Mật Ma Trận 3 Tầng Dữ Liệu Nhân Sự (Lark Base 3-Tier)",
        updatedBy: "Admin Quản Trị Hệ Thống",
        changes: "Ẩn số tài khoản ngân hàng và mức lương với đồng nghiệp cùng tổ, chỉ hiển thị đầy đủ cho HR và chính chủ",
        complianceStandards: ["Nghị định 13/2023/NĐ-CP", "Luật 91/2025/QH15", "ISO/IEC 27001"],
      },
      createdAt: new Date(now - 3 * oneDay),
    },
    {
      action: "HR_IMPORT",
      targetType: "EMPLOYEE_BATCH",
      targetId: "batch_2026_q4",
      userId: thien?.userId || "user_self",
      detail: {
        fileName: "Danh_sach_nhan_su_Q4_2026.csv",
        recordsImported: 27,
        departments: ["Phòng Công Nghệ", "Phòng Kinh Doanh"],
        operator: "Nguyễn Minh Thiện (HR & Admin)",
        checksum: "sha256-8a7f9b2c3d4e",
      },
      createdAt: new Date(now - 4 * oneDay),
    },
    {
      action: "TASK_CREATED_FROM_AI",
      targetType: "TASK",
      targetId: "task_wer_benchmark",
      userId: sarah?.userId || "user_sarah",
      detail: {
        meetingCode: "hop-giao-ban-tuan",
        taskTitle: "Đo đạc chỉ số WER trên bộ dữ liệu kiểm thử VIVOS",
        assignee: "Đỗ Thành Đạt",
        deadline: "Thứ 6 tuần này",
        evidenceText: "Bên mình cần đo chính xác tỷ lệ WER để đưa vào báo cáo nghiệm thu.",
        confidenceScore: 0.98,
      },
      createdAt: new Date(now - 4 * oneDay - 2 * oneHour),
    },
  ];

  for (const log of sampleLogs) {
    await db.auditLog.create({
      data: {
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        actorId: log.userId,
        detail: log.detail,
        createdAt: log.createdAt,
      },
    });
  }

  const count = await db.auditLog.count();
  console.log(`✅ Seed finished! Total audit log entries in database: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
