import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: params.id }, { code: params.id }],
      },
      include: {
        participants: true,
        segments: {
          orderBy: { startMs: "asc" },
        },
        tasks: {
          include: {
            assignee: true,
          },
        },
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    const attendeeNames =
      meeting.participants.map((p: any) => p.name).join(", ") ||
      "Không có danh sách";

    const formatTime = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const m = Math.floor(totalSec / 60)
        .toString()
        .padStart(2, "0");
      const s = Math.floor(totalSec % 60)
        .toString()
        .padStart(2, "0");
      return `${m}:${s}`;
    };

    let md = `# BIÊN BẢN CUỘC HỌP: ${meeting.title.toUpperCase()}\n\n`;
    md += `> **Mã cuộc họp:** \`${meeting.code}\`  \n`;
    md += `> **Thời gian tạo:** ${new Date(meeting.createdAt).toLocaleString("vi-VN")}  \n`;
    md += `> **Người tham dự:** ${attendeeNames}  \n`;
    md += `> **Trạng thái:** ${meeting.status}\n\n`;
    md += `---\n\n`;

    md += `## 1. TỔNG QUAN NỘI DUNG\n\n`;
    md += `Cuộc họp "${meeting.title}" được tổ chức trực tuyến với sự tham gia của ${meeting.participants.length} thành viên. Hệ thống AI đã tự động ghi âm, nhận diện giọng nói và trích xuất các quyết định và đầu việc quan trọng.\n\n`;

    if (meeting.tasks.length > 0) {
      md += `## 2. CÁC ĐẦU VIỆC CẦN THỰC HIỆN (ACTION ITEMS - LARK BASE)\n\n`;
      md += `| STT | Công việc | Người phụ trách | Hạn chót | Căn cứ từ cuộc họp |\n`;
      md += `|:---:|:---|:---|:---|:---|\n`;
      meeting.tasks.forEach((task: any, idx: number) => {
        const assignee = task.assignee?.name || task.assigneeName || "Chưa chỉ định";
        const deadline = task.deadlineText || (task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "TBD");
        const evidence = task.evidenceText ? `"${task.evidenceText}"` : "-";
        md += `| ${idx + 1} | ${task.title} | ${assignee} | ${deadline} | ${evidence} |\n`;
      });
      md += `\n`;
    }

    md += `## 3. CHI TIẾT TRANSCRIPT CUỘC HỌP\n\n`;
    if (meeting.segments.length === 0) {
      md += `*Không có dữ liệu lời thoại được ghi nhận.*\n`;
    } else {
      meeting.segments.forEach((seg: any) => {
        const timeStr = `[${formatTime(seg.startMs)} - ${formatTime(seg.endMs)}]`;
        md += `**${seg.speakerName || "Người tham gia"}** ${timeStr}:\n`;
        md += `> ${seg.text}\n\n`;
      });
    }

    md += `\n---\n`;
    md += `*Biên bản được xuất tự động từ Hệ thống Họp Trực tuyến & Lark Base Workspace.*\n`;

    const encodedFileName = encodeURIComponent(`bien_ban_${meeting.code}.md`);

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="bien_ban_${meeting.code}.md"; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error) {
    console.error("[MINUTES_EXPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
