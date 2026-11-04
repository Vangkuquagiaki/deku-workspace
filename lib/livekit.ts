import crypto from "crypto";

// Ensure Node 22+ buffer compatibility for any legacy dependencies
try {
  const nodeBuf = require("buffer");
  if (nodeBuf && !nodeBuf.SlowBuffer) {
    nodeBuf.SlowBuffer = Buffer;
  }
} catch (_) {}
if (typeof Buffer !== "undefined" && !(Buffer as any).SlowBuffer) {
  (Buffer as any).SlowBuffer = Buffer;
}

export const DEFAULT_LIVEKIT_API_KEY =
  process.env.LIVEKIT_API_KEY || "APIuPrn5sZxJxbr";
export const DEFAULT_LIVEKIT_API_SECRET =
  process.env.LIVEKIT_API_SECRET || "FZVAX93toFvmStN4iVAgqrJPvc6h5cy1P0VcJpx8HSP";
export const DEFAULT_LIVEKIT_URL =
  process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://deku-p77u1a3n.livekit.cloud";

export interface LiveKitTokenOptions {
  apiKey?: string;
  apiSecret?: string;
  identity: string;
  name?: string;
  room: string;
  metadata?: any;
  ttlSeconds?: number;
  canPublish?: boolean;
  canSubscribe?: boolean;
  canPublishData?: boolean;
  hidden?: boolean;
}

/**
 * Robust, zero-dependency LiveKit JWT generator.
 * Produces official HMAC-SHA256 tokens compatible with LiveKit Cloud.
 * Avoids Node 22 SlowBuffer/buffer-equal-constant-time runtime crashes.
 */
export function generateLiveKitToken({
  apiKey = DEFAULT_LIVEKIT_API_KEY,
  apiSecret = DEFAULT_LIVEKIT_API_SECRET,
  identity,
  name,
  room,
  metadata,
  ttlSeconds = 6 * 3600,
  canPublish = true,
  canSubscribe = true,
  canPublishData = true,
  hidden = false,
}: LiveKitTokenOptions): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    metadata: metadata
      ? typeof metadata === "string"
        ? metadata
        : JSON.stringify(metadata)
      : "",
    name: name || identity,
    video: {
      room,
      roomJoin: true,
      canPublish,
      canSubscribe,
      canPublishData,
      hidden,
    },
    iat: now,
    nbf: now,
    exp: now + ttlSeconds,
    iss: apiKey,
    sub: identity,
    jti: identity,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  return `${headerB64}.${payloadB64}.${signature}`;
}

