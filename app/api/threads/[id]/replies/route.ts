export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const postId = params.id;
    const { body, parentReplyId, depth = 0 } = await req.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return new NextResponse("Body is required", { status: 400 });
    }

    const reply = await db.socialReply.create({
      data: {
        postId,
        authorId: profile.id,
        authorName: profile.name,
        authorAvatar: profile.imageUrl,
        body: body.trim(),
        parentReplyId: parentReplyId || null,
        depth: depth || 0,
        status: "PUBLISHED",
      },
      include: {
        author: true,
      },
    });

    await db.socialPost.update({
      where: { id: postId },
      data: {
        repliesCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      id: reply.id,
      author: {
        id: reply.authorId,
        name: reply.authorName || reply.author?.name || "Đồng nghiệp",
        imageUrl: reply.authorAvatar || reply.author?.imageUrl || "",
      },
      body: reply.body,
      depth: reply.depth,
      createdAt: reply.createdAt,
    });
  } catch (error) {
    console.error("[THREAD_REPLY_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

