export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile();
    const body = await req.json().catch(() => ({}));
    const {
      sourceText,
      translatedText,
      suggestedText,
      issueType = "ACCURACY",
      context = "meeting",
    } = body;

    const log = await db.auditLog.create({
      data: {
        actorId: profile?.userId || "anonymous",
        action: "TRANSLATION_FEEDBACK_SUBMITTED",
        targetType: "TRANSLATION",
        detail: {
          sourceText,
          translatedText,
          suggestedText,
          issueType,
          context,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error: any) {
    console.error("[TRANSLATION_FEEDBACK_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit translation feedback" },
      { status: 500 }
    );
  }
}

