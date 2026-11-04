export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    const updated = await db.aiAdminRequest.update({
      where: { id: params.id },
      data: {
        state: "CANCELLED",
      },
    });

    if (profile) {
      await db.auditLog.create({
        data: {
          actorId: profile.userId,
          action: "AI_ADMIN_REQUEST_CANCELLED",
          targetType: "AI_ADMIN_REQUEST",
          targetId: params.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[AI_ADMIN_CANCEL_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to cancel request" },
      { status: 500 }
    );
  }
}
