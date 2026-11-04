export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { SUPPORTED_LANGUAGES } from "@/lib/translation-service";

export async function GET() {
  return NextResponse.json({
    languages: SUPPORTED_LANGUAGES,
    defaultSource: "vi",
    defaultTarget: "en",
    asrEngine: "Browser WebSpeech / Whisper Realtime",
    mtEngine: "Deku Enterprise MT + Glossary Pipeline",
    ttsEngine: "Web Speech Synthesis API / Neural TTS",
  });
}

