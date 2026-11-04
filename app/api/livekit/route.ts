export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";

const defaultApiKey = process.env.LIVEKIT_API_KEY || "APIuPrn5sZxJxbr";
const defaultApiSecret = process.env.LIVEKIT_API_SECRET || "FZVAX93toFvmStN4iVAgqrJPvc6h5cy1P0VcJpx8HSP";
const defaultWsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://deku-p77u1a3n.livekit.cloud";

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

    const apiKey = defaultApiKey;
    const apiSecret = defaultApiSecret;
    const wsUrl = defaultWsUrl;

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

    const { AccessToken } = await import("livekit-server-sdk");

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

    const jwtToken = await at.toJwt();

    return NextResponse.json({ token: jwtToken });
  } catch (error: any) {
    console.error("[LIVEKIT_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
