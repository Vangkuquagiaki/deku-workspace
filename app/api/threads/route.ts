import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);
    const topicSlug = searchParams.get("topic");
    const audience = searchParams.get("audience");

    const where: any = {
      status: "PUBLISHED",
    };

    if (audience && audience !== "ALL") {
      where.audience = audience;
    }

    if (topicSlug && topicSlug !== "all") {
      where.topics = {
        some: {
          topic: {
            slug: topicSlug,
          },
        },
      };
    }

    const posts = await db.socialPost.findMany({
      where,
      include: {
        author: true,
        topics: {
          include: {
            topic: true,
          },
        },
        replies: {
          where: { status: "PUBLISHED" },
          include: {
            author: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        reactions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const topics = await db.socialTopic.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        author: {
          id: p.authorId,
          name: p.authorName || p.author?.name || "Thành viên",
          imageUrl: p.authorAvatar || p.author?.imageUrl || "",
          role: p.authorRole || "Nhân sự",
        },
        audience: p.audience,
        postType: p.postType,
        body: p.body,
        likesCount: p.likesCount || p.reactions.length,
        repliesCount: p.replies.length,
        topics: p.topics.map((t) => t.topic.name),
        hasLiked: profile ? p.reactions.some((r) => r.profileId === profile.id) : false,
        replies: p.replies.map((r) => ({
          id: r.id,
          author: {
            id: r.authorId,
            name: r.authorName || r.author?.name || "Đồng nghiệp",
            imageUrl: r.authorAvatar || r.author?.imageUrl || "",
          },
          body: r.body,
          depth: r.depth,
          createdAt: r.createdAt,
        })),
        createdAt: p.createdAt,
      })),
      topics,
    });
  } catch (error) {
    console.error("[THREADS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { body, audience = "COMPANY", topicSlug } = await req.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return new NextResponse("Body is required", { status: 400 });
    }

    const post = await db.socialPost.create({
      data: {
        authorId: profile.id,
        authorName: profile.name,
        authorRole: "Thành viên",
        authorAvatar: profile.imageUrl,
        audience,
        body: body.trim(),
        status: "PUBLISHED",
      },
    });

    if (topicSlug) {
      const topic = await db.socialTopic.findUnique({
        where: { slug: topicSlug },
      });
      if (topic) {
        await db.socialPostTopic.create({
          data: {
            postId: post.id,
            topicId: topic.id,
          },
        });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[THREADS_POST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

