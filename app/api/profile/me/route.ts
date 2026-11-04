export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const fullProfile = await db.profile.findUnique({
      where: { id: profile.id },
      include: {
        employeeProfile: {
          include: {
            attendance: {
              orderBy: { month: "desc" },
              take: 6,
            },
            leaveBalances: {
              include: { policy: true },
            },
          },
        },
        orgUnitMembers: {
          include: {
            orgUnit: {
              include: { parent: true },
            },
          },
        },
        tasksAssigned: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        receivedCommendations: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!fullProfile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const emp = fullProfile.employeeProfile;

    // Calculate age if dob exists
    let age = null;
    if (emp?.dob) {
      const birth = new Date(emp.dob);
      const now = new Date();
      age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
    }

    // Calculate tenure
    let tenure = "Mới gia nhập";
    if (emp?.hiredOn) {
      const hired = new Date(emp.hiredOn);
      const now = new Date();
      const diffMonths =
        (now.getFullYear() - hired.getFullYear()) * 12 +
        (now.getMonth() - hired.getMonth());
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      tenure = `${years > 0 ? `${years} năm ` : ""}${months} tháng (từ ${hired.toLocaleDateString("vi-VN")})`;
    }

    const baseSalary = emp?.baseSalary || 0;
    const allowance = emp?.allowance || 0;
    const bonus = emp?.bonus || 0;
    const totalSalary = baseSalary + allowance + bonus;

    // Current month worked days
    const currentMonthAttendance = emp?.attendance?.[0];
    const workedDaysThisMonth = currentMonthAttendance ? currentMonthAttendance.workedDays : 22.0;

    const result = {
      profile: {
        id: fullProfile.id,
        userId: fullProfile.userId,
        name: fullProfile.name,
        email: fullProfile.email,
        imageUrl: fullProfile.imageUrl,
      },
      employee: {
        id: emp?.id,
        employeeCode: emp?.employeeCode || "EMP-NEW",
        jobTitle: emp?.jobTitle || "Thành viên doanh nghiệp",
        hiredOn: emp?.hiredOn,
        tenure,
        employmentStatus: emp?.employmentStatus || "ACTIVE",
        isHr: Boolean(emp?.isHr),

        // Personal Details
        dob: emp?.dob,
        age,
        address: emp?.address || "Chưa cập nhật nơi ở",
        phoneNumber: emp?.phoneNumber || "Chưa cập nhật SĐT",
        idCardNumber: emp?.idCardNumber || "Chưa cập nhật CCCD",
        bankAccount: emp?.bankAccount || "Chưa cập nhật",
        bankName: emp?.bankName || "Chưa cập nhật ngân hàng",

        // Compensation
        baseSalary,
        allowance,
        bonus,
        totalSalary,
        insuranceSalary: emp?.insuranceSalary || baseSalary,
        workedDaysThisMonth,
      },
      attendanceHistory: (emp?.attendance || []).map((a) => ({
        id: a.id,
        month: a.month.toISOString().substring(0, 7),
        workedDays: a.workedDays,
        source: a.source,
      })),
      orgUnits: fullProfile.orgUnitMembers.map((m) => ({
        unitId: m.orgUnit.id,
        unitName: m.orgUnit.name,
        unitType: m.orgUnit.type,
        parentName: m.orgUnit.parent?.name || null,
        role: m.role,
      })),
      leaveBalances: (emp?.leaveBalances || []).map((b) => ({
        policyCode: b.policy.code,
        policyName: b.policy.name,
        totalDays: b.totalDays,
        usedDays: b.usedDays,
        pendingDays: b.pendingDays,
        remainingDays: Math.max(0, b.totalDays - b.usedDays - b.pendingDays),
      })),
      tasks: fullProfile.tasksAssigned.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        deadlineText: t.deadlineText,
      })),
      commendations: fullProfile.receivedCommendations.map((c) => ({
        id: c.id,
        title: "Khen thưởng xuất sắc",
        content: c.reason,
        awardedAt: c.createdAt,
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PROFILE_ME_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, address, phoneNumber, dob, bankAccount, bankName, baseSalary, allowance, bonus } = body;

    // Update profile name if provided
    if (name && name.trim()) {
      await db.profile.update({
        where: { id: profile.id },
        data: { name: name.trim() },
      });
    }

    // Update employee profile details
    let emp = await db.employeeProfile.findUnique({
      where: { profileId: profile.id },
    });

    const updateData: any = {};
    if (address !== undefined) updateData.address = address;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (baseSalary !== undefined) updateData.baseSalary = Number(baseSalary);
    if (allowance !== undefined) updateData.allowance = Number(allowance);
    if (bonus !== undefined) updateData.bonus = Number(bonus);
    if (dob) updateData.dob = new Date(dob);

    if (emp) {
      emp = await db.employeeProfile.update({
        where: { id: emp.id },
        data: updateData,
      });
    } else {
      emp = await db.employeeProfile.create({
        data: {
          profileId: profile.id,
          employeeCode: `EMP${Math.floor(100 + Math.random() * 899)}`,
          jobTitle: "Thành viên doanh nghiệp",
          ...updateData,
        },
      });
    }

    return NextResponse.json({ success: true, employee: emp });
  } catch (error) {
    console.error("[PROFILE_ME_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
