import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { askPersonalAi } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const body = await req.json();
    const query = body.query;
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const profileId = profile?.id || body.userId || "demo_employee_01";

    const response = await askPersonalAi({
      profileId,
      prompt: query,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[PERSONAL_ASK_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
