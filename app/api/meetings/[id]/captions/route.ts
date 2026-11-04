export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

// Store captions agent status in-memory or DB
const activeAgents = new Map<string, { enabled: boolean; startedAt: Date; languages: string[] }>();

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
      include: { participants: true },
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

    const body = await req.json().catch(() => ({}));
    const languages = body?.languages || ["vi", "en"];

    activeAgents.set(meeting.id, {
      enabled: true,
      startedAt: new Date(),
      languages,
    });

    return NextResponse.json({
      status: "ACTIVE",
      meetingId: meeting.id,
      meetingCode: meeting.code,
      languages,
      message: "Bot AI phụ đề dịch thuật đã được kích hoạt cho phòng họp.",
    });
  } catch (error) {
    console.error("[CAPTIONS_POST_ERROR]", error);
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
      include: { participants: true },
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

    activeAgents.delete(meeting.id);

    return NextResponse.json({
      status: "DISABLED",
      meetingId: meeting.id,
      message: "Bot AI phụ đề dịch thuật đã tạm dừng.",
    });
  } catch (error) {
    console.error("[CAPTIONS_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id;
    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ id: meetingId }, { code: meetingId }],
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    const agentInfo = activeAgents.get(meeting.id) || {
      enabled: true, // Default enabled for seamless user experience
      startedAt: meeting.startedAt || new Date(),
      languages: ["vi", "en"],
    };

    return NextResponse.json(agentInfo);
  } catch (error) {
    console.error("[CAPTIONS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
