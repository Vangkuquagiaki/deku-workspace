export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { approveAndExecuteRequest } from "@/lib/ai-hr-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await currentProfile();
    const body = await req.json().catch(() => ({}));
    const { note } = body;

    const approverId = profile?.userId || "user_hr_director";
    const approverName = profile?.name || "HR Director";

    const executed = await approveAndExecuteRequest({
      requestId: params.id,
      approverId,
      approverName,
      approvalNote: note || "Phê duyệt thực thi theo chính sách nhân sự",
    });

    return NextResponse.json(executed);
  } catch (error: any) {
    console.error("[AI_ADMIN_APPROVE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to approve AI admin request" },
      { status: 500 }
    );
  }
}

