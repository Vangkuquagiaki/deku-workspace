export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

function removeVietnameseDiacritics(str: string): string {
  if (!str) return "";
  return str
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: params.id }, { code: params.id }],
      },
      include: {
        segments: {
          orderBy: { startMs: "asc" },
        },
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    if (!query.trim()) {
      return NextResponse.json({
        total: meeting.segments.length,
        results: meeting.segments,
      });
    }

    const normalizedQuery = removeVietnameseDiacritics(query);

    const matched = meeting.segments.filter((seg: any) => {
      const textNorm = removeVietnameseDiacritics(seg.text);
      const speakerNorm = removeVietnameseDiacritics(seg.speakerName || "");
      let translationNorm = "";
      if (seg.translation && typeof seg.translation === "object") {
        translationNorm = removeVietnameseDiacritics(
          JSON.stringify(seg.translation)
        );
      }

      return (
        textNorm.includes(normalizedQuery) ||
        speakerNorm.includes(normalizedQuery) ||
        translationNorm.includes(normalizedQuery)
      );
    });

    return NextResponse.json({
      query,
      normalizedQuery,
      totalMatches: matched.length,
      results: matched.map((seg: any) => ({
        id: seg.id,
        startMs: seg.startMs,
        endMs: seg.endMs,
        speakerName: seg.speakerName,
        text: seg.text,
        translation: seg.translation,
      })),
    });
  } catch (error) {
    console.error("[TRANSCRIPT_SEARCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
