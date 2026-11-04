import React from "react";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ChannelType } from "@prisma/client";
import { Lock } from "lucide-react";
import Link from "next/link";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatMemberSidebar } from "@/components/chat/chat-member-sidebar";
import { MediaRoom } from "@/components/media-room";
import { VoiceChannelView } from "@/components/chat/voice-channel-view";
import { ChannelWorkView } from "@/components/chat/channel-work-view";

interface ChannelIdPageProps {
  params: {
    serverId: string;
    channelId: string;
  };
}

export default async function ChannelIdPage({
  params: { channelId, serverId }
}: ChannelIdPageProps) {
  const profile = await currentProfile();

  if (!profile) return redirectToSignIn();

  const [channel, member, server] = await Promise.all([
    db.channel.findUnique({
      where: { id: channelId },
      include: { orgUnit: true },
    }),
    db.member.findFirst({
      where: { serverId: serverId, profileId: profile.id },
      include: {
        profile: true
      }
    }),
    db.server.findUnique({
      where: { id: serverId },
      include: {
        members: {
          include: {
            profile: true
          },
          orderBy: {
            role: "asc"
          }
        }
      }
    })
  ]);

  if (!channel || !member || !server) return redirect("/");

  // Enterprise Department Segregation & Access Control
  const isAdmin = member.role === "ADMIN";
  let hasAccess = true;

  if (channel.orgUnitId && !isAdmin) {
    const userMembership = await db.orgUnitMember.findFirst({
      where: {
        profileId: profile.id,
        OR: [
          { orgUnitId: channel.orgUnitId },
          { orgUnit: { parentId: channel.orgUnitId } },
        ],
      },
    });
    if (!userMembership) {
      hasAccess = false;
    }
  }

  if (!hasAccess) {
    return (
      <div className="bg-white dark:bg-[#313338] flex flex-col h-full overflow-hidden">
        <ChatHeader
          name={channel.name}
          serverId={channel.serverId}
          type="channel"
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-[#313338]">
          <div className="h-16 w-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 shadow-xl">
            <Lock className="h-8 w-8 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Phòng Ban Được Bảo Mật</h2>
          <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
            Kênh <span className="font-semibold text-white">#{channel.name}</span> thuộc phòng ban{" "}
            <span className="font-semibold text-indigo-400">{channel.orgUnit?.name || "chuyên môn"}</span>.
            Theo quy chế bảo mật thông tin nội bộ của công ty, chỉ nhân sự thuộc phòng ban này hoặc Ban Giám Đốc mới có quyền truy cập.
          </p>
          <Link
            href={`/servers/${serverId}`}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
          >
            Quay lại Kênh Chung (#general)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full overflow-hidden">
      <ChatHeader
        name={channel.name}
        serverId={channel.serverId}
        type="channel"
      />
      {channel.type === ChannelType.TEXT && (
        <ChannelWorkView channel={channel} member={member} server={server}>
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <ChatMessages
                member={member}
                name={channel.name}
                chatId={channel.id}
                type="channel"
                apiUrl="/api/messages"
                socketUrl="/api/socket/messages"
                socketQuery={{
                  channelId: channel.id,
                  serverId: channel.serverId
                }}
                paramKey="channelId"
                paramValue={channel.id}
              />
              <ChatInput
                name={channel.name}
                type="channel"
                apiUrl="/api/socket/messages"
                query={{
                  channelId: channel.id,
                  serverId: channel.serverId
                }}
                currentMember={member}
              />
            </div>
            <ChatMemberSidebar members={server.members} />
          </div>
        </ChannelWorkView>
      )}
      {channel.type !== ChannelType.TEXT && (
        <VoiceChannelView
          channel={channel}
          member={member}
          server={server}
          video={channel.type === ChannelType.VIDEO}
        />
      )}
    </div>
  );
}
