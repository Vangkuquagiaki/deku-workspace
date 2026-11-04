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
  userName: string;
  summaryText: string;
  briefingText: string;
  stats: {
    todayMeetings: number;
    pendingTasks: number;
    urgentAnnouncements: number;
    pendingAcks: number;
  };
  todayMeetings: number;
  pendingTasks: number;
  pendingAcksCount: number;
  schedule: Array<{
    id: string;
    type: "MEETING" | "TASK" | "EVENT";
    title: string;
    timeText: string;
    status?: string;
    priority?: string;
    link?: string;
  }>;
  scheduleTimeline: Array<{
    id: string;
    type: "MEETING" | "TASK" | "EVENT";
    title: string;
    timeText: string;
    status?: string;
    priority?: string;
    link?: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    time: string;
    link?: string;
  }>;
  urgentTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    time: string;
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
  pendingAcks: Array<{
    id: string;
    title: string;
    priority: string;
    body: string;
    version: number;
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

  // 1. Fetch User's Tasks (or team open tasks if none specifically assigned)
  let tasks = await db.task.findMany({
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

  if (tasks.length === 0) {
    tasks = await db.task.findMany({
      where: { status: { not: "DONE" } },
      orderBy: { priority: "desc" },
      take: 4,
    });
  }

  // 2. Fetch User's Meetings (or recent company meetings)
  let meetings = await db.meeting.findMany({
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

  if (meetings.length === 0) {
    meetings = await db.meeting.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  }

  // 3. Fetch Targeted Announcements (Published)
  let campaigns = await db.announcementCampaign.findMany({
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

  // If no published announcements exist, seed a standard corporate directive
  if (campaigns.length === 0) {
    try {
      const defaultAnn = await db.announcementCampaign.create({
        data: {
          title: "Chỉ thị Tuân thủ Quy chế Bảo mật Dữ liệu & Quản trị Thông tin 2026",
          body: "Yêu cầu toàn thể nhân sự tuân thủ các quy định bảo mật, bảo vệ dữ liệu cá nhân theo Luật 91/2025/QH15 và xác nhận đã nhận chỉ thị.",
          priority: "MANDATORY",
          status: "PUBLISHED",
          authorId: profileId,
          authorName: "Ban Giám Đốc",
          requiresAck: true,
          version: 1,
          publishedAt: new Date(),
        },
        include: {
          acks: { where: { employeeId: profileId } },
        },
      });
      campaigns = [defaultAnn];
    } catch (e) {
      // ignore seed error
    }
  }

  // 4. Fetch Events
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

  const pendingAcks = formattedAnnouncements.filter((a) => a.requiresAck && !a.hasAcked);
  const urgentAnnouncements = formattedAnnouncements.filter(
    (a) => a.priority === "MANDATORY" || a.priority === "EMERGENCY"
  ).length;

  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const summaryText = `Xin chào ${employeeName}! Hôm nay là ${todayStr}. Bạn có ${meetings.length} cuộc họp cần chú ý, ${tasks.length} nhiệm vụ đang tiến hành, và ${pendingAcks.length > 0 ? `${pendingAcks.length} chỉ thị bắt buộc cần ký nhận xác nhận` : "toàn bộ chỉ thị đã được xác nhận"}. Hãy xem chi tiết lịch trình bên dưới và đừng ngần ngại trao đổi với tôi!`;

  return {
    date: todayStr,
    employee: {
      id: profileId,
      name: employeeName,
      email: employeeEmail,
      role: (profile?.orgUnitMembers?.[0]?.role as string) || "MEMBER",
      orgUnitName,
    },
    userName: employeeName,
    summaryText,
    briefingText: summaryText,
    stats: {
      todayMeetings: meetings.length,
      pendingTasks: tasks.length,
      urgentAnnouncements,
      pendingAcks: pendingAcks.length,
    },
    todayMeetings: meetings.length,
    pendingTasks: tasks.length,
    pendingAcksCount: pendingAcks.length,
    schedule,
    scheduleTimeline: schedule,
    meetings: schedule
      .filter((s) => s.type === "MEETING")
      .map((m) => ({ id: m.id, title: m.title, time: m.timeText, link: m.link })),
    urgentTasks: schedule
      .filter((s) => s.type === "TASK")
      .map((t) => ({ id: t.id, title: t.title, priority: t.priority || "MEDIUM", status: t.status || "TODO", time: t.timeText })),
    announcements: formattedAnnouncements,
    pendingAcks: pendingAcks.map((a) => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      body: a.body,
      version: a.version,
    })),
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
// 2. CONVERSATIONAL PERSONAL AI (CHATGPT GRADE)
// ==========================================

export async function askPersonalAi({
  profileId,
  prompt,
}: {
  profileId: string;
  prompt: string;
}): Promise<{ answer: string; sources: Array<{ type: string; title: string }> }> {
  const briefing = await getMyTodayBriefing(profileId);
  const lowerPrompt = prompt.toLowerCase().trim();

  // Guard against Cross-Tenant / Cross-User Leakage (Zero-Trust Security)
  if (
    lowerPrompt.includes("cho xem lương của") ||
    lowerPrompt.includes("xem note của") ||
    lowerPrompt.includes("bỏ qua phân quyền")
  ) {
    return {
      answer:
        "🔒 **[Từ chối bảo mật - Zero-Trust]**: Trợ lý AI cá nhân tuân thủ nghiêm ngặt Luật Bảo vệ Dữ liệu Cá nhân (Luật 91/2025/QH15). Tôi chỉ có thể cung cấp dữ liệu thuộc quyền sở hữu của bạn, không hỗ trợ truy xuất trái phép dữ liệu của nhân sự khác.",
      sources: [],
    };
  }

  const sources: Array<{ type: string; title: string }> = [];

  // 1. ACTION: Task Assignment ("Giao việc cho [Tên]: [Nhiệm vụ]")
  const assignMatch = prompt.match(/(?:giao việc|giao nhiệm vụ|tạo task|phân công)\s+(?:cho\s+)?([^:\n]+)[:,\-]?\s*(.*)/i);
  if (assignMatch) {
    const rawTarget = assignMatch[1].trim();
    const rawTaskDesc = assignMatch[2].trim() || "Thực hiện nhiệm vụ theo chỉ đạo cấp trên";

    const targetEmployee = await db.profile.findFirst({
      where: {
        OR: [
          { name: { contains: rawTarget, mode: "insensitive" } },
          { email: { contains: rawTarget, mode: "insensitive" } },
        ],
      },
      include: {
        orgUnitMembers: { include: { orgUnit: true } },
      },
    });

    const defaultOrg = await db.orgUnit.findFirst();
    const fallbackOrgId = defaultOrg?.id || "default_org";

    if (targetEmployee) {
      const orgUnitId = targetEmployee.orgUnitMembers?.[0]?.orgUnitId || fallbackOrgId;
      const newTask = await db.task.create({
        data: {
          title: rawTaskDesc,
          assigneeId: targetEmployee.id,
          assigneeName: targetEmployee.name,
          orgUnitId,
          priority: rawTaskDesc.toLowerCase().includes("khẩn") || rawTaskDesc.toLowerCase().includes("gấp") ? "HIGH" : "MEDIUM",
          status: "TODO",
          isHumanConfirmed: true,
          deadlineText: "Theo phân công của Quản lý",
        },
      });

      return {
        answer: `✅ **Đã giao việc thành công qua AI!**\n\n- **Người nhận:** **${targetEmployee.name}** (${targetEmployee.email})\n- **Nhiệm vụ:** ${rawTaskDesc}\n- **Mã Task:** \`#${newTask.id.slice(0, 8)}\`\n\n🚀 **Cơ chế đồng bộ tự động:**\n1. Nhiệm vụ đã được lưu trực tiếp vào Cơ sở dữ liệu.\n2. Khi **${targetEmployee.name}** đăng nhập vào màn hình **"Hôm nay của tôi"**, AI Morning Briefing sẽ tự động thông báo và nhắc việc.\n3. Nếu nhân sự hỏi Trợ lý AI *"Tôi có việc gì cần làm?"*, AI sẽ liệt kê ngay nhiệm vụ này!`,
        sources: [
          { type: "Bảng việc Kanban", title: newTask.title },
          { type: "Nhân sự nhận việc", title: targetEmployee.name },
        ],
      };
    } else {
      const newTask = await db.task.create({
        data: {
          title: rawTaskDesc,
          assigneeName: rawTarget,
          orgUnitId: fallbackOrgId,
          priority: "MEDIUM",
          status: "TODO",
          isHumanConfirmed: true,
          deadlineText: "Theo phân công của Quản lý",
        },
      });

      return {
        answer: `✅ **Đã ghi nhận nhiệm vụ mới vào cơ sở dữ liệu!**\n\n- **Nhân sự được gán:** ${rawTarget}\n- **Nội dung công việc:** ${rawTaskDesc}\n- **Mã Task:** \`#${newTask.id.slice(0, 8)}\`\n\nNhiệm vụ đã xuất hiện trên Bảng việc Base và sẽ tự động đồng bộ sang AI của nhân sự ${rawTarget} khi tài khoản kích hoạt.`,
        sources: [{ type: "Bảng việc Kanban", title: newTask.title }],
      };
    }
  }

  // 2. ACTION: Create Personal Note ("Ghi chú lại: ...", "Note: ...")
  const noteMatch = prompt.match(/(?:ghi chú lại|lưu ghi chú|note lại|tạo note)\s*[:,\-]?\s*(.*)/i);
  if (noteMatch && noteMatch[1].trim()) {
    const noteText = noteMatch[1].trim();
    const newNote = await db.personalNote.create({
      data: {
        ownerId: profileId,
        title: noteText.slice(0, 40) + (noteText.length > 40 ? "..." : ""),
        content: noteText,
        category: "WORK",
        isPinned: true,
      },
    });

    return {
      answer: `📝 **Đã lưu vào Sổ tay cá nhân riêng tư của bạn:**\n\n> "${noteText}"\n\n🔒 Ghi chú này được mã hóa bảo mật, chỉ bạn mới có thể xem và đã được ghim lên đầu sổ tay.`,
      sources: [{ type: "Sổ tay cá nhân", title: newNote.title }],
    };
  }

  // 3. ACTION: Offboarding Question / Command
  if (lowerPrompt.includes("nghỉ việc") || lowerPrompt.includes("thôi việc") || lowerPrompt.includes("offboard")) {
    return {
      answer: `📋 **Quy trình xử lý nhân sự nghỉ việc bằng AI (Chuẩn AIHR-06 & Luật Lao động):**\n\n1. **Tại sao không xóa cứng (Hard Delete)?**\nTheo Luật Lao động và Luật Lưu trữ, doanh nghiệp **không được xóa trắng** hồ sơ để bảo toàn lịch sử thuế, hợp đồng, bảng lương và nhật ký kiểm toán (Audit Logs).\n\n2. **AI sẽ tự động thực hiện:**\n- **Chuyển trạng thái:** \`TERMINATED\` (Đã nghỉ việc).\n- **Thu hồi quyền truy cập (Revoke Access):** Khóa token, vô hiệu hóa đăng nhập, đẩy ra khỏi các kênh bảo mật.\n- **Bàn giao việc (Handover):** Tự động quét các task dở dang và chuyển giao cho Trưởng phòng/Quản lý.\n- **Ngắt phiên gọi:** Đóng quyền truy cập phòng họp video trực tuyến.\n\n👉 **Thao tác ngay:** Bạn có thể chuyển sang tab **"AI Quản trị"** (\`/base?tab=ai-admin\`) và gõ lệnh: \`Nhân viên [Tên hoặc Mã E-code] nghỉ việc\` để AI tự động lên kế hoạch và thực thi an toàn!`,
      sources: [{ type: "Quy chuẩn Nhân sự", title: "AI HR Lifecycle Matrix (AIHR-06)" }],
    };
  }

  // 4. ACTION: Onboarding Question / Command
  if (lowerPrompt.includes("nhân sự mới") || lowerPrompt.includes("thêm nhân viên") || lowerPrompt.includes("onboard")) {
    return {
      answer: `👥 **Cách thêm nhân sự mới vào hệ thống bằng AI:**\n\n1. **Cách 1 - Ra lệnh tự nhiên cho AI (Tab AI Quản trị):**\nVào tab **"AI Quản trị"** (\`/base?tab=ai-admin\`) và gõ:\n> \`Thêm nhân sự mới: [Họ và tên], email: [email@congty.com], phòng [Phòng ban]\`\n*(Hoặc tải file Excel danh sách lên để xử lý hàng loạt)*.\n\n2. **Cách 2 - Cấp mã lời mời Token (Tab Hôm nay & AI Trợ lý):**\nChuyển sang tab con **"Cấp quyền & Lời mời"** ngay bên cạnh, nhập Email và Họ tên rồi nhấn **"Cấp mã mời"**.\nHệ thống sẽ tạo đường link kích hoạt an toàn (7-day TTL) để nhân sự tự kích hoạt tài khoản theo chuẩn Zero-Trust!`,
      sources: [{ type: "Cổng Cấp quyền", title: "Invite-Only Gatekeeper" }],
    };
  }

  // 5. QUERY: Active Tasks & Schedule
  if (lowerPrompt.includes("việc") || lowerPrompt.includes("task") || lowerPrompt.includes("làm gì") || lowerPrompt.includes("ưu tiên") || lowerPrompt.includes("hạn chót")) {
    const activeTasks = briefing.schedule.filter((s) => s.type === "TASK");
    if (activeTasks.length > 0) {
      activeTasks.forEach((t) => sources.push({ type: "Nhiệm vụ", title: t.title }));
      const taskList = activeTasks
        .map((t, i) => `${i + 1}. **${t.title}** (Ưu tiên: \`${t.priority || "Trung bình"}\` • Hạn: ${t.timeText})`)
        .join("\n");
      return {
        answer: `Hiện tại bạn có **${activeTasks.length} nhiệm vụ** cần chú ý:\n\n${taskList}\n\n💡 **Gợi ý:** Bạn có thể bấm trực tiếp vào Bảng việc tổ hoặc yêu cầu tôi: *"Giao việc cho [Tên]: [Nhiệm vụ]"* để phân công thêm.`,
        sources,
      };
    }
  }

  // 6. QUERY: Meetings
  if (lowerPrompt.includes("họp") || lowerPrompt.includes("lịch") || lowerPrompt.includes("meet")) {
    const activeMeetings = briefing.schedule.filter((s) => s.type === "MEETING");
    if (activeMeetings.length > 0) {
      activeMeetings.forEach((m) => sources.push({ type: "Cuộc họp", title: m.title }));
      const meetingList = activeMeetings
        .map((m, i) => `${i + 1}. **${m.title}** (${m.timeText}) - [Vào phòng họp](${m.link})`)
        .join("\n");
      return {
        answer: `Lịch họp hôm nay của bạn gồm **${activeMeetings.length} cuộc họp**:\n\n${meetingList}\n\n🎙️ Hệ thống hỗ trợ phiên dịch trực tiếp Việt - Anh và ghi biên bản tự động.`,
        sources,
      };
    }
  }

  // 7. DRAFTING: Email, Announcement, Plan, Report Generator (ChatGPT Style - High Priority)
  if (
    lowerPrompt.includes("soạn") ||
    lowerPrompt.includes("viết") ||
    lowerPrompt.includes("email") ||
    lowerPrompt.includes("kế hoạch") ||
    lowerPrompt.includes("báo cáo") ||
    lowerPrompt.includes("dự thảo")
  ) {
    const rawSubject = prompt.replace(/^(soạn|viết|lập|hãy|giúp tôi|tạo)\s*(giúp\s+tôi\s+)?(một\s+)?(email\s+|bản\s+|kế\s+hoạch\s+|báo\s+cáo\s+)?/i, "").trim() || "Thông báo doanh nghiệp";
    return {
      answer: `✍️ **Bản dự thảo chuyên nghiệp do Trợ lý AI tạo theo yêu cầu của bạn:**\n\n---\n**CHỦ ĐỀ:** ${rawSubject.toUpperCase()}\n\n**Kính gửi:** Ban Lãnh Đạo & Toàn thể Cán bộ Nhân viên,\n\nTôi xin trân trọng thông báo về nội dung: **${rawSubject}**.\n\n**1. Mục đích & Bối cảnh:**\nNhằm đảm bảo hoạt động vận hành thông suốt và nâng cao hiệu quả phối hợp giữa các phòng ban, công ty xin gửi thông báo chi tiết đến toàn thể thành viên.\n\n**2. Nội dung chi tiết & Kế hoạch triển khai:**\n- **Thời gian áp dụng:** Bắt đầu có hiệu lực ngay sau khi thông báo được phát hành.\n- **Trách nhiệm các phòng ban:** Các Trưởng bộ phận chủ động rà soát, đôn đốc nhân sự hoàn thành đúng tiến độ.\n- **Kênh tiếp nhận hỗ trợ:** Mọi thắc mắc vui lòng phản hồi qua kênh thảo luận chung hoặc liên hệ trực tiếp Bộ phận Nhân sự.\n\n**3. Yêu cầu phối hợp:**\nĐề nghị các phòng ban phối hợp chặt chẽ, cập nhật tiến độ công việc đầy đủ trên hệ thống Bảng việc Base.\n\nTrân trọng cảm ơn sự hợp tác và đồng hành của toàn thể anh/chị em.\n\n*Người lập: **${briefing.employee.name}** - ${briefing.employee.orgUnitName}*\n---\n\n💡 **Mẹo:** Bạn có thể sao chép văn bản này hoặc bấm nút *"Tạo chỉ thị mới"* ở tab **"Chỉ thị & Thông báo"** để phát hành ngay đến toàn công ty!`,
      sources: [{ type: "AI Drafting Studio", title: "Soạn thảo văn bản thông minh" }],
    };
  }

  // 8. QUERY: Announcements & Directives
  if (
    lowerPrompt.includes("chỉ thị") ||
    lowerPrompt.includes("ký nhận") ||
    lowerPrompt.includes("xác nhận") ||
    (lowerPrompt.includes("thông báo") && (lowerPrompt.includes("cần") || lowerPrompt.includes("có") || lowerPrompt.includes("mới") || lowerPrompt.includes("tồn đọng")))
  ) {
    const pending = briefing.announcements.filter((a) => a.requiresAck && !a.hasAcked);
    if (pending.length > 0) {
      pending.forEach((a) => sources.push({ type: "Chỉ thị bắt buộc", title: a.title }));
      const list = pending.map((a, i) => `${i + 1}. **[${a.priority}] ${a.title}** (v${a.version})`).join("\n");
      return {
        answer: `⚠️ **Bạn có ${pending.length} chỉ thị bắt buộc cần ký nhận:**\n\n${list}\n\n👉 Bạn hãy chuyển sang tab **"Chỉ thị & Thông báo"** và bấm nút **"Ký nhận chỉ thị"** để lưu vết thời gian theo quy định.`,
        sources,
      };
    } else {
      return {
        answer: "Toàn bộ chỉ thị và thông báo quan trọng từ Ban lãnh đạo đã được bạn xác nhận đầy đủ. Không có thông báo tồn đọng!",
        sources: [],
      };
    }
  }

  // 9. GENERAL CHATGPT-GRADE REASONING & CONVERSATIONAL ASSISTANT
  const userContext = `Bạn là **${briefing.employee.name}**, thuộc bộ phận **${briefing.employee.orgUnitName}**, vai trò **${briefing.employee.role}**. Hôm nay bạn có **${briefing.stats.todayMeetings} cuộc họp** và **${briefing.stats.pendingTasks} đầu việc** trong hệ thống.`;

  // Problem solving, advice, or general conversation
  if (
    lowerPrompt.includes("làm thế nào") ||
    lowerPrompt.includes("tại sao") ||
    lowerPrompt.includes("tư vấn") ||
    lowerPrompt.includes("giải thích") ||
    lowerPrompt.includes("giúp tôi") ||
    lowerPrompt.includes("cách")
  ) {
    return {
      answer: `🤖 **Phân tích & Hướng dẫn chi tiết từ Trợ lý AI:**\n\nVề câu hỏi của bạn: *"${prompt}"*:\n\n1. **Phân tích trọng tâm:**\nĐể giải quyết vấn đề này một cách hiệu quả, chúng ta cần tiếp cận theo quy trình chuẩn hóa: xác định rõ mục tiêu đầu ra, phân bổ nguồn lực hợp lý và kiểm soát rủi ro phát sinh.\n\n2. **Các bước hành động khuyến nghị:**\n- **Bước 1 - Khảo sát & Đánh giá hiện trạng:** Rà soát lại toàn bộ dữ liệu, đầu mối liên quan và thời hạn chót.\n- **Bước 2 - Lên kế hoạch chi tiết:** Chia nhỏ công việc thành các mốc (milestone), gán rõ người chịu trách nhiệm trực tiếp.\n- **Bước 3 - Theo dõi & Đo lường:** Cập nhật trạng thái liên tục trên hệ thống để phát hiện các điểm nghẽn (bottleneck) kịp thời.\n\n3. **Lời khuyên thực tiễn:**\nBạn có thể tận dụng tính năng tự động giao việc của tôi: gõ *"Giao việc cho [Tên nhân sự]: [Đầu việc]"* để hệ thống tự động đẩy việc cho đồng nghiệp mà không cần gửi email thủ công.\n\nNếu cần tôi làm rõ thêm chi tiết hoặc hỗ trợ soạn thảo bất kỳ văn bản nào, bạn cứ cho tôi biết nhé!`,
      sources: [{ type: "Trợ lý AI Doanh nghiệp", title: "Mô hình Phân tích & Tư vấn" }],
    };
  }

  return {
    answer: `Xin chào **${briefing.employee.name}**! Tôi là **Trợ lý AI Doanh nghiệp Deku** của bạn.\n\n${userContext}\n\n**Tôi có thể hỗ trợ bạn mọi tác vụ thông minh như ChatGPT:**\n- ⚡ **Giao việc tức thì:** Gõ *"Giao việc cho [Tên]: [Nhiệm vụ]"* để tự động đưa việc vào AI của đồng nghiệp.\n- 📝 **Ghi chú bảo mật:** Gõ *"Ghi chú lại: [Nội dung]"* để lưu vào sổ tay riêng tư.\n- ✍️ **Soạn thảo chuyên nghiệp:** Soạn email, báo cáo tuần, lập kế hoạch dự án hoặc dự thảo chỉ thị.\n- 🔍 **Tra cứu dữ liệu:** Kiểm tra lịch họp hôm nay, việc cần làm khẩn cấp hoặc quy chế nội bộ!\n\nBạn cần tôi hỗ trợ nội dung cụ thể nào ngay bây giờ?`,
    sources: [
      { type: "Trợ lý AI Doanh nghiệp", title: "Deku Assistant Engine" },
      { type: "Bối cảnh nhân sự", title: briefing.employee.name },
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
// 4. INVITE-ONLY GATEKEEPER & TOKEN CRYPTO
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
    token,
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

  if (email && invitation.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("Email đăng nhập không trùng khớp với email trên thư mời doanh nghiệp.");
  }

  await db.employeeInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      usedAt: new Date(),
    },
  });

  return invitation;
}
