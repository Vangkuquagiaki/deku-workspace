export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const posts = await db.post.findMany({
      include: {
        category: true,
        author: true,
        audienceOrgUnit: true,
        reads: {
          where: { profileId: profile.id },
        },
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });

    const formatted = posts.map((p) => ({
      ...p,
      isRead: p.reads.length > 0,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[POSTS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, body: content, categoryId, isPinned = false, audienceOrgUnitId } = body;

    if (!title || !content) {
      return new NextResponse("Title and content required", { status: 400 });
    }

    const post = await db.post.create({
      data: {
        title,
        body: content,
        categoryId: categoryId || null,
        isPinned: Boolean(isPinned),
        authorId: profile.id,
        audienceOrgUnitId: audienceOrgUnitId || null,
      },
      include: {
        category: true,
        author: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POSTS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
