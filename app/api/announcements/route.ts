import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { createAnnouncementDraft, publishAnnouncement } from "@/lib/personal-assistant-service";

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

    // Find a valid Profile for authoring if currentProfile is null in demo mode
    let authorProfile = profile;
    if (!authorProfile) {
      authorProfile = await db.profile.findFirst();
    }

    const authorId = authorProfile?.id || "demo_executive_01";
    const authorName = authorProfile?.name || body.authorName || "Ban Giám Đốc";
    const shouldPublishImmediately = body.status !== "DRAFT";

    // 1. Create announcement record
    const announcement = await db.announcementCampaign.create({
      data: {
        title: body.title.trim(),
        body: (body.content || body.body || body.summary || "").trim(),
        priority: body.priority || "MANDATORY",
        status: shouldPublishImmediately ? "PUBLISHED" : "DRAFT",
        authorId,
        authorName,
        audienceType: body.targetScope || "COMPANY",
        audienceScope: body.targetAudience || null,
        deadline: body.ackDeadline ? new Date(body.ackDeadline) : new Date(Date.now() + 3 * 24 * 3600 * 1000),
        requiresAck: body.requireAck ?? true,
        version: 1,
        publishedAt: shouldPublishImmediately ? new Date() : null,
      },
    });

    // 2. Broadcast to Company Bulletin (db.post) so it appears in Bảng tin
    if (shouldPublishImmediately && authorProfile) {
      try {
        await db.post.create({
          data: {
            title: `[${announcement.priority}] ${announcement.title}`,
            body: announcement.body,
            authorId: authorProfile.id,
            isPinned: announcement.priority === "EMERGENCY" || announcement.priority === "MANDATORY",
            publishedAt: new Date(),
          },
        });
      } catch (postErr) {
        console.warn("[ANNOUNCEMENT_POST_SYNC_WARN]", postErr);
      }
    }

    return NextResponse.json(announcement);
  } catch (error: any) {
    console.error("[ANNOUNCEMENTS_POST_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
