import { auth } from "@clerk/nextjs";

import { db } from "@/lib/db";

export const currentProfile = async () => {
  let userId: string | null = null;
  try {
    const authData = auth();
    userId = authData?.userId || null;
  } catch (error) {
    // Non-Clerk environment (e.g. testing or server scripts)
  }

  if (userId) {
    const profile = await db.profile.findUnique({
      where: { userId }
    });
    if (profile) return profile;
  }

  // Fallback to primary demo profile for seamless offline/demo access
  const fallbackProfile = await db.profile.findFirst({
    orderBy: { createdAt: "asc" }
  });

  return fallbackProfile;
};
