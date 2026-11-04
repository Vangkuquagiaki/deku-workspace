import { NextRequest, NextResponse } from "next/server";
import { publishAnnouncement } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const result = await publishAnnouncement(campaignId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ANNOUNCEMENT_PUBLISH_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

