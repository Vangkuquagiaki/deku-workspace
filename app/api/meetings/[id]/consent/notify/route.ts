export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: params.id }, { code: params.id }],
      },
      include: {
        participants: true,
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    const now = new Date();

    // Update meeting with notice timestamp and host ID
    await db.meeting.update({
      where: { id: meeting.id },
      data: {
        recordingNoticeAt: now,
        recordingNoticeBy: profile.id,
      },
    });

    // Ensure host is a participant with AGREED status
    const hostParticipant = meeting.participants.find(
      (p: any) => p.userId === profile.userId || p.name === profile.name
    );

    if (hostParticipant) {
      await db.participant.update({
        where: { id: hostParticipant.id },
        data: {
          consentStatus: "AGREED",
          respondedAt: now,
        },
      });
    } else {
      await db.participant.create({
        data: {
          meetingId: meeting.id,
          userId: profile.userId,
          name: profile.name,
          role: "HOST",
          consentStatus: "AGREED",
          respondedAt: now,
        },
      });
    }

    // Set any other participant with null consent to PENDING
    for (const p of meeting.participants) {
      if (p.userId !== profile.userId && !p.consentStatus) {
        await db.participant.update({
          where: { id: p.id },
          data: {
            consentStatus: "PENDING",
          },
        });
      }
    }

    await logAudit({
      actorId: profile.id,
      action: "RECORDING_CONSENT_REQUESTED",
      targetType: "Meeting",
      targetId: meeting.id,
      detail: {
        meetingCode: meeting.code,
        title: meeting.title,
        timestamp: now.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      recordingNoticeAt: now,
      recordingNoticeBy: profile.id,
    });
  } catch (error) {
    console.error("[MEETING_CONSENT_NOTIFY_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
