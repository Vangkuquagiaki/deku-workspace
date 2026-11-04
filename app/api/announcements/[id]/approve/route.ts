import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { approveAnnouncement } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const profile = await currentProfile().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const approverId = profile?.id || body.approverId || "hr_admin_01";
    const approverName = profile?.name || body.approverName || "HR Quản trị viên";

    const result = await approveAnnouncement({
      campaignId,
      approverId,
      approverName,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ANNOUNCEMENT_APPROVE_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
