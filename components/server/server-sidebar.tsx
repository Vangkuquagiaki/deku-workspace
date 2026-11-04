import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChannelType, MemberRole } from "@prisma/client";
import { Hash, Mic, ShieldAlert, ShieldCheck, Video, Megaphone, LayoutGrid, Sparkles } from "lucide-react";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

import { ServerHeader } from "@/components/server/server-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerSearch } from "@/components/server/server-search";
import { Separator } from "@/components/ui/separator";
import { ServerSection } from "@/components/server/server-section";
import { ServerChannel } from "@/components/server/server-channel";
import { ServerMember } from "@/components/server/server-member";
import { UserControlBar } from "@/components/server/user-control-bar";
import { ServerCategories } from "@/components/server/server-categories";
import { VoiceStatusBar } from "@/components/server/voice-status-bar";
import { ServerEnterpriseNav } from "@/components/server/server-enterprise-nav";
import { ActiveMeetingSidebar } from "@/components/meeting/active-meeting-sidebar";

const iconMap = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
  [ChannelType.ANNOUNCEMENT]: <Megaphone className="mr-2 h-4 w-4" />,
};


const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500" />
  ),
  [MemberRole.ADMIN]: <ShieldAlert className="h-4 w-4 mr-2 text-rose-500" />
};

export async function ServerSidebar({ serverId }: { serverId: string }) {
  const profile = await currentProfile();

  if (!profile) return redirect("/");

  const server = await db.server.findUnique({
    where: {
      id: serverId
    },
    include: {
      channels: {
        include: {
          orgUnit: true,
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      members: {
        include: {
          profile: true
        },
        orderBy: {
          role: "asc"
        }
      }
    }
  });

  const textChannels = server?.channels.filter(
    (channel) => channel.type === ChannelType.TEXT
  );
  const audioChannels = server?.channels.filter(
    (channel) => channel.type === ChannelType.AUDIO
  );
  const videoChannels = server?.channels.filter(
    (channel) => channel.type === ChannelType.VIDEO
  );

  const members = server?.members.filter(
    (member) => member.profileId !== profile.id
  );

  if (!server) return redirect("/");

  const role = server.members.find(
    (member) => member.profileId === profile.id
  )?.role;

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2b2d31] bg-[#f2f3f5] min-h-0">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex-1 px-3 min-h-0">
        <div className="mt-2">
          <ServerSearch
            data={[
              {
                label: "Kênh thảo luận & Văn bản",
                type: "channel",
                data: textChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type]
                }))
              },
              {
                label: "Phòng họp âm thanh (Voice)",
                type: "channel",
                data: audioChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type]
                }))
              },
              {
                label: "Phòng họp trực tuyến HD (Video)",
                type: "channel",
                data: videoChannels?.map((channel) => ({
                  id: channel.id,
                  name: channel.name,
                  icon: iconMap[channel.type]
                }))
              },
              {
                label: "Nhân sự phòng ban",
                type: "member",
                data: members?.map((member) => ({
                  id: member.id,
                  name: member.profile.name,
                  icon: roleIconMap[member.role]
                }))
              }
            ]}
          />
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        {/* Real-time Active Meeting Room Participants List & Invite */}
        <ActiveMeetingSidebar
          serverId={serverId}
          currentUser={{
            id: profile.userId || profile.id,
            name: profile.name,
            imageUrl: profile.imageUrl,
            role: role,
          }}
          channels={server.channels.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
          }))}
          availableMembers={server.members
            .filter((m) => m && m.profile)
            .map((m) => ({
              id: m.id,
              name: m.profile?.name || "Nhân sự",
              imageUrl: m.profile?.imageUrl || "",
              role: m.role,
            }))}
        />
        {/* Enterprise Integrated Hub (Lark Base, Meetings, Bulletin, HR) */}
        <ServerEnterpriseNav serverId={serverId} />
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        <ServerCategories
          server={server}
          role={role}
          channels={server.channels as any}
          textChannels={textChannels || []}
          audioChannels={audioChannels || []}
          videoChannels={videoChannels || []}
          members={members || []}
        />
      </ScrollArea>
      <VoiceStatusBar serverId={serverId} />
      <UserControlBar profile={profile} />
    </div>
  );
}
