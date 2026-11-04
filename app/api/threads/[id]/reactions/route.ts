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
    const existing = await db.socialReaction.findUnique({
      where: {
        postId_profileId_type: {
          postId,
          profileId: profile.id,
          type: "LIKE",
        },
      },
    });

    if (existing) {
      await db.socialReaction.delete({
        where: { id: existing.id },
      });
      await db.socialPost.update({
        where: { id: postId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });
      return NextResponse.json({ liked: false });
    } else {
      await db.socialReaction.create({
        data: {
          postId,
          profileId: profile.id,
          type: "LIKE",
        },
      });
      await db.socialPost.update({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("[THREAD_REACTION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

