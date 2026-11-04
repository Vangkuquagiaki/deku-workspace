export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const employeeId = params.id;
    const body = await req.json();
    const { targetOrgUnitId, note, newRole = "MEMBER" } = body;

    if (!targetOrgUnitId) {
      return new NextResponse("Target orgUnitId is required", { status: 400 });
    }

    const employee = await db.employeeProfile.findUnique({
      where: { id: employeeId },
      include: {
        profile: {
          include: {
            orgUnitMembers: {
              include: { orgUnit: true },
            },
          },
        },
      },
    });

    if (!employee) {
      return new NextResponse("Không tìm thấy nhân viên", { status: 404 });
    }

    const targetOrg = await db.orgUnit.findUnique({
      where: { id: targetOrgUnitId },
    });

    if (!targetOrg) {
      return new NextResponse("Không tìm thấy đơn vị tiếp nhận", { status: 404 });
    }

    const currentMembership = employee.profile.orgUnitMembers[0];
    const fromOrgUnitId = currentMembership?.orgUnitId || null;
    const fromOrgName = currentMembership?.orgUnit?.name || "Chưa phân tổ";

    // Perform Transfer in Transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Delete or Update existing membership
      await tx.orgUnitMember.deleteMany({
        where: { profileId: employee.profileId },
      });

      // 2. Create new membership
      const newMembership = await tx.orgUnitMember.create({
        data: {
          orgUnitId: targetOrgUnitId,
          profileId: employee.profileId,
          role: newRole,
          isPrimary: true,
        },
        include: { orgUnit: true },
      });

      // 3. Record EmploymentEvent (TRANSFER_TEAM)
      const event = await tx.employmentEvent.create({
        data: {
          employeeProfileId: employee.id,
          eventType: "TRANSFER_TEAM",
          fromOrgUnitId,
          toOrgUnitId: targetOrgUnitId,
          note: note || `Điều chuyển công tác từ ${fromOrgName} sang ${targetOrg.name}`,
          actorId: profile.id,
        },
      });

      // 4. Transactional Outbox Event
      await tx.outboxEvent.create({
        data: {
          aggregateType: "EMPLOYEE",
          aggregateId: employee.id,
          eventType: "EMPLOYEE_TRANSFERRED",
          payload: {
            employeeId: employee.id,
            employeeCode: employee.employeeCode,
            name: employee.profile.name,
            fromOrgName,
            toOrgName: targetOrg.name,
            newRole,
            note,
          },
          status: "PENDING",
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: profile.id,
          action: "EMPLOYEE_TRANSFERRED",
          targetType: "EMPLOYEE",
          targetId: employee.id,
          detail: {
            employeeCode: employee.employeeCode,
            fromOrgUnitId,
            toOrgUnitId: targetOrgUnitId,
            newRole,
            note,
          },
        },
      });

      return { newMembership, event };
    });

    return NextResponse.json({
      success: true,
      message: `Đã điều chuyển nhân sự thành công sang ${targetOrg.name}`,
      membership: result.newMembership,
      event: result.event,
    });
  } catch (error) {
    console.error("[EMPLOYEE_TRANSFER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
