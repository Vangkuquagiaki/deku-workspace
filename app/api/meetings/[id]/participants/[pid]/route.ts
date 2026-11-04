export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: meetingId, pid: participantId } = params;

    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: meetingId }, { code: meetingId }],
      },
      include: {
        participants: true,
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    // Check if caller is host or cohost
    const caller = meeting.participants.find((p) => p.userId === profile.userId);
    const isHostOrCohost =
      meeting.hostId === profile.userId ||
      caller?.role === "HOST" ||
      caller?.role === "COHOST";

    if (!isHostOrCohost) {
      return new NextResponse("Forbidden: Host or Cohost only", { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { role, muteMic } = body;

    const targetParticipant = meeting.participants.find(
      (p) => p.id === participantId || p.userId === participantId
    );

    if (!targetParticipant) {
      return new NextResponse("Participant not found", { status: 404 });
    }

    // If muteMic requested, mute participant via LiveKit RoomServiceClient if available
    if (muteMic && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      try {
        const { RoomServiceClient } = await import("livekit-server-sdk");
        const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL.replace(/^ws/, "http");
        const roomService = new RoomServiceClient(
          livekitHost,
          process.env.LIVEKIT_API_KEY,
          process.env.LIVEKIT_API_SECRET
        );
        const roomName = `meet_${meeting.code}`;
        // Mute tracks of the target participant
        await roomService.mutePublishedTrack(
          roomName,
          targetParticipant.userId || targetParticipant.id,
          "microphone",
          true
        );
      } catch (err) {
        console.warn("LiveKit RoomService mute error:", err);
      }
    }

    const updated = await db.participant.update({
      where: { id: targetParticipant.id },
      data: {
        ...(role ? { role } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PARTICIPANT_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: meetingId, pid: participantId } = params;

    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: meetingId }, { code: meetingId }],
      },
      include: {
        participants: true,
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    const caller = meeting.participants.find((p) => p.userId === profile.userId);
    const isHostOrCohost =
      meeting.hostId === profile.userId ||
      caller?.role === "HOST" ||
      caller?.role === "COHOST";

    if (!isHostOrCohost) {
      return new NextResponse("Forbidden: Host or Cohost only", { status: 403 });
    }

    const targetParticipant = meeting.participants.find(
      (p) => p.id === participantId || p.userId === participantId
    );

    if (!targetParticipant) {
      return new NextResponse("Participant not found", { status: 404 });
    }

    // Remove from LiveKit room if configured
    if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      try {
        const { RoomServiceClient } = await import("livekit-server-sdk");
        const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL.replace(/^ws/, "http");
        const roomService = new RoomServiceClient(
          livekitHost,
          process.env.LIVEKIT_API_KEY,
          process.env.LIVEKIT_API_SECRET
        );
        const roomName = `meet_${meeting.code}`;
        await roomService.removeParticipant(
          roomName,
          targetParticipant.userId || targetParticipant.id
        );
      } catch (err) {
        console.warn("LiveKit RoomService kick error:", err);
      }
    }

    // Mark leftAt or delete from DB
    await db.participant.update({
      where: { id: targetParticipant.id },
      data: { leftAt: new Date() },
    });

    return NextResponse.json({ success: true, removed: targetParticipant.name });
  } catch (error) {
    console.error("[PARTICIPANT_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
