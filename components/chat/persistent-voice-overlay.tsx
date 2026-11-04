"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  GripHorizontal,
  Maximize2,
  PhoneOff,
  Radio,
  Wifi
} from "lucide-react";

import { useVoiceState } from "@/hooks/use-voice-state";
import { useSocket } from "@/components/providers/socket-provider";
import { MediaRoom } from "@/components/media-room";
import { ActionTooltip } from "@/components/action-tooltip";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface PersistentVoiceOverlayProps {
  serverId?: string;
}

export function PersistentVoiceOverlay({ serverId }: PersistentVoiceOverlayProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { socket } = useSocket();

  const {
    connectedChannelId,
    connectedServerId,
    connectedChannelName,
    isVideo,
    isSideChatOpen,
    isManualFloating,
    setManualFloating,
    disconnectVoice,
    removeParticipant,
  } = useVoiceState();

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
  }>({ startX: 0, startY: 0, initialPosX: 0, initialPosY: 0 });
  const pipRef = useRef<HTMLDivElement>(null);

  // If not connected to any voice/video channel, render nothing
  if (!connectedChannelId) {
    return null;
  }

  // If connected to another server, don't show inside this server layout
  if (serverId && connectedServerId && serverId !== connectedServerId) {
    return null;
  }

  // Check if current user is viewing this exact voice channel page
  const isViewingVoiceChannel =
    pathname === `/servers/${connectedServerId}/channels/${connectedChannelId}`;

  // Mode: Floating PiP if browsing another channel (e.g. #general) OR manually toggled "Thu nhỏ"
  const isFloating = !isViewingVoiceChannel || isManualFloating;

  const handleMaximize = () => {
    sounds.playPop();
    setManualFloating(false);
    if (connectedChannelId && connectedServerId) {
      router.push(`/servers/${connectedServerId}/channels/${connectedChannelId}`);
    }
  };

  const handleLeaveVoice = () => {
    if (connectedChannelId && user?.id) {
      removeParticipant(connectedChannelId, user.id);
    }
    disconnectVoice(user?.id);
    if (socket && connectedServerId && connectedChannelId && user?.id) {
      socket.emit("voice:leave", {
        serverId: connectedServerId,
        channelId: connectedChannelId,
        memberId: user.id
      });
    }
    // If currently on the voice channel, navigate to server root
    if (isViewingVoiceChannel && connectedServerId) {
      router.push(`/servers/${connectedServerId}`);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    const rect = pipRef.current?.getBoundingClientRect();
    const currentLeft = rect ? rect.left : window.innerWidth - 440;
    const currentTop = rect ? rect.top : window.innerHeight - 300;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: currentLeft,
      initialPosY: currentTop,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const width = pipRef.current?.offsetWidth || 380;
    const height = pipRef.current?.offsetHeight || 240;

    const maxX = window.innerWidth - width - 8;
    const maxY = window.innerHeight - height - 8;

    const nextX = Math.min(Math.max(8, dragStartRef.current.initialPosX + dx), Math.max(8, maxX));
    const nextY = Math.min(Math.max(8, dragStartRef.current.initialPosY + dy), Math.max(8, maxY));

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <div
      ref={isFloating ? pipRef : undefined}
      style={
        isFloating && position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              right: "auto",
              bottom: "auto"
            }
          : undefined
      }
      className={cn(
        isFloating
          ? cn(
              "fixed z-50 rounded-2xl shadow-2xl border-2 border-indigo-500/80 bg-[#111214] overflow-hidden flex flex-col transition-all duration-150 select-none",
              !position && "bottom-5 right-5 md:bottom-6 md:right-6",
              "w-[360px] h-[230px] md:w-[420px] md:h-[260px]",
              isDragging
                ? "cursor-grabbing shadow-[0_25px_60px_rgba(0,0,0,0.85)] scale-[1.02] opacity-95"
                : "shadow-2xl"
            )
          : cn(
              "absolute inset-x-0 bottom-0 top-12 z-20 flex flex-col bg-[#111214] overflow-hidden transition-all duration-200",
              isSideChatOpen && "right-80 md:right-96"
            )
      )}
    >
      {/* PiP Header: Visible when floating in background/chat */}
      {isFloating && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            handleMaximize();
          }}
          className="h-9 px-3 bg-[#1e1f22]/95 backdrop-blur border-b border-zinc-800/80 flex items-center justify-between select-none cursor-grab active:cursor-grabbing shrink-0 z-30"
        >
          <div className="flex items-center gap-x-2 text-xs font-semibold text-zinc-200 truncate pointer-events-none">
            <GripHorizontal className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="truncate">{connectedChannelName || "Kênh thoại"}</span>
            <span className="text-[9px] bg-rose-600/90 text-white font-bold px-1.5 py-0.5 rounded leading-none uppercase tracking-wider flex items-center gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Trực tiếp
            </span>
          </div>

          <div className="flex items-center gap-x-1.5 shrink-0 cursor-default">
            <ActionTooltip label="Phóng to toàn cảnh (Quay lại phòng họp)" side="bottom">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMaximize();
                }}
                className="h-6 w-6 rounded-md bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10 shadow-sm"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </ActionTooltip>

            <ActionTooltip label="Rời phòng họp (Disconnect)" side="bottom">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLeaveVoice();
                }}
                className="h-6 w-6 rounded-md bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-rose-500/20 shadow-sm"
              >
                <PhoneOff className="h-3.5 w-3.5" />
              </button>
            </ActionTooltip>
          </div>
        </div>
      )}

      {/* Persistent LiveKit WebRTC Session (Does NOT unmount when switching to chat!) */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <MediaRoom
          chatId={connectedChannelId}
          video={isVideo}
          audio={true}
          onDisconnected={handleLeaveVoice}
          isPiP={isFloating}
        />
      </div>
    </div>
  );
}
