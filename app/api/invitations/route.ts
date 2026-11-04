import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { createEmployeeInvitation } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const invitations = await db.employeeInvitation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error("[INVITATIONS_GET_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const body = await req.json();
    const invitedById = profile?.id || body.invitedById || "hr_admin_01";
    const invitedByName = profile?.name || body.invitedByName || "HR Quản trị viên";

    const invitation = await createEmployeeInvitation({
      email: body.email,
      role: body.role || "MEMBER",
      orgUnitName: body.department,
      createdBy: invitedById,
      creatorName: invitedByName,
    });

    return NextResponse.json(invitation);
  } catch (error: any) {
    console.error("[INVITATIONS_POST_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
