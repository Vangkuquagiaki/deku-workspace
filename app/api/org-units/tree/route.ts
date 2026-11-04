import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all departments
    const departments = await db.orgUnit.findMany({
      where: { type: "DEPARTMENT" },
      include: {
        children: {
          include: {
            members: {
              include: {
                profile: true,
              },
            },
            tasks: true,
          },
        },
        members: {
          include: {
            profile: true,
          },
        },
        tasks: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("[ORG_UNITS_TREE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
