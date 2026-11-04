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
  let profile = null;
  try {
    profile = await currentProfile();
  } catch (err) {
    console.error("[SERVER_LAYOUT_PROFILE_ERR]", err);
  }

  if (!profile) return redirect("/sign-in");

  let server = null;
  try {
    server = await db.server.findUnique({
      where: {
        id: params.serverId,
        members: {
          some: {
            profileId: profile.id
          }
        }
      }
    });
  } catch (dbErr) {
    console.error("[SERVER_LAYOUT_DB_ERR]", dbErr);
    // Retry once in case of cold start
    try {
      await new Promise((r) => setTimeout(r, 400));
      server = await db.server.findUnique({
        where: {
          id: params.serverId,
        }
      });
    } catch (_) {}
  }

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
