import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

// GET /api/tasks/overdue: Scans and returns overdue tasks
export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();

    // 1. Mark tasks overdue where dueDate < now and not completed
    const updated = await db.task.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: ["TODO", "IN_PROGRESS"] },
        isHumanConfirmed: true,
      },
      data: {
        status: "OVERDUE",
      },
    });

    // 2. Fetch all overdue tasks
    const overdueTasks = await db.task.findMany({
      where: {
        status: "OVERDUE",
        isHumanConfirmed: true,
      },
      include: {
        orgUnit: true,
        assignee: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      scannedAt: now.toISOString(),
      newlyMarkedCount: updated.count,
      totalOverdueCount: overdueTasks.length,
      overdueTasks,
    });
  } catch (error) {
    console.error("[TASKS_OVERDUE_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/tasks/overdue/remind: Sends notifications to assignees with upcoming or overdue tasks
export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingOrOverdue = await db.task.findMany({
      where: {
        dueDate: { lte: next24h },
        status: { in: ["TODO", "IN_PROGRESS", "OVERDUE"] },
        isHumanConfirmed: true,
      },
      include: {
        orgUnit: true,
        assignee: true,
      },
    });

    await logAudit({
      actorId: profile.id,
      action: "OVERDUE_JOB_EXECUTED",
      targetType: "Task",
      targetId: "OVERDUE_SCANNER",
      detail: {
        flaggedCount: upcomingOrOverdue.length,
        timestamp: now.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      remindedCount: upcomingOrOverdue.length,
      tasks: upcomingOrOverdue.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assignee: t.assignee?.name || t.assigneeName,
        dueDate: t.dueDate,
        orgUnit: t.orgUnit.name,
      })),
    });
  } catch (error) {
    console.error("[TASKS_OVERDUE_REMIND_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
