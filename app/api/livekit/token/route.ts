export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import {
  generateLiveKitToken,
  DEFAULT_LIVEKIT_API_KEY,
  DEFAULT_LIVEKIT_API_SECRET,
  DEFAULT_LIVEKIT_URL,
} from "@/lib/livekit";

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile();
    const body = await req.json().catch(() => ({}));
    const { room, username, language = "vi" } = body;

    if (!room) {
      return NextResponse.json({ error: 'Missing "room" parameter' }, { status: 400 });
    }

    const apiKey = DEFAULT_LIVEKIT_API_KEY;
    const apiSecret = DEFAULT_LIVEKIT_API_SECRET;
    const wsUrl = DEFAULT_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Resolve meeting if code is provided (e.g. meet_abc-defg-hij or abc-defg-hij)
    const cleanCode = room.replace(/^meet_/, "");
    const meeting = await db.meeting.findFirst({
      where: {
        OR: [{ code: cleanCode }, { id: cleanCode }],
      },
      include: {
        participants: true,
      },
    });

    let role = "GUEST";
    let displayName = username || (profile ? profile.name : "Khách tham gia");
    let identity = profile ? profile.userId : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (meeting) {
      if (meeting.status === "ENDED") {
        return NextResponse.json({ error: "Cuộc họp đã kết thúc" }, { status: 403 });
      }

      if (profile && profile.userId === meeting.hostId) {
        role = "HOST";
      } else if (profile) {
        const participant = meeting.participants.find((p) => p.userId === profile.userId);
        if (participant) {
          role = participant.role;
        }
      }

      // Record / update participant entry
      if (profile) {
        const existingParticipant = await db.participant.findFirst({
          where: {
            meetingId: meeting.id,
            userId: profile.userId,
          },
        });

        if (existingParticipant) {
          await db.participant.update({
            where: { id: existingParticipant.id },
            data: {
              language,
              role: role as any,
            },
          });
        } else {
          await db.participant.create({
            data: {
              meetingId: meeting.id,
              userId: profile.userId,
              name: displayName,
              language,
              role: role as any,
            },
          });
        }
      }
    }

    const jwtToken = generateLiveKitToken({
      apiKey,
      apiSecret,
      identity,
      name: displayName,
      room,
      metadata: {
        role,
        language,
        avatarUrl: profile?.imageUrl || "",
      },
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      hidden: false,
    });

    return NextResponse.json({
      token: jwtToken,
      identity,
      displayName,
      role,
      room,
      serverUrl: wsUrl,
    });
  } catch (error) {
    console.error("[LIVEKIT_TOKEN_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Support GET by delegating with query params
  const room = req.nextUrl.searchParams.get("room") || "";
  const username = req.nextUrl.searchParams.get("username") || "";
  const language = req.nextUrl.searchParams.get("language") || "vi";

  const fakeReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ room, username, language }),
  });

  return POST(fakeReq);
}
