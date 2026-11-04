import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

// Helper function to normalize Vietnamese names
function normalizeVietnameseName(str: string): string {
  if (!str) return "";
  return str
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const title = body.title || body.actionItemText;
    const assigneeName = body.assigneeName || body.rawAssigneeName;
    const {
      meetingId,
      orgUnitId,
      description,
      deadlineText,
      evidenceText,
    } = body;

    if (!title) {
      return new NextResponse("Title required", { status: 400 });
    }

    // Determine target OrgUnit (either provided or from meeting or default to first team)
    let targetOrgUnitId = orgUnitId;
    if (!targetOrgUnitId && meetingId) {
      const meeting = await db.meeting.findUnique({
        where: { id: meetingId },
      });
      if (meeting?.orgUnitId) {
        targetOrgUnitId = meeting.orgUnitId;
      }
    }

    if (!targetOrgUnitId) {
      const defaultTeam = await db.orgUnit.findFirst({
        where: { type: "TEAM" },
      });
      targetOrgUnitId = defaultTeam?.id;
    }

    // Single Automation Rule: Smart exact matching for assigneeName within the team
    let matchedAssigneeId: string | null = null;
    if (assigneeName && targetOrgUnitId) {
      const teamMembers = await db.orgUnitMember.findMany({
        where: { orgUnitId: targetOrgUnitId },
        include: { profile: true },
      });

      const normalizedInput = normalizeVietnameseName(assigneeName);
      const matches = teamMembers.filter((m) => {
        const normalizedMember = normalizeVietnameseName(m.profile.name);
        return (
          normalizedMember === normalizedInput ||
          normalizedMember.includes(normalizedInput) ||
          normalizedInput.includes(normalizedMember)
        );
      });

      // Assign ONLY if exactly 1 match (AI never guesses when ambiguous)
      if (matches.length === 1) {
        matchedAssigneeId = matches[0].profileId;
      }
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || `Nhiệm vụ trích xuất từ cuộc họp: "${evidenceText || title}"`,
        orgUnitId: targetOrgUnitId,
        assigneeName: assigneeName || null,
        assigneeId: matchedAssigneeId,
        deadlineText: deadlineText || "Trong tuần này",
        evidenceText: evidenceText || null,
        status: "TODO",
        priority: "MEDIUM",
        isHumanConfirmed: true,
        meetingId: meetingId || null,
      },
      include: {
        orgUnit: true,
        assignee: true,
      },
    });

    // B7 Automation Event Listener: Post notification to team's private channel
    try {
      if (targetOrgUnitId) {
        const teamChannel = await db.channel.findFirst({
          where: { orgUnitId: targetOrgUnitId },
        });

        if (teamChannel) {
          const serverMember =
            (await db.member.findFirst({
              where: { serverId: teamChannel.serverId, profileId: profile.id },
            })) ||
            (await db.member.findFirst({
              where: { serverId: teamChannel.serverId },
            }));

          if (serverMember) {
            await db.message.create({
              data: {
                content: `📋 **[Lark Base Automation] Việc mới từ cuộc họp**: **${task.title}**\n- Phụ trách: **${task.assignee?.name || task.assigneeName || "Chưa chỉ định"}**\n- Hạn chót: ${task.deadlineText || "Trong tuần này"}\n> Căn cứ từ cuộc họp: _"${task.evidenceText || task.title}"_`,
                channelId: teamChannel.id,
                memberId: serverMember.id,
              },
            });
          }
        }
      }
    } catch (msgErr) {
      console.warn("[TASK_CHANNEL_NOTIFY_ERROR]", msgErr);
    }

    try {
      const { logAudit } = await import("@/lib/audit");
      await logAudit({
        actorId: profile.id,
        action: "TASK_CREATED_FROM_AI",
        targetType: "Task",
        targetId: task.id,
        detail: {
          meetingId,
          orgUnitId: targetOrgUnitId,
          title: task.title,
          assigneeId: task.assigneeId,
          evidenceText: task.evidenceText,
        },
      });
    } catch (auditErr) {
      console.warn("[TASK_AUDIT_LOG_ERROR]", auditErr);
    }

    return NextResponse.json({
      success: true,
      task,
      automationApplied: {
        orgAssigned: targetOrgUnitId,
        matchedAssignee: matchedAssigneeId
          ? "Matched exactly 1 member"
          : "Left empty for verification",
        channelNotified: Boolean(targetOrgUnitId),
      },
    });
  } catch (error) {

    console.error("[TASK_CONFIRM_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
