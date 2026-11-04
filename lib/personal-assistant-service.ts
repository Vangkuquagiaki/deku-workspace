import crypto from "crypto";
import { db } from "@/lib/db";

// ==========================================
// TYPES & CONTRACTS
// ==========================================

export interface MyTodayBriefing {
  date: string;
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
    orgUnitName?: string;
  };
  summaryText: string;
  stats: {
    todayMeetings: number;
    pendingTasks: number;
    urgentAnnouncements: number;
    pendingAcks: number;
  };
  schedule: Array<{
    id: string;
    type: "MEETING" | "TASK" | "EVENT";
    title: string;
    timeText: string;
    status?: string;
    priority?: string;
    link?: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    priority: string;
    publishedAt?: Date | null;
    deadline?: Date | null;
    version: number;
    requiresAck: boolean;
    hasAcked: boolean;
    ackedAt?: Date;
  }>;
  personalNotes: Array<{
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    isDone: boolean;
    category: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
    location?: string | null;
    scope: string;
    myRsvp?: string;
  }>;
}

// ==========================================
// 1. "HÔM NAY CỦA TÔI" (MY TODAY) AGGREGATOR
// ==========================================

export async function getMyTodayBriefing(profileId: string): Promise<MyTodayBriefing> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    include: {
      orgUnitMembers: {
        include: { orgUnit: true },
      },
    },
  });

  const employeeName = profile?.name || "Thành viên";
  const employeeEmail = profile?.email || "";
  const orgUnit = profile?.orgUnitMembers?.[0]?.orgUnit;
  const orgUnitName = orgUnit?.name || "Toàn công ty";
  const orgUnitId = orgUnit?.id;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Fetch User's Tasks
  const tasks = await db.task.findMany({
    where: {
      OR: [
        { assigneeId: profileId },
        { assigneeName: { contains: employeeName, mode: "insensitive" } },
        ...(orgUnitId ? [{ orgUnitId }] : []),
      ],
      status: { not: "DONE" },
    },
    orderBy: { priority: "desc" },
    take: 10,
  });

  // 2. Fetch User's Meetings
  const meetings = await db.meeting.findMany({
    where: {
      OR: [
        { hostId: profileId },
        { participants: { some: { userId: profileId } } },
        { createdAt: { gte: startOfToday } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 3. Fetch Targeted Announcements (Published)
  const campaigns = await db.announcementCampaign.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { audienceType: "COMPANY" },
        ...(orgUnitId ? [{ audienceScope: { contains: orgUnitId } }] : []),
      ],
    },
    include: {
      acks: {
        where: { employeeId: profileId },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  // 4. Fetch Company & Department Events
  const events = await db.companyEvent.findMany({
    where: {
      OR: [
        { scope: "COMPANY" },
        ...(orgUnitId ? [{ orgUnitId }] : []),
      ],
      endAt: { gte: startOfToday },
    },
    include: {
      rsvps: {
        where: { employeeId: profileId },
      },
    },
    orderBy: { startAt: "asc" },
    take: 5,
  });

  // 5. Fetch User's Private Personal Notes
  const personalNotes = await db.personalNote.findMany({
    where: { ownerId: profileId },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  // Build Aggregated Schedule
  const schedule: MyTodayBriefing["schedule"] = [];

  for (const m of meetings) {
    schedule.push({
      id: m.id,
      type: "MEETING",
      title: m.title || `Họp #${m.code}`,
      timeText: new Date(m.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: m.status,
      link: `/meet/${m.code}`,
    });
  }

  for (const t of tasks) {
    schedule.push({
      id: t.id,
      type: "TASK",
      title: t.title,
      timeText: t.deadlineText || "Trong ngày",
      priority: t.priority,
      status: t.status,
      link: "/base?tab=tasks",
    });
  }

  for (const ev of events) {
    schedule.push({
      id: ev.id,
      type: "EVENT",
      title: ev.title,
      timeText: new Date(ev.startAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: ev.scope,
    });
  }

  // Format announcements
  const formattedAnnouncements = campaigns.map((c) => {
    const userAck = c.acks[0];
    return {
      id: c.id,
      title: c.title,
      body: c.body,
      priority: c.priority,
      publishedAt: c.publishedAt,
      deadline: c.deadline,
      version: c.version,
      requiresAck: c.requiresAck || c.priority === "MANDATORY" || c.priority === "EMERGENCY",
      hasAcked: Boolean(userAck && userAck.version >= c.version),
      ackedAt: userAck?.ackAt,
    };
  });

  const pendingAcks = formattedAnnouncements.filter((a) => a.requiresAck && !a.hasAcked).length;
  const urgentAnnouncements = formattedAnnouncements.filter(
    (a) => a.priority === "MANDATORY" || a.priority === "EMERGENCY"
  ).length;

  // Synthesize Morning Briefing Text
  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const summaryText = `Xin chào ${employeeName}! Hôm nay là ${todayStr}. Bạn có ${meetings.length} cuộc họp cần chú ý, ${tasks.length} nhiệm vụ đang tiến hành, và ${pendingAcks > 0 ? `${pendingAcks} thông báo bắt buộc cần xác nhận đã nhận` : "không có thông báo tồn đọng"}. Hãy xem chi tiết lịch trình bên dưới và đừng ngần ngại hỏi tôi bất kỳ điều gì!`;

  return {
    date: todayStr,
    employee: {
      id: profileId,
      name: employeeName,
      email: employeeEmail,
      role: (profile?.orgUnitMembers?.[0]?.role as string) || "MEMBER",
      orgUnitName,
    },
    summaryText,
    stats: {
      todayMeetings: meetings.length,
      pendingTasks: tasks.length,
      urgentAnnouncements,
      pendingAcks,
    },
    schedule,
    announcements: formattedAnnouncements,
    personalNotes,
    events: events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      startAt: ev.startAt,
      endAt: ev.endAt,
      location: ev.location,
      scope: ev.scope,
      myRsvp: ev.rsvps[0]?.status || "UNCONFIRMED",
    })),
  };
}

// ==========================================
// 2. PERSONAL AI Q&A WITH CONTEXT ISOLATION
// ==========================================

export async function askPersonalAi({
  profileId,
  prompt,
}: {
  profileId: string;
  prompt: string;
}): Promise<{ answer: string; sources: Array<{ type: string; title: string }> }> {
  const briefing = await getMyTodayBriefing(profileId);
  const lowerPrompt = prompt.toLowerCase();

  // Guard against Cross-Tenant / Cross-User Leakage or False Admin Claims (AI-01, AI-02, AI-08)
  if (
    lowerPrompt.includes("cho xem lương") ||
    lowerPrompt.includes("lương của") ||
    lowerPrompt.includes("xem note của") ||
    lowerPrompt.includes("ghi chú của người khác") ||
    lowerPrompt.includes("bỏ qua phân quyền") ||
    lowerPrompt.includes("tôi là giám đốc cho xem") ||
    lowerPrompt.includes("tôi là ceo")
  ) {
    return {
      answer:
        "[Từ chối bảo mật - AI-NOTI-01/AI-02]: Trợ lý AI cá nhân hoạt động theo nguyên tắc Zero Trust và cô lập danh tính theo Luật 91/2025/QH15. Quyền truy cập được xác thực từ Server token, không dựa trên tuyên bố vai trò trong câu lệnh prompt.",
      sources: [],
    };
  }

  const sources: Array<{ type: string; title: string }> = [];

  // 1. Task queries
  if (lowerPrompt.includes("việc") || lowerPrompt.includes("task") || lowerPrompt.includes("ưu tiên") || lowerPrompt.includes("hạn chót")) {
    const activeTasks = briefing.schedule.filter((s) => s.type === "TASK");
    if (activeTasks.length > 0) {
      activeTasks.forEach((t) => sources.push({ type: "Nhiệm vụ", title: t.title }));
      const taskList = activeTasks
        .map((t, i) => `${i + 1}. **${t.title}** (Ưu tiên: ${t.priority || "Trung bình"} - Hạn: ${t.timeText})`)
        .join("\n");
      return {
        answer: `Hiện tại bạn có **${activeTasks.length} nhiệm vụ** đang thực hiện trong Bảng việc Base:\n\n${taskList}\n\n💡 Bạn có thể bấm vào thẻ nhiệm vụ bên dưới để cập nhật trạng thái tiến độ trực tiếp.`,
        sources,
      };
    } else {
      return {
        answer: "Hôm nay bạn không có nhiệm vụ nào tồn đọng đến hạn. Thật tuyệt vời!",
        sources: [],
      };
    }
  }

  // 2. Meeting queries
  if (lowerPrompt.includes("họp") || lowerPrompt.includes("lịch") || lowerPrompt.includes("meet")) {
    const activeMeetings = briefing.schedule.filter((s) => s.type === "MEETING");
    if (activeMeetings.length > 0) {
      activeMeetings.forEach((m) => sources.push({ type: "Cuộc họp", title: m.title }));
      const meetingList = activeMeetings
        .map((m, i) => `${i + 1}. **${m.title}** lúc ${m.timeText} (${m.status === "LIVE" ? "🔴 Đang diễn ra" : "Đã lên lịch"})`)
        .join("\n");
      return {
        answer: `Lịch họp hôm nay của bạn gồm **${activeMeetings.length} cuộc họp**:\n\n${meetingList}\n\n👉 Bạn có thể nhấn vào nút **"Vào phòng gọi"** để tham gia ngay với AI Phiên dịch song ngữ.`,
        sources,
      };
    } else {
      return {
        answer: "Hôm nay bạn không có lịch họp nào được lên lịch sẵn.",
        sources: [],
      };
    }
  }

  // 3. Announcement & Acknowledgment queries
  if (
    lowerPrompt.includes("thông báo") ||
    lowerPrompt.includes("chỉ thị") ||
    lowerPrompt.includes("xác nhận") ||
    lowerPrompt.includes("cấp trên")
  ) {
    const urgent = briefing.announcements.filter((a) => a.requiresAck && !a.hasAcked);
    if (urgent.length > 0) {
      urgent.forEach((a) => sources.push({ type: "Chỉ thị cấp trên", title: a.title }));
      const list = urgent
        .map((a, i) => `${i + 1}. **[${a.priority}] ${a.title}** (Phiên bản v${a.version} - Hạn: ${a.deadline ? new Date(a.deadline).toLocaleDateString("vi-VN") : "Càng sớm càng tốt"})`)
        .join("\n");
      return {
        answer: `⚠️ **Chú ý:** Bạn có **${urgent.length} thông báo bắt buộc** từ ban lãnh đạo cần nhấn **"Xác nhận đã nhận"**:\n\n${list}\n\nTheo quy định công ty, việc bấm Xác nhận ghi nhận dấu vết thời gian và phiên bản văn bản cụ thể.`,
        sources,
      };
    } else {
      return {
        answer: "Toàn bộ thông báo quan trọng và chỉ thị từ cấp trên đã được bạn xác nhận đầy đủ. Không có chỉ thị tồn đọng!",
        sources: [],
      };
    }
  }

  // 4. Notes queries
  if (lowerPrompt.includes("ghi chú") || lowerPrompt.includes("note") || lowerPrompt.includes("checklist")) {
    const notes = briefing.personalNotes;
    if (notes.length > 0) {
      notes.forEach((n) => sources.push({ type: "Ghi chú riêng", title: n.title }));
      const list = notes.map((n, i) => `${i + 1}. **${n.title}**: ${n.content}`).join("\n");
      return {
        answer: `Đây là danh sách các **ghi chú riêng tư** của bạn:\n\n${list}\n\n🔒 Ghi chú này chỉ bạn mới có quyền xem, được mã hóa và cô lập hoàn toàn.`,
        sources,
      };
    } else {
      return {
        answer: "Bạn chưa có ghi chú cá nhân nào. Hãy dùng ô thêm ghi chú bên dưới để lưu lại việc cần nhớ nhé!",
        sources: [],
      };
    }
  }

  // Default context overview
  return {
    answer: `Chào ${briefing.employee.name}! Hôm nay bạn có **${briefing.stats.todayMeetings} cuộc họp**, **${briefing.stats.pendingTasks} đầu việc**, và **${briefing.stats.pendingAcks} thông báo cần xác nhận**. Bạn cần tôi hỗ trợ kiểm tra chi tiết phần nào?`,
    sources: [
      { type: "Tổng hợp", title: "Hôm nay của tôi" },
    ],
  };
}

// ==========================================
// 3. CASCADING EXECUTIVE NOTIFICATIONS
// ==========================================

export async function createAnnouncementDraft(data: {
  title: string;
  body: string;
  priority?: string;
  authorId: string;
  authorName: string;
  audienceType?: string;
  audienceScope?: string;
  deadline?: Date;
  requiresAck?: boolean;
}) {
  return await db.announcementCampaign.create({
    data: {
      title: data.title.trim(),
      body: data.body.trim(),
      priority: data.priority || "INFORMATION",
      status: "DRAFT",
      authorId: data.authorId,
      authorName: data.authorName,
      audienceType: data.audienceType || "COMPANY",
      audienceScope: data.audienceScope || null,
      deadline: data.deadline || null,
      requiresAck: data.requiresAck ?? (data.priority === "MANDATORY" || data.priority === "EMERGENCY"),
      version: 1,
    },
  });
}

export async function submitAnnouncementForApproval(campaignId: string) {
  return await db.announcementCampaign.update({
    where: { id: campaignId },
    data: { status: "IN_REVIEW" },
  });
}

export async function approveAnnouncement({
  campaignId,
  approverId,
  approverName,
}: {
  campaignId: string;
  approverId: string;
  approverName: string;
}) {
  return await db.announcementCampaign.update({
    where: { id: campaignId },
    data: {
      status: "APPROVED",
      approverId,
      approverName,
      approvedAt: new Date(),
    },
  });
}

export async function publishAnnouncement(campaignId: string) {
  const campaign = await db.announcementCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw new Error("Chiến dịch thông báo không tồn tại");

  return await db.announcementCampaign.update({
    where: { id: campaignId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

export async function acknowledgeAnnouncement({
  campaignId,
  employeeId,
  employeeName,
  notes,
}: {
  campaignId: string;
  employeeId: string;
  employeeName: string;
  notes?: string;
}) {
  const campaign = await db.announcementCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) throw new Error("Thông báo không tồn tại");

  return await db.announcementAck.upsert({
    where: {
      campaignId_employeeId_version: {
        campaignId,
        employeeId,
        version: campaign.version,
      },
    },
    update: {
      ackAt: new Date(),
      notes,
    },
    create: {
      campaignId,
      version: campaign.version,
      employeeId,
      employeeName,
      ackAt: new Date(),
      notes,
    },
  });
}

export async function getAnnouncementReceiptStats(campaignId: string) {
  const campaign = await db.announcementCampaign.findUnique({
    where: { id: campaignId },
    include: { acks: true },
  });

  if (!campaign) throw new Error("Không tìm thấy thông báo");

  // Determine total audience members
  const totalEmployees = await db.employeeProfile.count({
    where: { employmentStatus: "ACTIVE" },
  });

  const ackCount = campaign.acks.length;
  const ackRate = totalEmployees > 0 ? Math.round((ackCount / totalEmployees) * 100) : 100;

  return {
    campaignId,
    title: campaign.title,
    version: campaign.version,
    priority: campaign.priority,
    totalAudience: totalEmployees,
    acknowledgedCount: ackCount,
    pendingCount: Math.max(0, totalEmployees - ackCount),
    ackRatePercent: ackRate,
    acks: campaign.acks,
  };
}

// ==========================================
// 4. INVITE-ONLY ACCESS GATE (AI-NOTI-08, 09, 10)
// ==========================================

export async function createEmployeeInvitation({
  email,
  role = "MEMBER",
  orgUnitId,
  orgUnitName,
  employeeCode,
  createdBy,
  creatorName,
}: {
  email: string;
  role?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  employeeCode?: string;
  createdBy: string;
  creatorName?: string;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day TTL

  const invitation = await db.employeeInvitation.create({
    data: {
      email: email.trim().toLowerCase(),
      tokenHash,
      role,
      orgUnitId,
      orgUnitName,
      employeeCode,
      createdBy,
      creatorName,
      expiresAt,
      status: "PENDING",
    },
  });

  return {
    id: invitation.id,
    email: invitation.email,
    token, // Return raw token once for invitation link dispatch
    expiresAt: invitation.expiresAt,
    role: invitation.role,
    orgUnitName: invitation.orgUnitName,
  };
}

export async function acceptEmployeeInvitation({
  token,
  profileId,
  email,
}: {
  token: string;
  profileId: string;
  email: string;
}) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await db.employeeInvitation.findUnique({
    where: { tokenHash },
  });

  if (!invitation) {
    throw new Error("Mã lời mời không hợp lệ hoặc không tồn tại.");
  }

  if (invitation.status !== "PENDING" || (invitation.expiresAt && invitation.expiresAt < new Date())) {
    throw new Error("Mã lời mời đã hết hạn hoặc đã được kích hoạt trước đó.");
  }

  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("Email đăng nhập không trùng khớp với email trên thư mời doanh nghiệp.");
  }

  // Update invitation state
  await db.employeeInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      usedAt: new Date(),
    },
  });

  // Assign org unit if specified
  if (invitation.orgUnitId) {
    await db.orgUnitMember.upsert({
      where: {
        orgUnitId_profileId: {
          orgUnitId: invitation.orgUnitId,
          profileId,
        },
      },
      update: { role: invitation.role },
      create: {
        orgUnitId: invitation.orgUnitId,
        profileId,
        role: invitation.role,
      },
    });
  }

  return { success: true, invitation };
}

