export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import {
  generateLiveKitToken,
  DEFAULT_LIVEKIT_API_KEY,
  DEFAULT_LIVEKIT_API_SECRET,
  DEFAULT_LIVEKIT_URL,
} from "@/lib/livekit";

export async function GET(req: NextRequest) {
  try {
    const room = req.nextUrl.searchParams.get("room");
    const username = req.nextUrl.searchParams.get("username");
    if (!room) {
      return NextResponse.json(
        { error: 'Missing "room" query parameter' },
        { status: 400 }
      );
    } else if (!username) {
      return NextResponse.json(
        { error: 'Missing "username" query parameter' },
        { status: 400 }
      );
    }

    const apiKey = DEFAULT_LIVEKIT_API_KEY;
    const apiSecret = DEFAULT_LIVEKIT_API_SECRET;
    const wsUrl = DEFAULT_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    let imageUrl = req.nextUrl.searchParams.get("imageUrl") || "";
    let displayName = username;

    try {
      const profile = await currentProfile();
      if (profile) {
        if (!imageUrl && profile.imageUrl) {
          imageUrl = profile.imageUrl;
        }
        if (profile.name) {
          displayName = profile.name;
        }
      }
    } catch (error) {
      // Continue with query param fallback
    }

    const token = generateLiveKitToken({
      apiKey,
      apiSecret,
      identity: username,
      name: displayName,
      room,
      metadata: {
        avatarUrl: imageUrl,
        name: displayName,
      },
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    return NextResponse.json({ token, serverUrl: wsUrl });
  } catch (error: any) {
    console.error("[LIVEKIT_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
