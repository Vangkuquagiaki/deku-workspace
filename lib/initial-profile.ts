import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const initialProfile = async () => {
  let user = null;
  try {
    user = await currentUser();
  } catch (error) {
    console.error("[CURRENT_USER_ERROR]", error);
  }

  if (!user) {
    return redirect("/sign-in");
  }

  const profile = await db.profile.findUnique({
    where: {
      userId: user.id
    }
  });

  if (profile) {
    if (user.imageUrl && profile.imageUrl !== user.imageUrl) {
      return await db.profile.update({
        where: { id: profile.id },
        data: { imageUrl: user.imageUrl }
      });
    }
    return profile;
  }

  const name = user.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user.id;

  const newProfile = await db.profile.create({
    data: {
      userId: user.id,
      name,
      imageUrl: user.imageUrl,
      email: user.emailAddresses?.[0]?.emailAddress || "user@deku.internal"
    }
  });

  return newProfile;
};
