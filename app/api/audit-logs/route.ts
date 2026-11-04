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
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    let whereClause: any = {};
    if (action && action !== "all") {
      whereClause.action = action;
    }
    if (targetType && targetType !== "all") {
      whereClause.targetType = targetType;
    }

    const logs = await db.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      total: logs.length,
      complianceNote: "Tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP",
      logs,
    });
  } catch (error) {
    console.error("[AUDIT_LOGS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
