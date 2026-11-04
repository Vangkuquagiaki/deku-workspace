export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("orgId");
    const terms = await db.glossaryTerm.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(terms);
  } catch (error: any) {
    console.error("[GLOSSARY_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch glossaries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile();
    const body = await req.json().catch(() => ({}));
    const { source, target, lang = "vi-en", orgId = "global" } = body;

    if (!source || !target) {
      return NextResponse.json(
        { error: 'Fields "source" and "target" are required' },
        { status: 400 }
      );
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

    if (profile) {
      await db.auditLog.create({
        data: {
          actorId: profile.userId,
          action: "GLOSSARY_TERM_CREATED",
          targetType: "GLOSSARY",
          targetId: term.id,
          detail: { source, target, lang, orgId },
        },
      });
    }

    return NextResponse.json(term);
  } catch (error: any) {
    console.error("[GLOSSARY_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save glossary term" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing term id" }, { status: 400 });
    }

    await db.glossaryTerm.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[GLOSSARY_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete glossary term" },
      { status: 500 }
    );
  }
}

