export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id;
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "vi";

    const segments = await db.transcriptSegment.findMany({
      where: {
        OR: [{ meetingId }, { meeting: { code: meetingId } }],
      },
      orderBy: { startMs: "asc" },
      take: 100,
    });

    return NextResponse.json(segments);
  } catch (error) {
    console.error("[TRANSCRIPT_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id;
    const body = await req.json();
    const { speakerId, speakerName, text, lang = "vi", translation, startMs = 0, endMs = 0 } = body;

    if (!text) {
      return new NextResponse("Text required", { status: 400 });
    }

    // Resolve meeting by ID or Code
    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: meetingId }, { code: meetingId }],
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    const segment = await db.transcriptSegment.create({
      data: {
        meetingId: meeting.id,
        speakerId: speakerId || "anonymous",
        speakerName: speakerName || "Người tham gia",
        lang,
        text,
        translation: translation || {
          en: lang === "vi" ? `[Translated to EN]: ${text}` : text,
          vi: lang === "en" ? `[Bản dịch tiếng Việt]: ${text}` : text,
        },
        startMs: Number(startMs) || 0,
        endMs: Number(endMs) || 0,
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("[TRANSCRIPT_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
