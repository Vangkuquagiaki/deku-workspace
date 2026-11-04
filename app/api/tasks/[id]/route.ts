export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const taskId = params.id;
    const body = await req.json();
    const { status, priority, title, description, assigneeId } = body;

    const task = await db.task.update({
      where: { id: taskId },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(assigneeId ? { assigneeId } : {}),
      },
      include: {
        orgUnit: true,
        assignee: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const taskId = params.id;
    await db.task.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TASK_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
