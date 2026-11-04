"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  Calendar,
  Video,
  Search,
  Settings,
  Mic,
  MicOff,
  Headphones,
  ShieldCheck,
  Building2
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Profile } from "@prisma/client";

import { useFriends } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface DmSidebarProps {
  currentProfile: Profile;
}

export function DmSidebar({ currentProfile }: DmSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChatFriendId = searchParams?.get("chat");
  const { onOpen } = useModal();
  const { friends, incoming } = useFriends();

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const currentTab = searchParams?.get("tab");
  const isFriendsActive = pathname?.startsWith("/channels") && !activeChatFriendId && !currentTab;
  const isMeetingsActive = currentTab === "meetings";
  const isCalendarActive = currentTab === "calendar";

  return (
    <div className="flex flex-col h-full text-primary w-64 dark:bg-[#2b2d31] bg-[#f2f3f5] border-r border-[#1f2023] shrink-0 select-none">
      {/* Search Header Button */}
      <div className="h-12 border-b border-[#1f2023] px-3 flex items-center shadow-sm">
        <button
          onClick={() => {
            sounds.playPop();
            router.push("/channels/@me");
          }}
          className="w-full h-8 bg-[#1e1f22] text-zinc-400 hover:text-zinc-200 text-xs rounded-md px-2.5 flex items-center justify-between transition border border-zinc-800"
        >
          <span className="truncate">Tìm nhân sự hoặc cuộc họp...</span>
          <Search className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {/* Company Directory Tab */}
        <button
          onClick={() => {
            sounds.playPop();
            router.push("/channels/@me");
          }}
          className={cn(
            "w-full flex items-center gap-x-3 px-3 py-2 rounded-md font-medium text-sm transition group",
            isFriendsActive
              ? "bg-[#35373c] text-white"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#35373c]/50"
          )}
        >
          <Users className="w-4 h-4 shrink-0 text-indigo-400" />
          <span className="truncate font-semibold text-xs">Danh bạ nhân viên</span>
          {incoming.length > 0 && (
            <span className="ml-auto bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {incoming.length}
            </span>
          )}
        </button>

        {/* Quick Meeting Rooms Tab */}
        <button
          onClick={() => {
            sounds.playPop();
            router.push("/channels/@me?tab=meetings");
          }}
          className={cn(
            "w-full flex items-center gap-x-3 px-3 py-2 rounded-md font-medium text-sm transition group",
            isMeetingsActive
              ? "bg-[#35373c] text-white"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#35373c]/50"
          )}
        >
          <Video className="w-4 h-4 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="truncate font-semibold text-xs">Phòng họp trực tuyến</span>
        </button>

        {/* Company Calendar Tab */}
        <button
          onClick={() => {
            sounds.playPop();
            router.push("/channels/@me?tab=calendar");
          }}
          className={cn(
            "w-full flex items-center gap-x-3 px-3 py-2 rounded-md font-medium text-sm transition group",
            isCalendarActive
              ? "bg-[#35373c] text-white"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#35373c]/50"
          )}
        >
          <Calendar className="w-4 h-4 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="truncate font-semibold text-xs">Lịch họp & Sự kiện</span>
        </button>

        {/* Direct Messages Section Header */}
        <div className="pt-4 pb-1 px-3 flex items-center justify-between group">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Trao đổi nội bộ 1-1
          </p>
          <ActionTooltip label="Tạo cuộc trò chuyện mới">
            <button
              onClick={() => {
                sounds.playPop();
                router.push("/channels/@me");
              }}
              className="text-zinc-400 hover:text-zinc-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </ActionTooltip>
        </div>

        {/* List of Coworkers / Direct Messages */}
        {friends.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-zinc-500">Chưa có liên hệ trực tiếp</p>
            <button
              onClick={() => router.push("/channels/@me")}
              className="mt-1 text-xs text-indigo-400 hover:underline font-medium"
            >
              + Kết nối đồng nghiệp
            </button>
          </div>
        ) : (
          friends.map(({ friendshipId, friend }) => {
            const isSelected = activeChatFriendId === friend.id;
            return (
              <button
                key={friendshipId}
                onClick={() => {
                  sounds.playPop();
                  router.push(`/channels/@me?chat=${friend.id}`);
                }}
                className={cn(
                  "w-full flex items-center gap-x-2.5 px-2 py-2 rounded-md transition group text-left",
                  isSelected
                    ? "bg-[#35373c] text-white"
                    : "hover:bg-[#35373c]/50 text-zinc-400 hover:text-zinc-200"
                )}
              >
                <div className="relative shrink-0">
                  <UserAvatar src={friend.imageUrl} className="h-7 w-7" />
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-[#2b2d31]" />
                </div>
                <div className="truncate min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-xs font-semibold truncate",
                      isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"
                    )}
                  >
                    {friend.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    @{friend.email.split("@")[0]}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Internal Security Badge */}
      <div className="px-3 py-2 bg-[#232428]/60 border-t border-zinc-800/80 flex items-center gap-x-2 text-[10px] text-zinc-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="truncate">Hệ thống nội bộ bảo mật</span>
      </div>

      {/* User Footer Bar with Mic, Audio, Settings Controls */}
      <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-x-1.5 shrink-0">
        <button
          onClick={() => {
            sounds.playPop();
            onOpen("userSettings");
          }}
          className="flex items-center gap-x-2 p-1 hover:bg-[#35373c] rounded-md transition flex-1 min-w-0 text-left"
        >
          <div className="relative shrink-0">
            <UserAvatar src={currentProfile.imageUrl} className="h-8 w-8" />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#232428]" />
          </div>
          <div className="truncate leading-tight min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {currentProfile.name}
            </p>
            <p className="text-[10px] text-emerald-400 font-medium truncate">
              Nhân viên chính thức
            </p>
          </div>
        </button>

        {/* Mic Toggle Button */}
        <ActionTooltip label={isMuted ? "Bật mic" : "Tắt mic"}>
          <button
            onClick={() => {
              sounds.playPop();
              setIsMuted(!isMuted);
            }}
            className={cn(
              "p-1.5 rounded-md transition",
              isMuted
                ? "text-rose-400 hover:bg-rose-950/30"
                : "text-zinc-400 hover:text-white hover:bg-[#35373c]"
            )}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </ActionTooltip>

        {/* Headphones Toggle Button */}
        <ActionTooltip label={isDeafened ? "Bật âm thanh" : "Tắt âm thanh"}>
          <button
            onClick={() => {
              sounds.playPop();
              setIsDeafened(!isDeafened);
            }}
            className={cn(
              "p-1.5 rounded-md transition",
              isDeafened
                ? "text-rose-400 hover:bg-rose-950/30"
                : "text-zinc-400 hover:text-white hover:bg-[#35373c]"
            )}
          >
            <Headphones className={cn("w-4 h-4", isDeafened && "text-rose-400")} />
          </button>
        </ActionTooltip>

        {/* User Settings Button */}
        <ActionTooltip label="Cài đặt tài khoản">
          <button
            onClick={() => {
              sounds.playPop();
              onOpen("userSettings");
            }}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#35373c] rounded-md transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
}
