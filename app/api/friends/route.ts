export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { FriendStatus } from "@prisma/client";

// GET /api/friends - Get all friends and pending requests for current user
export async function GET() {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { senderId: profile.id },
          { receiverId: profile.id }
        ]
      },
      include: {
        sender: true,
        receiver: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Group into accepted friends, incoming pending, outgoing pending
    const accepted = friendships
      .filter((f) => f.status === FriendStatus.ACCEPTED)
      .map((f) => {
        const friend = f.senderId === profile.id ? f.receiver : f.sender;
        return {
          friendshipId: f.id,
          friend,
          createdAt: f.createdAt
        };
      });

    const incoming = friendships
      .filter((f) => f.status === FriendStatus.PENDING && f.receiverId === profile.id)
      .map((f) => ({
        friendshipId: f.id,
        sender: f.sender,
        createdAt: f.createdAt
      }));

    const outgoing = friendships
      .filter((f) => f.status === FriendStatus.PENDING && f.senderId === profile.id)
      .map((f) => ({
        friendshipId: f.id,
        receiver: f.receiver,
        createdAt: f.createdAt
      }));

    return NextResponse.json({
      friends: accepted,
      incoming,
      outgoing
    });
  } catch (error) {
    console.error("[FRIENDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/friends - Send friend request
export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, targetEmail, targetName } = body;

    let targetProfile = null;

    if (targetUserId) {
      targetProfile = await db.profile.findFirst({
        where: {
          OR: [
            { id: targetUserId },
            { userId: targetUserId }
          ]
        }
      });
    } else if (targetEmail) {
      targetProfile = await db.profile.findFirst({
        where: {
          email: {
            equals: targetEmail.trim(),
            mode: "insensitive"
          }
        }
      });
    } else if (targetName) {
      targetProfile = await db.profile.findFirst({
        where: {
          name: {
            equals: targetName.trim(),
            mode: "insensitive"
          }
        }
      });
    }

    if (!targetProfile) {
      return new NextResponse("Người dùng không tồn tại", { status: 404 });
    }

    if (targetProfile.id === profile.id) {
      return new NextResponse("Bạn không thể kết bạn với chính mình", { status: 400 });
    }

    // Check existing friendship
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId: profile.id, receiverId: targetProfile.id },
          { senderId: targetProfile.id, receiverId: profile.id }
        ]
      }
    });

    if (existing) {
      if (existing.status === FriendStatus.ACCEPTED) {
        return new NextResponse("Hai bạn đã là bạn bè của nhau", { status: 400 });
      }
      if (existing.status === FriendStatus.PENDING) {
        // If the other user already sent a request, auto-accept it!
        if (existing.senderId === targetProfile.id) {
          const updated = await db.friendship.update({
            where: { id: existing.id },
            data: { status: FriendStatus.ACCEPTED }
          });
          return NextResponse.json(updated);
        }
        return new NextResponse("Lời mời kết bạn đã được gửi trước đó", { status: 400 });
      }
      // Re-send if previously declined
      const updated = await db.friendship.update({
        where: { id: existing.id },
        data: {
          senderId: profile.id,
          receiverId: targetProfile.id,
          status: FriendStatus.PENDING
        }
      });
      return NextResponse.json(updated);
    }

    const friendship = await db.friendship.create({
      data: {
        senderId: profile.id,
        receiverId: targetProfile.id,
        status: FriendStatus.PENDING
      }
    });

    return NextResponse.json(friendship);
  } catch (error) {
    console.error("[FRIENDS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/friends - Accept or reject friend request
export async function PATCH(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { friendshipId, action } = body; // action: "accept" | "decline"

    if (!friendshipId || !action) {
      return new NextResponse("Thiếu thông tin", { status: 400 });
    }

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return new NextResponse("Không tìm thấy lời mời kết bạn", { status: 404 });
    }

    if (friendship.receiverId !== profile.id && friendship.senderId !== profile.id) {
      return new NextResponse("Không có quyền", { status: 403 });
    }

    if (action === "accept") {
      const updated = await db.friendship.update({
        where: { id: friendshipId },
        data: { status: FriendStatus.ACCEPTED }
      });
      return NextResponse.json(updated);
    } else {
      await db.friendship.delete({
        where: { id: friendshipId }
      });
      return NextResponse.json({ message: "Đã hủy lời mời kết bạn" });
    }
  } catch (error) {
    console.error("[FRIENDS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/friends - Remove friend
export async function DELETE(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const friendshipId = searchParams.get("friendshipId");

    if (!friendshipId) {
      return new NextResponse("Thiếu friendshipId", { status: 400 });
    }

    await db.friendship.delete({
      where: { id: friendshipId }
    });

    return NextResponse.json({ message: "Đã xóa bạn bè" });
  } catch (error) {
    console.error("[FRIENDS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
