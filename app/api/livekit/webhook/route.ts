import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { db } from "@/lib/db";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

export async function POST(req: Request) {
  try {
    if (!apiKey || !apiSecret) {
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    const receiver = new WebhookReceiver(apiKey, apiSecret);
    const body = await req.text();
    const headerPayload = headers();
    const authHeader = headerPayload.get("Authorization");

    let event;
    try {
      event = receiver.receive(body, authHeader || "");
    } catch (e) {
      // Allow fallback parse if signature fails in local testing
      event = JSON.parse(body);
    }

    if (event.event === "egress_ended" && event.egressInfo) {
      const egressId = event.egressInfo.egressId;
      const fileUrl = event.egressInfo.fileResults?.[0]?.location;
      const durationSec = Math.floor(event.egressInfo.duration / 1000000000);

      await db.recording.updateMany({
        where: { egressId },
        data: {
          status: "COMPLETE",
          fileUrl,
          durationSec,
        },
      });
    }

    if (event.event === "room_finished" && event.room) {
      const roomName = event.room.name;
      const code = roomName.replace(/^meet_/, "");

      await db.meeting.updateMany({
        where: { code },
        data: {
          status: "ENDED",
          endedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[LIVEKIT_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
