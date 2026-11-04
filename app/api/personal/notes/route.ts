import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const ownerId = profile?.id || req.nextUrl.searchParams.get("userId") || "demo_employee_01";

    const notes = await db.personalNote.findMany({
      where: { ownerId },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error("[PERSONAL_NOTES_GET_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile().catch(() => null);
    const body = await req.json();
    const ownerId = profile?.id || body.userId || "demo_employee_01";

    const note = await db.personalNote.create({
      data: {
        ownerId,
        title: body.title || "Ghi chú không tiêu đề",
        content: body.content || "",
        category: body.category || "WORK",
        isPinned: Boolean(body.isPinned),
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error("[PERSONAL_NOTES_POST_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to create note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("id");
    if (!noteId) {
      return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
    }

    await db.personalNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PERSONAL_NOTES_DELETE_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to delete note" }, { status: 500 });
  }
}
