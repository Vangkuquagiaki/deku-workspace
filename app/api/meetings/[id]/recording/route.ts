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

    const meetingId = params.id;
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

    // M1: Verify consent under Nghị định 13/2023/NĐ-CP
    if (!meeting.recordingNoticeAt) {
      return NextResponse.json(
        {
          error: "CONSENT_NOTICE_NOT_ISSUED",
          message:
            "Chưa phát thông báo đồng thuận ghi âm/ghi hình. Theo Nghị định 13/2023/NĐ-CP, chủ tọa phải phát thông báo và được tất cả người tham gia xác nhận trước khi ghi.",
        },
        { status: 409 }
      );
    }

    const unagreedParticipants = meeting.participants.filter(
      (p) => p.consentStatus !== "AGREED"
    );

    if (unagreedParticipants.length > 0) {
      return NextResponse.json(
        {
          error: "CONSENT_NOT_UNANIMOUS",
          message: `Chưa có đủ đồng thuận từ 100% người tham gia (${unagreedParticipants.length} người chưa đồng ý). Không thể bắt đầu ghi hình theo quy định.`,
          unagreedCount: unagreedParticipants.length,
        },
        { status: 409 }
      );
    }

    const recording = await db.recording.create({
      data: {
        meetingId: meeting.id,
        egressId: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: "ACTIVE",
        startedBy: profile.userId,
      },
    });

    await logAudit({
      actorId: profile.id,
      action: "RECORDING_START",
      targetType: "Recording",
      targetId: recording.id,
      detail: {
        meetingId: meeting.id,
        meetingCode: meeting.code,
        egressId: recording.egressId,
        participantCount: meeting.participants.length,
      },
    });

    return NextResponse.json(recording);
  } catch (error) {
    console.error("[RECORDING_START_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
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

    // Find active recording
    const activeRec = await db.recording.findFirst({
      where: {
        meetingId: meeting.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeRec) {
      const durationSec = Math.floor(
        (Date.now() - new Date(activeRec.createdAt).getTime()) / 1000
      );

      const updated = await db.recording.update({
        where: { id: activeRec.id },
        data: {
          status: "COMPLETE",
          durationSec,
          fileUrl: `/recordings/meeting_${meeting.code}.mp4`,
        },
      });

      await logAudit({
        actorId: profile.id,
        action: "RECORDING_STOP",
        targetType: "Recording",
        targetId: activeRec.id,
        detail: {
          meetingId: meeting.id,
          durationSec,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ message: "No active recording" });
  } catch (error) {
    console.error("[RECORDING_STOP_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

