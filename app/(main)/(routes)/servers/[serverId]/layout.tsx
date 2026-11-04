import React from "react";
import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { PersistentVoiceOverlay } from "@/components/chat/persistent-voice-overlay";
import { ResizableServerLayout } from "@/components/server/resizable-server-layout";

export default async function ServerIdLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { serverId: string };
}) {
  const profile = await currentProfile();

  if (!profile) return redirect("/sign-in");

  const server = await db.server.findUnique({
    where: {
      id: params.serverId,
      members: {
        some: {
          profileId: profile.id
        }
      }
    }
  });

  if (!server) return redirect("/base");

  return (
    <ResizableServerLayout
      sidebar={<ServerSidebar serverId={params.serverId} />}
    >
      {children}
      <PersistentVoiceOverlay serverId={params.serverId} />
    </ResizableServerLayout>
  );
}
