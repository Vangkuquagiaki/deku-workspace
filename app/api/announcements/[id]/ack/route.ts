import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { acknowledgeAnnouncement } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const profile = await currentProfile().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const employeeId = profile?.id || body.employeeId || "demo_employee_01";
    const employeeName = profile?.name || body.employeeName || "Thành viên";

    const ack = await acknowledgeAnnouncement({
      campaignId,
      employeeId,
      employeeName,
      notes: body.notes,
    });

    return NextResponse.json(ack);
  } catch (error: any) {
    console.error("[ANNOUNCEMENT_ACK_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
