"use client";

import React from "react";
import { Channel, ChannelType, MemberRole, Server } from "@prisma/client";
import { Edit, Hash, Lock, Mic, MicOff, Trash, Video, VolumeX, Megaphone } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/action-tooltip";
import { ModalType, useModal } from "@/hooks/use-modal-store";
import { useVoiceState } from "@/hooks/use-voice-state";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useUnreadStore } from "@/hooks/use-unread-store";
import { UserAvatar } from "@/components/user-avatar";

interface ServerChannelProps {
  channel: Channel;
  server: Server;
  role?: MemberRole;
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
  [ChannelType.ANNOUNCEMENT]: Megaphone,
};


export function ServerChannel({
  channel,
  server,
  role
}: ServerChannelProps) {
  const { user } = useUser();
  const { onOpen } = useModal();
  const { participants, connectedChannelId } = useVoiceState();
  const { micMuted, deafened } = useUserPreferences();
  const { hasUnread, clearUnread } = useUnreadStore();
  const params = useParams();
  const router = useRouter();

  const Icon = iconMap[channel.type];
  const isVoiceChannel =
    channel.type === ChannelType.AUDIO || channel.type === ChannelType.VIDEO;
  
  // Enforce single room display: A user can only be in one voice/video channel at a time
  const rawList = participants[channel.id] || [];
  const channelParticipants = rawList.filter((member, index, self) => {
    // Deduplicate within the same channel
    const firstIdx = self.findIndex(
      (m) => (m.id && m.id === member.id) || (m.name && m.name.trim() === member.name.trim())
    );
    if (firstIdx !== index) return false;

    // Check if member is current local user
    const isLocalMember =
      member.id === user?.id ||
      (user?.fullName && member.name?.trim() === user.fullName.trim()) ||
      (user?.firstName && member.name?.includes(user.firstName));

    // If local user is currently connected to a different channel, hide them from this channel
    if (isLocalMember && connectedChannelId && connectedChannelId !== channel.id) {
      return false;
    }

    return true;
  });

  // When viewing this exact voice channel, ensure local user is listed
  if (isVoiceChannel && params?.channelId === channel.id && user) {
    const hasLocal = channelParticipants.some(
      (m) =>
        m.id === user.id ||
        (user.fullName && m.name?.includes(user.fullName))
    );
    if (!hasLocal) {
      channelParticipants.unshift({
        id: user.id,
        name: user.fullName || "Bạn",
        imageUrl: user.imageUrl || "",
        micMuted: micMuted,
        deafened: deafened,
      });
    }
  }

  const isCurrentChannel = params?.channelId === channel.id;
  const isUnread = hasUnread(channel.id) && !isCurrentChannel;

  const onClick = () => {
    clearUnread(channel.id);
    router.push(`/servers/${params?.serverId}/channels/${channel.id}`);
  };

  const onAction = (e: React.MouseEvent, action: ModalType) => {
    e.stopPropagation();
    onOpen(action, { channel, server });
  };

  return (
    <div className="mb-1">
      <button
        className={cn(
          "group relative px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition",
          isCurrentChannel && "bg-zinc-700/20 dark:bg-zinc-700"
        )}
        onClick={onClick}
      >
        {/* Discord White Pill on left for unread channels */}
        {isUnread && (
          <div className="absolute -left-1.5 w-1 h-2 rounded-r-full bg-white transition-all" />
        )}
        <Icon
          className={cn(
            "flex-shrink-0 w-5 h-5 transition",
            isUnread ? "text-white" : "text-zinc-500 dark:text-zinc-400",
            isCurrentChannel && "text-white"
          )}
        />
        <p
          className={cn(
            "line-clamp-1 font-semibold text-sm transition",
            isUnread
              ? "text-white font-bold"
              : "text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300",
            isCurrentChannel &&
              "text-primary dark:text-zinc-200 dark:group-hover:text-white"
          )}
        >
          {channel.name}
        </p>
        {channel.name !== "general" && role !== MemberRole.GUEST && (
          <div className="ml-auto flex items-center gap-x-2">
            <ActionTooltip label="Chỉnh sửa kênh">
              <Edit
                onClick={(e) => onAction(e, "editChannel")}
                className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
            <ActionTooltip label="Xóa kênh">
              <Trash
                onClick={(e) => onAction(e, "deleteChannel")}
                className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
          </div>
        )}
        {channel.name === "general" && (
          <Lock className="ml-auto w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        )}
      </button>

      {/* Voice Callers List Under Channel */}
      {isVoiceChannel && channelParticipants.length > 0 && (
        <div className="pl-6 pt-1 space-y-[2px] animate-in fade-in-0 duration-150">
          {channelParticipants.map((member) => {
            const isLocalMember =
              member.id === user?.id ||
              (user?.fullName && member.name?.includes(user.fullName)) ||
              (user?.firstName && member.name?.includes(user.firstName));

            const isMemberMuted = isLocalMember
              ? (micMuted || deafened)
              : Boolean(member.micMuted || member.deafened);

            const isMemberDeafened = isLocalMember
              ? deafened
              : Boolean(member.deafened);

            return (
              <div
                key={member.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen("userProfile", { member: member as any });
                }}
                className="flex items-center gap-x-2 px-2 py-1 rounded-md hover:bg-zinc-700/20 dark:hover:bg-zinc-700/40 cursor-pointer text-xs transition group/user"
              >
                <div className="relative shrink-0">
                  <UserAvatar
                    src={member.imageUrl}
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      member.isSpeaking && !isMemberMuted
                        ? "ring-2 ring-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse scale-105"
                        : !isMemberMuted
                        ? "ring-1 ring-zinc-700/60 opacity-90"
                        : "ring-1 ring-zinc-800 opacity-60"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full transition-colors duration-150",
                      member.isSpeaking && !isMemberMuted
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                        : !isMemberMuted
                        ? "bg-zinc-500"
                        : "bg-rose-500"
                    )}
                  />
                </div>
                <span className="font-medium text-xs text-zinc-600 dark:text-zinc-300 group-hover/user:text-black dark:group-hover/user:text-white truncate">
                  {member.name}
                </span>

                {/* Status Icons: Deafen & Mute Icons */}
                <div className="ml-auto flex items-center gap-x-1 shrink-0">
                  {isMemberDeafened && (
                    <ActionTooltip label="Đã tắt tai nghe (Deafened)" side="right">
                      <VolumeX className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    </ActionTooltip>
                  )}
                  {isMemberMuted && (
                    <ActionTooltip label="Đã tắt micro (Muted)" side="right">
                      <MicOff className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    </ActionTooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
