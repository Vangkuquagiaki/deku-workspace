export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { generateMeetingCode } from "@/lib/meeting-code";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body?.title?.trim() || "Cuộc họp phòng ban & Hội nghị";

    // Generate unique meeting code abc-defg-hij
    let code = generateMeetingCode();
    let existing = await db.meeting.findUnique({ where: { code } });
    while (existing) {
      code = generateMeetingCode();
      existing = await db.meeting.findUnique({ where: { code } });
    }

    const meeting = await db.meeting.create({
      data: {
        code,
        title,
        hostId: profile.userId,
        status: "LIVE",
        startedAt: new Date(),
        lobby: body?.lobby !== undefined ? Boolean(body.lobby) : false,
        participants: {
          create: {
            userId: profile.userId,
            name: profile.name,
            role: "HOST",
            language: "vi",
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("[MEETINGS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const meetings = await db.meeting.findMany({
      where: {
        OR: [
          { hostId: profile.userId },
          { participants: { some: { userId: profile.userId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        participants: true,
        recordings: true,
      },
    });

    const sanitizedMeetings = meetings.map((m) => ({
      ...m,
      recordings: m.recordings.map((r) => ({
        ...r,
        sizeBytes: r.sizeBytes ? Number(r.sizeBytes) : null,
      })),
    }));

    return NextResponse.json(sanitizedMeetings);
  } catch (error) {
    console.error("[MEETINGS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
