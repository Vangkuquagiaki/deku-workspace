export const dynamic = "force-dynamic";

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
    const asRole = searchParams.get("asRole") || "LEAD";

    // Only LEAD, HEAD, HR can approve
    if (asRole === "MEMBER") {
      return NextResponse.json({
        canApprove: false,
        pendingCount: 0,
        requests: [],
      });
    }

    const pendingRequests = await db.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        policy: true,
        employeeProfile: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      canApprove: true,
      pendingCount: pendingRequests.length,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error("[APPROVALS_GET_ERROR]", error);
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
    const { requestId, decision, note } = body;

    if (!requestId || !decision) {
      return new NextResponse("Missing requestId or decision", { status: 400 });
    }

    if (!["APPROVE", "REJECT", "REQUEST_CHANGES"].includes(decision)) {
      return new NextResponse("Invalid decision value", { status: 400 });
    }

    // 1. Fetch target leave request
    const leaveReq = await db.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        policy: true,
        employeeProfile: {
          include: { profile: true },
        },
      },
    });

    if (!leaveReq) {
      return new NextResponse("Không tìm thấy đơn nghỉ phép", { status: 404 });
    }

    // Idempotency check: Don't allow double decision
    if (leaveReq.status !== "PENDING") {
      return NextResponse.json(
        { error: `Đơn này đã được xử lý trước đó với trạng thái: ${leaveReq.status}` },
        { status: 409 }
      );
    }

    const balance = await db.leaveBalance.findUnique({
      where: {
        employeeProfileId_policyId_year: {
          employeeProfileId: leaveReq.employeeProfileId,
          policyId: leaveReq.policyId,
          year: 2026,
        },
      },
    });

    // 2. Perform Atomic Decision and Balance Update
    const result = await db.$transaction(async (tx) => {
      let updatedStatus = "APPROVED";
      let balanceUpdateData: any = {};

      if (decision === "APPROVE") {
        updatedStatus = "APPROVED";
        if (balance) {
          balanceUpdateData = {
            pendingDays: { decrement: leaveReq.daysCount },
            usedDays: { increment: leaveReq.daysCount },
          };
        }
      } else {
        updatedStatus = decision === "REJECT" ? "REJECTED" : "CANCELLED";
        if (balance) {
          balanceUpdateData = {
            pendingDays: { decrement: leaveReq.daysCount },
          };
        }
      }

      // Update Leave Request
      const updatedReq = await tx.leaveRequest.update({
        where: { id: leaveReq.id },
        data: {
          status: updatedStatus,
          approverId: profile.id,
          approvedAt: decision === "APPROVE" ? new Date() : null,
          rejectionReason: decision !== "APPROVE" ? note || "Từ chối bởi cấp quản lý" : null,
        },
        include: {
          policy: true,
          employeeProfile: {
            include: { profile: true },
          },
          approver: true,
        },
      });

      // Update Leave Balance if exists
      let updatedBal = null;
      if (balance && Object.keys(balanceUpdateData).length > 0) {
        updatedBal = await tx.leaveBalance.update({
          where: { id: balance.id },
          data: balanceUpdateData,
        });
      }

      // Transactional Outbox Event per architecture_hr.png
      const outbox = await tx.outboxEvent.create({
        data: {
          aggregateType: "LEAVE_REQUEST",
          aggregateId: leaveReq.id,
          eventType: decision === "APPROVE" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
          payload: {
            requestId: leaveReq.id,
            employeeName: leaveReq.employeeProfile.profile.name,
            decision,
            approverName: profile.name,
            note: note || null,
          },
          status: "PENDING",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: profile.id,
          action: decision === "APPROVE" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
          targetType: "LEAVE_REQUEST",
          targetId: leaveReq.id,
          detail: {
            decision,
            approverId: profile.id,
            employeeId: leaveReq.employeeProfileId,
            daysCount: leaveReq.daysCount,
            note,
          },
        },
      });

      return { updatedReq, updatedBal, outbox };
    });

    return NextResponse.json({
      success: true,
      decision,
      request: result.updatedReq,
      balance: result.updatedBal,
    });
  } catch (error) {
    console.error("[APPROVALS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
