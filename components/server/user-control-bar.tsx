"use client";

import React from "react";
import { Profile } from "@prisma/client";
import {
  Headphones,
  Mic,
  MicOff,
  Settings,
  VolumeX,
  LogOut
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";
import { useUserPreferences, UserStatus } from "@/hooks/use-user-preferences";
import { useVoiceState } from "@/hooks/use-voice-state";
import { useSocket } from "@/components/providers/socket-provider";

interface UserControlBarProps {
  profile: Profile;
}

const statusColorMap: Record<UserStatus, string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-500",
  dnd: "bg-rose-500",
  invisible: "bg-zinc-400"
};

export function UserControlBar({ profile }: UserControlBarProps) {
  const { onOpen } = useModal();
  const {
    micMuted,
    deafened,
    status,
    customStatus,
    customStatusEmoji,
    toggleMic,
    toggleDeafen
  } = useUserPreferences();
  const {
    connectedChannelId,
    connectedServerId,
    setParticipantMute,
    setParticipantDeafen
  } = useVoiceState();
  const { socket } = useSocket();

  const handleToggleMic = () => {
    toggleMic();
    const nextMuted = !micMuted;
    const memberId = profile.userId || profile.id;

    if (connectedChannelId) {
      setParticipantMute(connectedChannelId, memberId, nextMuted);
      if (socket && connectedServerId) {
        socket.emit("voice:state", {
          serverId: connectedServerId,
          channelId: connectedChannelId,
          memberId,
          micMuted: nextMuted,
          deafened: !nextMuted ? false : deafened
        });
      }
    }
  };

  const handleToggleDeafen = () => {
    toggleDeafen();
    const nextDeafened = !deafened;
    const memberId = profile.userId || profile.id;

    if (connectedChannelId) {
      setParticipantDeafen(connectedChannelId, memberId, nextDeafened);
      setParticipantMute(connectedChannelId, memberId, nextDeafened ? true : micMuted);
      if (socket && connectedServerId) {
        socket.emit("voice:state", {
          serverId: connectedServerId,
          channelId: connectedChannelId,
          memberId,
          micMuted: nextDeafened ? true : micMuted,
          deafened: nextDeafened
        });
      }
    }
  };

  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("[USER_CONTROL_BAR_LOGOUT_ERR]", err);
    }
    window.location.href = "/sign-in";
  };

  return (
    <div className="h-[52px] bg-[#ebedef] dark:bg-[#232428] px-2 flex items-center gap-x-2 border-t border-zinc-200 dark:border-[#1f2023] mt-auto select-none">
      {/* Profile Info Button */}
      <div
        onClick={() => onOpen("userProfile", { profile })}
        className="flex items-center gap-x-2 p-1 -ml-1 rounded-md hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 cursor-pointer flex-1 min-w-0 transition group"
      >
        <div className="relative">
          <UserAvatar
            src={profile.imageUrl}
            className="h-8 w-8 md:h-8 md:w-8"
          />
          {/* Status Dot */}
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#ebedef] dark:border-[#232428] ${statusColorMap[status]}`}
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1 leading-tight">
          <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate group-hover:text-black dark:group-hover:text-white">
            {profile.name}
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-x-1">
            {customStatus ? (
              <>
                <span className="shrink-0">{customStatusEmoji}</span>
                <span className="truncate">{customStatus}</span>
              </>
            ) : (
              <span className="capitalize">{status === "dnd" ? "Do Not Disturb" : status}</span>
            )}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-x-0.5">
        {/* Mic Button */}
        <ActionTooltip label={micMuted ? "Bật Micro (Unmute)" : "Tắt Micro (Mute)"}>
          <button
            onClick={handleToggleMic}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              micMuted || deafened
                ? "text-rose-500 hover:bg-rose-500/10"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {micMuted || deafened ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </ActionTooltip>

        {/* Deafen Button */}
        <ActionTooltip label={deafened ? "Bật Tai Nghe (Undeafen)" : "Tắt Tai Nghe (Deafen)"}>
          <button
            onClick={handleToggleDeafen}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              deafened
                ? "text-rose-500 hover:bg-rose-500/10"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {deafened ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Headphones className="h-4 w-4" />
            )}
          </button>
        </ActionTooltip>

        {/* Settings Button */}
        <ActionTooltip label="Cài đặt người dùng">
          <button
            onClick={() => onOpen("userSettings", { profile })}
            className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
          >
            <Settings className="h-4 w-4" />
          </button>
        </ActionTooltip>

        {/* Logout / Switch Account Button */}
        <ActionTooltip label="Đăng xuất / Chuyển tài khoản">
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
}
