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
    const search = searchParams.get("search") || "";
    const teamId = searchParams.get("teamId");
    const status = searchParams.get("status");

    let whereClause: any = {};
    if (status) {
      whereClause.employmentStatus = status;
    }

    if (search.trim()) {
      whereClause.OR = [
        { employeeCode: { contains: search.trim(), mode: "insensitive" } },
        { jobTitle: { contains: search.trim(), mode: "insensitive" } },
        { profile: { name: { contains: search.trim(), mode: "insensitive" } } },
      ];
    }

    if (teamId && teamId !== "all") {
      whereClause.profile = {
        orgUnitMembers: {
          some: { orgUnitId: teamId },
        },
      };
    }

    const employees = await db.employeeProfile.findMany({
      where: whereClause,
      include: {
        profile: {
          include: {
            orgUnitMembers: {
              include: {
                orgUnit: {
                  include: { parent: true },
                },
              },
            },
          },
        },
        employmentEvents: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        onboardingTasks: true,
      },
      take: 100,
      orderBy: { employeeCode: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("[EMPLOYEES_GET_ERROR]", error);
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
    const { name, email, jobTitle, orgUnitId, role = "MEMBER" } = body;

    if (!name || !email || !orgUnitId) {
      return new NextResponse("Name, email and orgUnitId are required", { status: 400 });
    }

    // Find next available employeeCode
    const lastEmp = await db.employeeProfile.findFirst({
      orderBy: { employeeCode: "desc" },
    });

    let nextCode = "EMP026";
    if (lastEmp?.employeeCode) {
      const num = parseInt(lastEmp.employeeCode.replace("EMP", ""), 10);
      if (!isNaN(num)) {
        nextCode = `EMP${String(num + 1).padStart(3, "0")}`;
      }
    }

    // Create user profile & employee profile in transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create Profile
      const newProfile = await tx.profile.create({
        data: {
          userId: `demo_user_${nextCode.toLowerCase()}`,
          name,
          email,
          imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        },
      });

      // 2. Create Employee Profile
      const newEmployee = await tx.employeeProfile.create({
        data: {
          profileId: newProfile.id,
          employeeCode: nextCode,
          jobTitle: jobTitle || "Chuyên viên",
          hiredOn: new Date(),
          employmentStatus: "ACTIVE",
          isHr: false,
        },
      });

      // 3. Assign Org Unit
      const membership = await tx.orgUnitMember.create({
        data: {
          orgUnitId,
          profileId: newProfile.id,
          role,
          isPrimary: true,
        },
        include: { orgUnit: true },
      });

      // 4. Create Standard Onboarding Checklist
      const onboardingTasks = await Promise.all([
        tx.onboardingTask.create({
          data: {
            employeeProfileId: newEmployee.id,
            title: "Cấp tài khoản & máy tính làm việc",
            category: "IT",
          },
        }),
        tx.onboardingTask.create({
          data: {
            employeeProfileId: newEmployee.id,
            title: "Ký kết hợp đồng lao động & phổ biến nội quy công ty",
            category: "HR",
          },
        }),
        tx.onboardingTask.create({
          data: {
            employeeProfileId: newEmployee.id,
            title: "Tham gia buổi chào đón thành viên mới của tổ",
            category: "MANAGER",
          },
        }),
      ]);

      // 5. Record Employment Event (ONBOARDING)
      await tx.employmentEvent.create({
        data: {
          employeeProfileId: newEmployee.id,
          eventType: "ONBOARDING",
          toOrgUnitId: orgUnitId,
          note: `Tiếp nhận nhân sự mới ${name} vào ${membership.orgUnit.name}`,
          actorId: profile.id,
        },
      });

      // 6. Outbox Event
      await tx.outboxEvent.create({
        data: {
          aggregateType: "EMPLOYEE",
          aggregateId: newEmployee.id,
          eventType: "EMPLOYEE_ONBOARDED",
          payload: {
            employeeId: newEmployee.id,
            employeeCode: nextCode,
            name,
            orgUnitName: membership.orgUnit.name,
          },
          status: "PENDING",
        },
      });

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: profile.id,
          action: "EMPLOYEE_CREATED",
          targetType: "EMPLOYEE",
          targetId: newEmployee.id,
          detail: {
            employeeCode: nextCode,
            name,
            email,
            orgUnitId,
          },
        },
      });

      return { newProfile, newEmployee, membership, onboardingTasks };
    });

    return NextResponse.json({
      success: true,
      employee: result.newEmployee,
      profile: result.newProfile,
      membership: result.membership,
    });
  } catch (error) {
    console.error("[EMPLOYEES_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
