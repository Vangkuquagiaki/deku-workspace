import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { evaluateProfileAccess } from "@/lib/profile-policy";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const viewer = await currentProfile();
    if (!viewer) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const asRole = searchParams.get("asRole"); // Demo role override if provided
    const targetId = params.id;

    const targetProfile = await db.profile.findFirst({
      where: {
        OR: [{ id: targetId }, { userId: targetId }],
      },
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
        receivedCommendations: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!targetProfile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const emp = targetProfile.employeeProfile;

    // 3-Tier Permission Evaluation
    let allowedFields: string[];
    let isSelf = viewer.id === targetProfile.id;
    let isLead = false;
    let isHead = false;
    let isHr = false;

    if (asRole === "HR") {
      isHr = true;
      allowedFields = [
        "name", "imageUrl", "jobTitle", "orgUnits", "tenure", 
        "workedDays", "email", "personalInfo", "compensation"
      ];
    } else if (asRole === "HEAD") {
      isHead = true;
      allowedFields = ["name", "imageUrl", "jobTitle", "orgUnits", "tenure", "workedDays"];
    } else if (asRole === "LEAD") {
      isLead = true;
      allowedFields = ["name", "imageUrl", "jobTitle", "orgUnits", "tenure", "workedDays"];
    } else if (asRole === "MEMBER") {
      // Same team colleague: workedDays and personalInfo/compensation are forbidden
      allowedFields = ["name", "imageUrl", "jobTitle", "orgUnits", "tenure"];
    } else {
      const evaluation = await evaluateProfileAccess(viewer.id, targetProfile.id);
      allowedFields = evaluation.allowedFields;
      isSelf = evaluation.isSelf;
      isLead = evaluation.isLead;
      isHead = evaluation.isHead;
      isHr = evaluation.isHr;
    }

    // Determine access level badge
    const accessLevel = isSelf
      ? "SELF"
      : isHr
      ? "HR"
      : isHead
      ? "HEAD"
      : isLead
      ? "LEAD"
      : "PUBLIC";

    // Audit Log: Log whenever someone views another person's worked days or compensation (B3 specification)
    if ((allowedFields.includes("workedDays") || allowedFields.includes("compensation")) && !isSelf) {
      await logAudit({
        actorId: viewer.id,
        action: "PROFILE_SENSITIVE_VIEW",
        targetType: "EmployeeProfile",
        targetId: targetProfile.id,
        detail: {
          targetName: targetProfile.name,
          viewerRole: asRole || (isHr ? "HR" : isHead ? "HEAD" : isLead ? "LEAD" : "TEAM"),
          timestamp: new Date().toISOString(),
        },
      });
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

    const currentAttendance = emp?.attendance?.[0];
    const workedDays = currentAttendance ? currentAttendance.workedDays : 22.0;

    // Check what employee sensitive fields are allowed
    const canSeePersonalInfo = allowedFields.includes("personalInfo");
    const canSeeCompensation = allowedFields.includes("compensation");
    const canSeeWorkedDays = allowedFields.includes("workedDays");

    const employeeData: any = {
      id: emp?.id,
      employeeCode: emp?.employeeCode || "N/A",
      jobTitle: emp?.jobTitle || "Thành viên doanh nghiệp",
      hiredOn: emp?.hiredOn,
      tenure,
      employmentStatus: emp?.employmentStatus || "ACTIVE",
      isHr: Boolean(emp?.isHr),
    };

    if (canSeeWorkedDays) {
      employeeData.worked_days = workedDays;
      employeeData.attendance = (emp?.attendance || []).map((a) => ({
        month: a.month.toISOString().substring(0, 7),
        workedDays: a.workedDays,
      }));
    }

    if (canSeePersonalInfo) {
      employeeData.dob = emp?.dob;
      employeeData.age = age;
      employeeData.address = emp?.address;
      employeeData.phoneNumber = emp?.phoneNumber;
      employeeData.idCardNumber = emp?.idCardNumber;
    }

    if (canSeeCompensation) {
      employeeData.baseSalary = emp?.baseSalary || 0;
      employeeData.allowance = emp?.allowance || 0;
      employeeData.bonus = emp?.bonus || 0;
      employeeData.totalSalary = (emp?.baseSalary || 0) + (emp?.allowance || 0) + (emp?.bonus || 0);
      employeeData.bankAccount = emp?.bankAccount;
      employeeData.bankName = emp?.bankName;
      employeeData.insuranceSalary = emp?.insuranceSalary;
    }

    // Log sensitive access for 3-tier compliance (Decree 13/2023/ND-CP & Law 91/2025/QH15)
    if (canSeeCompensation || canSeePersonalInfo) {
      db.auditLog.create({
        data: {
          action: "PROFILE_SENSITIVE_VIEW",
          targetType: "PROFILE",
          targetId: targetProfile.id,
          actorId: viewer.userId,
          detail: {
            viewerName: viewer.name,
            viewerRole: asRole || (isSelf ? "SELF" : "COLLABORATOR"),
            viewedTarget: targetProfile.name,
            fieldsAccessed: allowedFields.filter((f) =>
              ["personalInfo", "compensation", "workedDays"].includes(f)
            ),
            purpose: isSelf
              ? "Xem hồ sơ cá nhân và bảng lương"
              : "Kiểm tra đãi ngộ và đối soát nhân sự",
            decree: "Nghị định 13/2023/NĐ-CP & Luật 91/2025/QH15",
          },
        },
      }).catch(() => {});
    }

    const orgUnits = targetProfile.orgUnitMembers.map((m) => ({
      id: m.orgUnit.id,
      name: m.orgUnit.name,
      type: m.orgUnit.type,
      parentName: m.orgUnit.parent?.name || null,
      role: m.role,
    }));

    const commendations = targetProfile.receivedCommendations.map((c) => ({
      id: c.id,
      title: "Khen thưởng xuất sắc",
      content: c.reason,
    }));

    const result = {
      // Direct fields for backward compatibility
      id: targetProfile.id,
      name: targetProfile.name,
      imageUrl: targetProfile.imageUrl,
      email: allowedFields.includes("email") ? targetProfile.email : undefined,
      jobTitle: emp?.jobTitle || "Nhân viên",
      employeeCode: emp?.employeeCode || "N/A",
      tenure,
      orgUnits,
      attendance: canSeeWorkedDays ? employeeData.attendance : undefined,
      allowedFields,
      accessLevel,
      relationship: {
        isSelf,
        isLead,
        isHead,
        isHr,
      },

      // Nested objects structured for UserProfileCard
      profile: {
        id: targetProfile.id,
        name: targetProfile.name,
        imageUrl: targetProfile.imageUrl,
        email: allowedFields.includes("email") ? targetProfile.email : null,
      },
      employee: employeeData,
      commendations,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
