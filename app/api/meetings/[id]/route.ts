export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    const identifier = params?.id?.toLowerCase().trim();

    if (!identifier) {
      return new NextResponse("Meeting ID or Code missing", { status: 400 });
    }

    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: identifier }, { code: identifier }],
      },
      include: {
        participants: true,
        recordings: true,
        segments: {
          orderBy: { startMs: "asc" },
          take: 50,
        },
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    // Auto register or update participant if logged in
    if (profile) {
      const existingParticipant = meeting.participants.find(
        (p) => p.userId === profile.userId
      );

      if (!existingParticipant) {
        await db.participant.create({
          data: {
            meetingId: meeting.id,
            userId: profile.userId,
            name: profile.name,
            role: meeting.hostId === profile.userId ? "HOST" : "MEMBER",
            language: "vi",
          },
        });
      }
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("[MEETING_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
