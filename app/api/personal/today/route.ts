import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { getMyTodayBriefing } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const profileId = profile?.id || req.nextUrl.searchParams.get("userId") || "demo_employee_01";

    const briefing = await getMyTodayBriefing(profileId);

    return NextResponse.json(briefing);
  } catch (error: any) {
    console.error("[PERSONAL_TODAY_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
