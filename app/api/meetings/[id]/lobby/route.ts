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

    const body = await req.json();
    const { participantId, action } = body; // action: 'approve' | 'reject'

    if (action === "approve") {
      const participant = await db.participant.update({
        where: { id: participantId },
        data: { role: "MEMBER" },
      });
      return NextResponse.json(participant);
    } else {
      await db.participant.delete({
        where: { id: participantId },
      });
      return NextResponse.json({ success: true, rejected: true });
    }
  } catch (error) {
    console.error("[LOBBY_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
