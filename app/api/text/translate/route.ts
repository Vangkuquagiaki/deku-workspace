export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translation-service";
import { currentProfile } from "@/lib/current-profile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, sourceLang, targetLang = "en", orgId } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: 'Field "text" is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await translateText({
      text,
      sourceLang,
      targetLang,
      orgId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[TRANSLATE_API_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Internal Translation Error" },
      { status: 500 }
    );
  }
}

