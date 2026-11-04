export const dynamic = "force-dynamic";

import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";

export async function GET(req: NextRequest) {
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

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

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

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    name: displayName,
    metadata: JSON.stringify({
      avatarUrl: imageUrl,
      name: displayName,
    }),
  });

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true
  });

  return NextResponse.json({ token: at.toJwt() });
}
