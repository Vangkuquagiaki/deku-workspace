import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let policies = await db.leavePolicy.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed default policies if empty
    if (policies.length === 0) {
      await db.leavePolicy.createMany({
        data: [
          {
            code: "ANNUAL",
            name: "Nghỉ phép năm (Annual Leave)",
            defaultDays: 12,
            isPaid: true,
            description: "Chế độ nghỉ phép hưởng nguyên lương tiêu chuẩn theo Bộ luật Lao động",
          },
          {
            code: "SICK",
            name: "Nghỉ ốm đau (Sick Leave)",
            defaultDays: 10,
            isPaid: true,
            description: "Nghỉ ốm hưởng trợ cấp bảo hiểm xã hội theo chứng nhận y tế",
          },
          {
            code: "UNPAID",
            name: "Nghỉ không lương (Unpaid Leave)",
            defaultDays: 15,
            isPaid: false,
            description: "Nghỉ việc riêng không hưởng lương theo thỏa thuận với quản lý",
          },
          {
            code: "MATERNITY",
            name: "Nghỉ thai sản / Chế độ (Maternity/Paternity)",
            defaultDays: 180,
            isPaid: true,
            description: "Nghỉ thai sản theo quy định nhà nước và quy chế công ty",
          },
        ],
      });

      policies = await db.leavePolicy.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json(policies);
  } catch (error) {
    console.error("[LEAVE_POLICIES_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
