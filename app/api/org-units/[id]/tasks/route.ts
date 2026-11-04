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

    const { searchParams } = new URL(req.url);
    const asRole = searchParams.get("asRole"); // Demo role override if provided
    const onlyOverdue = searchParams.get("onlyOverdue") === "true";
    const orgUnitId = params.id;

    // Lark Base Rule (B6): HR is strictly forbidden from viewing team tasks
    if (asRole === "HR") {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "Theo quy định phân quyền ba tầng của Lark Base, vai trò Nhân sự (HR) không có quyền truy cập bảng việc chuyên môn của các tổ.",
        },
        { status: 403 }
      );
    }

    // Auto-scan overdue tasks (Requirement M3 - Lark Base Overdue Automation)
    try {
      await db.task.updateMany({
        where: {
          dueDate: { lt: new Date() },
          status: { in: ["TODO", "IN_PROGRESS"] },
          isHumanConfirmed: true,
        },
        data: {
          status: "OVERDUE",
        },
      });
    } catch (e) {
      // Non-fatal if scan fails
    }

    // M9: "Việc của tôi" (My Tasks) across all org units
    if (orgUnitId === "my_tasks") {
      const myWhere: any = {
        isHumanConfirmed: true,
        assigneeId: profile.id,
      };
      if (onlyOverdue) {
        myWhere.status = "OVERDUE";
      }

      const myTasks = await db.task.findMany({
        where: myWhere,
        include: {
          orgUnit: true,
          assignee: true,
          meeting: true,
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });
      return NextResponse.json(myTasks);
    }

    // Find all OrgUnit memberships for current profile
    const memberships = await db.orgUnitMember.findMany({
      where: { profileId: profile.id },
      include: {
        orgUnit: {
          include: {
            children: true,
          },
        },
      },
    });

    let allowedUnitIds: string[] = [];

    if (asRole === "MEMBER") {
      // Regular member: only sees their own team
      const memberTeam = await db.orgUnit.findFirst({
        where: {
          type: "TEAM",
          OR: [
            { name: { contains: "nội địa", mode: "insensitive" } },
            { name: { contains: "Frontend", mode: "insensitive" } },
          ],
        },
      });
      allowedUnitIds = memberTeam ? [memberTeam.id] : [];
    } else if (asRole === "LEAD") {
      // Lead: sees their team
      const leadTeam = await db.orgUnit.findFirst({
        where: {
          type: "TEAM",
          OR: [
            { name: { contains: "Backend", mode: "insensitive" } },
            { name: { contains: "Cloud", mode: "insensitive" } },
          ],
        },
      });
      allowedUnitIds = leadTeam ? [leadTeam.id] : [];
    } else if (asRole === "HEAD") {
      // Head: sees all teams in their department
      const deptTech = await db.orgUnit.findFirst({
        where: {
          type: "DEPARTMENT",
          OR: [
            { name: { contains: "Công nghệ", mode: "insensitive" } },
            { name: { contains: "Giám đốc", mode: "insensitive" } },
          ],
        },
        include: { children: true },
      });
      if (deptTech) {
        allowedUnitIds = [deptTech.id, ...(deptTech.children || []).map((c) => c.id)];
      }
    } else {
      // Default: inspect actual memberships
      for (const m of memberships) {
        if (m.role === "HEAD") {
          allowedUnitIds.push(m.orgUnitId);
          if (m.orgUnit.children) {
            allowedUnitIds.push(...m.orgUnit.children.map((c) => c.id));
          }
        } else {
          allowedUnitIds.push(m.orgUnitId);
        }
      }
    }

    // If specific team requested, verify record-level access
    if (orgUnitId && orgUnitId !== "all") {
      if (asRole && allowedUnitIds.length > 0 && !allowedUnitIds.includes(orgUnitId)) {
        return NextResponse.json(
          {
            error: "FORBIDDEN",
            message:
              "Bạn không có quyền xem bảng việc của tổ này. Theo quy định Lark Base, nhân sự chỉ được xem việc của tổ mình hoặc phòng mình.",
          },
          { status: 403 }
        );
      }
    }

    let whereCondition: any = { isHumanConfirmed: true };

    if (onlyOverdue) {
      whereCondition.status = "OVERDUE";
    }

    if (orgUnitId && orgUnitId !== "all") {
      whereCondition.orgUnitId = orgUnitId;
    } else if (asRole && allowedUnitIds.length > 0) {
      whereCondition.orgUnitId = { in: allowedUnitIds };
    }

    const tasks = await db.task.findMany({
      where: whereCondition,
      include: {
        orgUnit: true,
        assignee: true,
        meeting: true,
      },
      take: 200,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[ORG_UNIT_TASKS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const orgUnitId = params.id;
    const body = await req.json();
    const {
      title,
      description,
      priority = "MEDIUM",
      status = "TODO",
      assigneeName,
      deadlineText,
      dueDate,
      evidenceText,
    } = body;

    if (!title) {
      return new NextResponse("Title required", { status: 400 });
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        priority,
        status,
        orgUnitId,
        assigneeName: assigneeName || profile.name,
        assigneeId: profile.id,
        deadlineText,
        dueDate: dueDate ? new Date(dueDate) : null,
        evidenceText,
        isHumanConfirmed: true,
      },
      include: {
        orgUnit: true,
        assignee: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[ORG_UNIT_TASKS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
