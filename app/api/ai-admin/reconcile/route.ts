export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { reconcileOrphanedAccess, fixOrphanedAccess } from "@/lib/ai-hr-service";

export async function GET() {
  try {
    const report = await reconcileOrphanedAccess();
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("[RECONCILE_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reconcile orphaned access" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await currentProfile();
    const actorId = profile?.userId || "security_admin";
    const result = await fixOrphanedAccess(actorId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[RECONCILE_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fix orphaned access" },
      { status: 500 }
    );
  }
}
