import { NextRequest, NextResponse } from "next/server";
import { getAnnouncementReceiptStats } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const stats = await getAnnouncementReceiptStats(campaignId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[ANNOUNCEMENT_RECEIPTS_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

