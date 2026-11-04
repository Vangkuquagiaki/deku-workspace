import React from "react";
import { redirect } from "next/navigation";

import { initialProfile } from "@/lib/initial-profile";
import { db } from "@/lib/db";
import { InitialModal } from "@/components/modals/initial-modal";

export default async function SetupPage() {
  const profile = await initialProfile();

  if (!profile || !profile.id) {
    return redirect("/sign-in");
  }

  const server = await db.server.findFirst({
    where: {
      members: {
        some: {
          profileId: profile.id
        }
      }
    },
    include: {
      channels: {
        take: 1
      }
    }
  });

  if (server && server.channels && server.channels.length > 0) {
    return redirect(`/servers/${server.id}`);
  }

  return <InitialModal />;
}
