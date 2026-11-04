import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { createAnnouncementDraft } from "@/lib/personal-assistant-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const userId = profile?.id || req.nextUrl.searchParams.get("userId") || "demo_employee_01";
    const status = req.nextUrl.searchParams.get("status");

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const announcements = await db.announcementCampaign.findMany({
      where: whereClause,
      include: {
        acks: {
          where: { employeeId: userId },
        },
        _count: {
          select: { acks: true },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error("[ANNOUNCEMENTS_GET_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const body = await req.json();
    const authorId = profile?.id || body.authorId || "demo_executive_01";
    const authorName = profile?.name || body.authorName || "Ban Giám Đốc";

    const announcement = await createAnnouncementDraft({
      title: body.title,
      body: body.content || body.body || body.summary || "",
      priority: body.priority,
      authorId,
      authorName,
      audienceType: body.targetScope || "COMPANY",
      audienceScope: body.targetAudience,
      deadline: body.ackDeadline ? new Date(body.ackDeadline) : undefined,
      requiresAck: body.requireAck ?? true,
    });

    return NextResponse.json(announcement);
  } catch (error: any) {
    console.error("[ANNOUNCEMENTS_POST_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
