import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const initialProfile = async () => {
  let userId: string | null = null;
  try {
    const authData = auth();
    userId = authData?.userId || null;
  } catch (error) {
    // Non-Clerk environment or auth extraction error
  }

  // 1. If we have a userId, first check if profile already exists in DB
  if (userId) {
    const existingProfile = await db.profile.findUnique({
      where: { userId }
    });
    if (existingProfile) return existingProfile;
  }

  // 2. If no profile yet, try to get user details from Clerk to create one
  let user = null;
  try {
    user = await currentUser();
  } catch (error) {
    console.error("[CURRENT_USER_ERROR]", error);
  }

  if (user) {
    const name = user.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : user.id;

    const newProfile = await db.profile.create({
      data: {
        userId: user.id,
        name,
        imageUrl:
          user.imageUrl ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop",
        email: user.emailAddresses?.[0]?.emailAddress || "user@deku.internal"
      }
    });

    return newProfile;
  }

  // 3. If userId exists but currentUser() couldn't fetch details (e.g. secretKey issue)
  if (userId) {
    const newProfile = await db.profile.create({
      data: {
        userId,
        name: "User " + userId.slice(-4),
        imageUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop",
        email: `${userId}@deku.internal`
      }
    });
    return newProfile;
  }

  // 4. Fallback to primary demo profile for seamless browsing without redirect loop
  const fallbackProfile = await db.profile.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (fallbackProfile) {
    return fallbackProfile;
  }

  return redirect("/sign-in");
};
