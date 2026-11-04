import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(
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

    const total = meeting.participants.length;
    const agreed = meeting.participants.filter((p: any) => p.consentStatus === "AGREED").length;
    const declined = meeting.participants.filter((p: any) => p.consentStatus === "DECLINED").length;
    const pending = meeting.participants.filter(
      (p: any) => !p.consentStatus || p.consentStatus === "PENDING"
    ).length;

    // Consent is unanimous if there is at least 1 participant, notice was issued, and 0 have declined or are pending
    const isUnanimous =
      meeting.recordingNoticeAt !== null &&
      total > 0 &&
      declined === 0 &&
      pending === 0;

    const myConsent =
      meeting.participants.find(
        (p: any) => p.userId === profile.userId || p.name === profile.name
      )?.consentStatus || null;

    return NextResponse.json({
      meetingId: meeting.id,
      recordingNoticeAt: meeting.recordingNoticeAt,
      recordingNoticeBy: meeting.recordingNoticeBy,
      isUnanimous,
      counts: {
        total,
        agreed,
        declined,
        pending,
      },
      myConsent,
      participants: meeting.participants.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        role: p.role,
        consentStatus: p.consentStatus || "PENDING",
        respondedAt: p.respondedAt,
      })),
    });
  } catch (error) {
    console.error("[MEETING_CONSENT_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { consentStatus } = body;

    if (!consentStatus || !["AGREED", "DECLINED"].includes(consentStatus)) {
      return new NextResponse(
        "Invalid consent status. Must be AGREED or DECLINED",
        { status: 400 }
      );
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

    // Upsert participant
    let participant = meeting.participants.find(
      (p: any) => p.userId === profile.userId || p.name === profile.name
    );

    if (participant) {
      participant = await db.participant.update({
        where: { id: participant.id },
        data: {
          consentStatus,
          respondedAt: now,
        },
      });
    } else {
      participant = await db.participant.create({
        data: {
          meetingId: meeting.id,
          userId: profile.userId,
          name: profile.name,
          role: meeting.hostId === profile.userId ? "HOST" : "MEMBER",
          consentStatus,
          respondedAt: now,
        },
      });
    }

    await logAudit({
      actorId: profile.id,
      action:
        consentStatus === "AGREED"
          ? "RECORDING_CONSENT_GIVEN"
          : "RECORDING_CONSENT_DECLINED",
      targetType: "Meeting",
      targetId: meeting.id,
      detail: {
        meetingCode: meeting.code,
        consentStatus,
        participantId: participant.id,
        timestamp: now.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      participantId: participant.id,
      consentStatus,
      respondedAt: now,
    });
  } catch (error) {
    console.error("[MEETING_CONSENT_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
