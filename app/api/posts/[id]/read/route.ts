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

    await db.postRead.upsert({
      where: {
        postId_profileId: {
          postId,
          profileId: profile.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        postId,
        profileId: profile.id,
      },
    });

    return NextResponse.json({ success: true, read: true });
  } catch (error) {
    console.error("[POST_READ_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
