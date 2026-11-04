import React from "react";
import { redirect } from "next/navigation";
import crypto from "crypto";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

interface InviteCodePageProps {
  params: {
    inviteCode: string;
  };
}

export default async function InviteCodePage({
  params: { inviteCode },
}: InviteCodePageProps) {
  const profile = await currentProfile();

  if (!profile) return redirect(`/sign-in?redirect_url=/invite/${inviteCode}`);

  if (!inviteCode) return redirect("/base");

  // 1. Check if inviteCode is an EmployeeInvitation token (SHA-256 hash lookup)
  const tokenHash = crypto.createHash("sha256").update(inviteCode).digest("hex");
  const employeeInvite = await db.employeeInvitation.findUnique({
    where: { tokenHash },
  });

  if (employeeInvite) {
    // Check expiration & status
    if (employeeInvite.status === "PENDING" && (!employeeInvite.expiresAt || employeeInvite.expiresAt > new Date())) {
      // Mark as accepted
      await db.employeeInvitation.update({
        where: { id: employeeInvite.id },
        data: {
          status: "ACCEPTED",
          usedAt: new Date(),
        },
      });

      // Find or assign to OrgUnit if specified
      if (employeeInvite.orgUnitName || employeeInvite.orgUnitId) {
        let targetOrgUnit = employeeInvite.orgUnitId
          ? await db.orgUnit.findUnique({ where: { id: employeeInvite.orgUnitId } })
          : await db.orgUnit.findFirst({
              where: { name: { contains: employeeInvite.orgUnitName || "", mode: "insensitive" } },
            });

        if (!targetOrgUnit) {
          targetOrgUnit = await db.orgUnit.findFirst();
        }

        if (targetOrgUnit) {
          await db.orgUnitMember.upsert({
            where: {
              orgUnitId_profileId: {
                orgUnitId: targetOrgUnit.id,
                profileId: profile.id,
              },
            },
            update: {
              role: employeeInvite.role || "MEMBER",
            },
            create: {
              orgUnitId: targetOrgUnit.id,
              profileId: profile.id,
              role: employeeInvite.role || "MEMBER",
              isPrimary: true,
            },
          });
        }
      }

      // Upsert EmployeeProfile for the user
      await db.employeeProfile.upsert({
        where: { profileId: profile.id },
        update: {
          employmentStatus: "ACTIVE",
          jobTitle: employeeInvite.role === "LEAD" ? "Trưởng nhóm" : "Chuyên viên",
        },
        create: {
          profileId: profile.id,
          employeeCode: employeeInvite.employeeCode || `E${Math.floor(1000 + Math.random() * 9000)}`,
          jobTitle: employeeInvite.role === "LEAD" ? "Trưởng nhóm" : "Chuyên viên",
          employmentStatus: "ACTIVE",
          hiredOn: new Date(),
        },
      });

      // Ensure membership in default company Discord server
      const defaultServer = await db.server.findFirst();
      if (defaultServer) {
        const isMember = await db.member.findFirst({
          where: { serverId: defaultServer.id, profileId: profile.id },
        });
        if (!isMember) {
          await db.member.create({
            data: {
              serverId: defaultServer.id,
              profileId: profile.id,
              role: employeeInvite.role === "LEAD" ? "MODERATOR" : "GUEST",
            },
          });
        }
      }

      return redirect("/base?tab=today&welcome=1");
    } else {
      // Token expired or already used
      return redirect("/base?tab=today&invite_error=expired");
    }
  }

  // 2. Legacy Discord server invite code fallback
  const existingServer = await db.server.findFirst({
    where: {
      inviteCode,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
  });

  if (existingServer) return redirect(`/servers/${existingServer.id}`);

  const targetServer = await db.server.findFirst({
    where: { inviteCode },
  });

  if (targetServer) {
    await db.server.update({
      where: { id: targetServer.id },
      data: {
        members: {
          create: [{ profileId: profile.id }],
        },
      },
    });
    return redirect(`/servers/${targetServer.id}`);
  }

  return redirect("/base");
}
