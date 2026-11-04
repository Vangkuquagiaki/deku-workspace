"use client";

import React from "react";
import { PhoneOff, Wifi } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { useVoiceState } from "@/hooks/use-voice-state";
import { useSocket } from "@/components/providers/socket-provider";
import { ActionTooltip } from "@/components/action-tooltip";

interface VoiceStatusBarProps {
  serverId: string;
}

export function VoiceStatusBar({ serverId }: VoiceStatusBarProps) {
  const { user } = useUser();
  const {
    connectedChannelId,
    connectedChannelName,
    disconnectVoice,
    removeParticipant
  } = useVoiceState();
  const { socket } = useSocket();
  const router = useRouter();
  const params = useParams();

  if (!connectedChannelId) return null;

  const onDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (connectedChannelId && user?.id) {
      removeParticipant(connectedChannelId, user.id);
    }
    disconnectVoice(user?.id);

    if (socket && connectedChannelId && user?.id) {
      socket.emit("voice:leave", {
        serverId,
        channelId: connectedChannelId,
        memberId: user.id
      });
    }

    // If currently on this voice channel page, redirect to server root
    if (params?.channelId === connectedChannelId) {
      router.push(`/servers/${serverId}`);
    }
  };

  return (
    <div className="bg-[#232428] border-t border-zinc-800/80 px-3 py-2 flex items-center justify-between select-none">
      <div
        onClick={() => {
          if (connectedChannelId && serverId) {
            router.push(`/servers/${serverId}/channels/${connectedChannelId}`);
          }
        }}
        className="cursor-pointer flex items-center gap-x-2 min-w-0 flex-1 hover:opacity-90 transition group"
        title="Nhấp để quay lại kênh thoại"
      >
        <Wifi className="h-4 w-4 text-emerald-500 shrink-0 animate-pulse" />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-x-1.5">
            <span className="text-[11px] font-bold text-emerald-500 leading-none truncate group-hover:underline">
              Đã kết nối thoại (RTC)
            </span>
            <span className="text-[9px] bg-rose-600/90 text-white font-bold px-1 py-0.5 rounded leading-none uppercase tracking-wider">
              Trực tiếp
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 leading-tight truncate mt-0.5">
            {connectedChannelName || "Kênh thoại"} / Kênh Video
          </span>
        </div>
      </div>

      <ActionTooltip label="Ngắt kết nối (Disconnect)">
        <button
          onClick={onDisconnect}
          className="p-1.5 rounded-md hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition shrink-0"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </ActionTooltip>
    </div>
  );
}
