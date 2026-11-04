export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const meetingId = params.id;
    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: meetingId }, { code: meetingId }],
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    // Only host can end meeting for all
    if (meeting.hostId !== profile.userId) {
      return new NextResponse("Only host can end meeting", { status: 403 });
    }

    const updated = await db.meeting.update({
      where: { id: meeting.id },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[MEETING_END_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
