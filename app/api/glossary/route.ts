import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "default";

    const terms = await db.glossaryTerm.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(terms);
  } catch (error) {
    console.error("[GLOSSARY_GET_ERROR]", error);
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
    const { source, target, lang = "vi-en", orgId = "default" } = body;

    if (!source || !target) {
      return new NextResponse("Source and target terms required", { status: 400 });
    }

    const term = await db.glossaryTerm.upsert({
      where: {
        orgId_source_lang: {
          orgId,
          source: source.trim(),
          lang,
        },
      },
      update: {
        target: target.trim(),
      },
      create: {
        orgId,
        source: source.trim(),
        target: target.trim(),
        lang,
      },
    });

    return NextResponse.json(term);
  } catch (error) {
    console.error("[GLOSSARY_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID required", { status: 400 });
    }

    await db.glossaryTerm.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GLOSSARY_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
