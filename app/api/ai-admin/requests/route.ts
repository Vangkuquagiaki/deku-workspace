export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";
import { parseAndPlanRequest } from "@/lib/ai-hr-service";

export async function GET(req: NextRequest) {
  try {
    const profile = await currentProfile();
    const state = req.nextUrl.searchParams.get("state");
    const intent = req.nextUrl.searchParams.get("intent");

    const requests = await db.aiAdminRequest.findMany({
      where: {
        ...(state ? { state } : {}),
        ...(intent ? { intent } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("[AI_ADMIN_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch AI admin requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile();
    const body = await req.json().catch(() => ({}));
    const { command, fileData } = body;

    if (!command && (!fileData || fileData.length === 0)) {
      return NextResponse.json(
        { error: "Vui lòng nhập câu lệnh hoặc cung cấp dữ liệu tệp nhân sự." },
        { status: 400 }
      );
    }

    const actorId = profile?.userId || "user_hr_manager";
    const actorName = profile?.name || "HR Administrator";

    const request = await parseAndPlanRequest({
      command,
      fileData,
      actorId,
      actorName,
    });

    return NextResponse.json(request);
  } catch (error: any) {
    console.error("[AI_ADMIN_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process AI admin command" },
      { status: 500 }
    );
  }
}

