import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const asRole = searchParams.get("asRole") || "MEMBER";
    const status = searchParams.get("status");

    // Fetch employee for current profile
    let employee = await db.employeeProfile.findUnique({
      where: { profileId: profile.id },
    });
    if (!employee) {
      employee = await db.employeeProfile.findFirst();
    }

    let whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    // Role-based visibility
    if (asRole === "MEMBER" && employee) {
      // Member sees their own requests
      whereClause.employeeProfileId = employee.id;
    } else if (asRole === "LEAD" && employee) {
      // Lead sees their own team's requests
      const memberships = await db.orgUnitMember.findMany({
        where: { profileId: profile.id, role: { in: ["LEAD", "HEAD"] } },
      });
      const orgUnitIds = memberships.map((m) => m.orgUnitId);
      
      const teamProfiles = await db.orgUnitMember.findMany({
        where: { orgUnitId: { in: orgUnitIds } },
        select: { profileId: true },
      });
      const profileIds = teamProfiles.map((tp) => tp.profileId);
      const teamEmployees = await db.employeeProfile.findMany({
        where: { profileId: { in: profileIds } },
        select: { id: true },
      });

      whereClause.employeeProfileId = { in: teamEmployees.map((te) => te.id) };
    }
    // HEAD and HR can see all pending or department requests

    const requests = await db.leaveRequest.findMany({
      where: whereClause,
      include: {
        policy: true,
        employeeProfile: {
          include: {
            profile: true,
          },
        },
        approver: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[LEAVE_REQUESTS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      policyId,
      startDate,
      endDate,
      daysCount,
      session = "FULL_DAY",
      reason,
      handoverTo,
    } = body;

    if (!policyId || !startDate || !endDate || !reason) {
      return new NextResponse("Thiếu thông tin bắt buộc cho đơn nghỉ phép", { status: 400 });
    }

    const count = Number(daysCount) || 1;

    // Get current employee profile
    let employee = await db.employeeProfile.findUnique({
      where: { profileId: profile.id },
    });
    if (!employee) {
      employee = await db.employeeProfile.findFirst();
    }
    if (!employee) {
      return new NextResponse("Không tìm thấy hồ sơ nhân sự", { status: 404 });
    }

    const currentEmployee = employee;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Check duplicate dates (overlap check)
    const overlap = await db.leaveRequest.findFirst({
      where: {
        employeeProfileId: currentEmployee.id,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlap) {
      return NextResponse.json(
        { error: "Bạn đã có đơn nghỉ phép trùng thời gian trong hệ thống" },
        { status: 400 }
      );
    }

    // 2. Check balance
    const balance = await db.leaveBalance.findUnique({
      where: {
        employeeProfileId_policyId_year: {
          employeeProfileId: currentEmployee.id,
          policyId,
          year: 2026,
        },
      },
      include: { policy: true },
    });

    if (balance && balance.policy.isPaid) {
      const remaining = balance.totalDays - balance.usedDays - balance.pendingDays;
      if (remaining < count) {
        return NextResponse.json(
          {
            error: `Số dư ngày phép không đủ. Còn lại: ${remaining} ngày, số ngày xin nghỉ: ${count} ngày`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Create leave request and update pendingDays in database transaction
    const [newRequest, updatedBalance, outboxEvent] = await db.$transaction(async (tx) => {
      const req = await tx.leaveRequest.create({
        data: {
          employeeProfileId: currentEmployee.id,
          policyId,
          startDate: start,
          endDate: end,
          daysCount: count,
          session,
          reason,
          handoverTo,
          status: "PENDING",
        },
        include: {
          policy: true,
          employeeProfile: {
            include: { profile: true },
          },
        },
      });

      // Increment pendingDays
      let bal = null;
      if (balance) {
        bal = await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { increment: count },
          },
        });
      }

      // Emit Transactional Outbox Event per architecture_hr.png
      const outbox = await tx.outboxEvent.create({
        data: {
          aggregateType: "LEAVE_REQUEST",
          aggregateId: req.id,
          eventType: "LEAVE_SUBMITTED",
          payload: {
            requestId: req.id,
            employeeName: req.employeeProfile.profile.name,
            policyName: req.policy.name,
            daysCount: count,
            startDate: req.startDate,
            endDate: req.endDate,
            reason: req.reason,
          },
          status: "PENDING",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: profile.id,
          action: "LEAVE_REQUEST_SUBMITTED",
          targetType: "LEAVE_REQUEST",
          targetId: req.id,
          detail: {
            employeeId: currentEmployee.id,
            daysCount: count,
            policyId,
            reason,
          },
        },
      });

      return [req, bal, outbox];
    });

    return NextResponse.json({
      success: true,
      request: newRequest,
      balance: updatedBalance,
      outboxEventId: outboxEvent.id,
    });
  } catch (error) {
    console.error("[LEAVE_REQUEST_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
