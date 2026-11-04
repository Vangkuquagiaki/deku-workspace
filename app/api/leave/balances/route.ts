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
    const employeeId = searchParams.get("employeeId");

    let targetEmployee = null;
    if (employeeId) {
      targetEmployee = await db.employeeProfile.findUnique({
        where: { id: employeeId },
      });
    } else {
      targetEmployee = await db.employeeProfile.findUnique({
        where: { profileId: profile.id },
      });
      if (!targetEmployee) {
        // Fallback to first employee for demo
        targetEmployee = await db.employeeProfile.findFirst();
      }
    }

    if (!targetEmployee) {
      return NextResponse.json([]);
    }

    // Ensure policies exist
    const policies = await db.leavePolicy.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (policies.length === 0) {
      // Trigger policies auto-init
      await fetch(new URL("/api/leave/policies", req.url).toString()).catch(() => {});
    }

    // Fetch existing balances
    let balances = await db.leaveBalance.findMany({
      where: {
        employeeProfileId: targetEmployee.id,
        year: 2026,
      },
      include: {
        policy: true,
      },
    });

    // Auto initialize balance if missing for any policy
    const existingPolicyIds = new Set(balances.map((b) => b.policyId));
    const allPolicies = await db.leavePolicy.findMany();

    const missingPolicies = allPolicies.filter((p) => !existingPolicyIds.has(p.id));
    if (missingPolicies.length > 0) {
      for (const p of missingPolicies) {
        await db.leaveBalance.create({
          data: {
            employeeProfileId: targetEmployee.id,
            policyId: p.id,
            year: 2026,
            totalDays: p.defaultDays,
            usedDays: 0,
            pendingDays: 0,
          },
        });
      }

      balances = await db.leaveBalance.findMany({
        where: {
          employeeProfileId: targetEmployee.id,
          year: 2026,
        },
        include: {
          policy: true,
        },
      });
    }

    return NextResponse.json({
      employee: {
        id: targetEmployee.id,
        employeeCode: targetEmployee.employeeCode,
        jobTitle: targetEmployee.jobTitle,
      },
      balances,
    });
  } catch (error) {
    console.error("[LEAVE_BALANCES_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
