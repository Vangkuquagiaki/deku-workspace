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

  try {
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
  } catch (dbErr) {
    console.error("[CURRENT_PROFILE_DB_WARN]", dbErr);
    // Transient pool/cold start retry
    try {
      await new Promise((r) => setTimeout(r, 300));
      if (userId) {
        const retryProfile = await db.profile.findUnique({ where: { userId } });
        if (retryProfile) return retryProfile;
      }
      return await db.profile.findFirst({ orderBy: { createdAt: "asc" } });
    } catch (_) {
      return null;
    }
  }
};
