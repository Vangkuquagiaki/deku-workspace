import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { acceptEmployeeInvitation } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const body = await req.json();
    const token = body.token;
    const userId = profile?.id || body.userId;

    if (!token) {
      return NextResponse.json({ error: "Token lời mời không được để trống" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "User ID không hợp lệ" }, { status: 400 });
    }

    const invitation = await acceptEmployeeInvitation({
      token,
      profileId: userId,
      email: profile?.email || body.email || "",
    });
    return NextResponse.json({ success: true, invitation });
  } catch (error: any) {
    console.error("[INVITATION_ACCEPT_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 400 });
  }
}
