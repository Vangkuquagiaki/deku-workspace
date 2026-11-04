import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

interface ServerIdPageProps {
  params: {
    serverId: string;
  };
}

export default async function ServerIdPage({ params }: ServerIdPageProps) {
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
    },
    include: {
      channels: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!server || !server.channels.length) return redirect("/base");

  const initialChannel =
    server.channels.find((c) => c.name === "general") ||
    server.channels.find((c) => c.type === "TEXT") ||
    server.channels[0];

  return redirect(`/servers/${params.serverId}/channels/${initialChannel.id}`);
}
