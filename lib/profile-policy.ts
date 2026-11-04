import { db } from "@/lib/db";

export type AllowedField =
  | "name"
  | "imageUrl"
  | "email"
  | "jobTitle"
  | "orgUnits"
  | "tenure"
  | "workedDays"
  | "personalInfo"
  | "compensation";

export interface ProfileAccessResult {
  isSelf: boolean;
  isSameTeam: boolean;
  isLead: boolean;
  isHead: boolean;
  isHr: boolean;
  allowedFields: AllowedField[];
}

/**
 * 3-tier access policy inspired by Lark Base & Enterprise permission model:
 * 1. Bảng / Tổ (Table / Unit level)
 * 2. Bản ghi (Record level)
 * 3. Trường (Field level)
 */
export async function evaluateProfileAccess(
  viewerProfileId: string,
  targetProfileId: string
): Promise<ProfileAccessResult> {
  const isSelf = viewerProfileId === targetProfileId;

  // Fetch viewer memberships and target memberships
  const [viewerMemberships, targetMemberships, viewerEmployeeProfile] =
    await Promise.all([
      db.orgUnitMember.findMany({
        where: { profileId: viewerProfileId },
        include: { orgUnit: true },
      }),
      db.orgUnitMember.findMany({
        where: { profileId: targetProfileId },
        include: { orgUnit: true },
      }),
      db.employeeProfile.findUnique({
        where: { profileId: viewerProfileId },
      }),
    ]);

  const isHr = Boolean(viewerEmployeeProfile?.isHr);

  // Check same team
  const viewerTeamIds = new Set(
    viewerMemberships
      .filter((m) => m.orgUnit.type === "TEAM")
      .map((m) => m.orgUnitId)
  );

  const targetTeamIds = targetMemberships
    .filter((m) => m.orgUnit.type === "TEAM")
    .map((m) => m.orgUnitId);

  const isSameTeam = targetTeamIds.some((teamId) => viewerTeamIds.has(teamId));

  // Check if viewer is LEAD of target's team
  const isLead = viewerMemberships.some((vm) => {
    return (
      vm.role === "LEAD" &&
      targetTeamIds.includes(vm.orgUnitId)
    );
  });

  // Check if viewer is HEAD of the parent department of target's team
  const targetParentDeptIds = targetMemberships
    .map((m) => m.orgUnit.parentId)
    .filter(Boolean);

  const isHead = viewerMemberships.some((vm) => {
    return (
      vm.role === "HEAD" &&
      targetParentDeptIds.includes(vm.orgUnitId)
    );
  });

  // Calculate allowed fields according to Lark Matrix:
  // - name, imageUrl, jobTitle, orgUnits: All internal members can see
  // - tenure: Self, Same Team, Lead, Head, HR
  // - workedDays: Self, Lead (own team), Head (own dept), HR. (NOT general team members)
  const allowed = new Set<AllowedField>(["name", "imageUrl", "jobTitle", "orgUnits"]);

  if (isSelf || isSameTeam || isLead || isHead || isHr) {
    allowed.add("tenure");
  }

  if (isSelf || isLead || isHead || isHr) {
    allowed.add("workedDays");
  }

  if (isSelf || isHr) {
    allowed.add("email");
    allowed.add("personalInfo");
    allowed.add("compensation");
  }

  return {
    isSelf,
    isSameTeam,
    isLead,
    isHead,
    isHr,
    allowedFields: Array.from(allowed),
  };
}
