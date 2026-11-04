"use client";

import React from "react";
import {
  Bell,
  BellOff,
  Hash,
  Pin,
  Users,
  Lock,
  Building2,
  Crown,
  ShieldAlert,
  ShieldCheck,
  Shield,
} from "lucide-react";

import { MobileToggle } from "@/components/mobile-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { SocketIndicatior } from "@/components/socket-indicatior";
import { ChatVideoButton } from "@/components/chat/chat-video-button";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useMemberSidebar } from "@/hooks/use-member-sidebar-store";
import { PinnedMessagesPopover } from "@/components/chat/pinned-messages-popover";
import { ChatSearchInput } from "@/components/chat/chat-search-input";
import { useDepartmentPerspective } from "@/hooks/use-department-perspective";
import {
  getDepartmentCode,
  getDepartmentInfo,
  canAccessDepartment,
} from "@/lib/department-utils";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

interface ChatHeaderProps {
  serverId: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string;
  chatId?: string;
}

export function ChatHeader({
  name,
  serverId,
  type,
  imageUrl,
  chatId,
}: ChatHeaderProps) {
  const params = useParams();
  const activeChatId =
    chatId ||
    (params?.channelId as string) ||
    (params?.memberId as string) ||
    "";
  const { soundEnabled, setSoundEnabled } = useUserPreferences();
  const { isOpen: isMemberSidebarOpen, toggle: toggleMemberSidebar } =
    useMemberSidebar();
  const { perspective } = useDepartmentPerspective();

  // Determine Department Info and Permission Level
  const deptCode = getDepartmentCode({ name });
  const deptInfo = getDepartmentInfo(deptCode);
  const isAuthorized = canAccessDepartment(perspective, deptCode);

  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2 select-none">
      <MobileToggle serverId={serverId} />
      {type === "channel" && (
        <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2 shrink-0" />
      )}
      {type === "conversation" && (
        <UserAvatar
          src={imageUrl}
          className="h-8 w-8 md:h-8 md:w-8 mr-2 shrink-0"
        />
      )}

      {/* Channel Name & Department / Role Badges */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <p className="font-semibold text-md text-black dark:text-white truncate">
          {name}
        </p>

        {type === "channel" && (
          <>
            {/* Department Tag */}
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium border hidden sm:flex items-center gap-1 shrink-0",
                deptInfo.badgeColor
              )}
            >
              {deptInfo.isPrivate ? (
                <Lock className="h-2.5 w-2.5" />
              ) : (
                <Building2 className="h-2.5 w-2.5" />
              )}
              <span>{deptInfo.shortName}</span>
            </span>

            {/* Perspective Status Badge */}
            {!isAuthorized ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 shrink-0 animate-pulse">
                <ShieldAlert className="h-2.5 w-2.5" />
                <span>Chỉ xem (Ngoài phòng)</span>
              </span>
            ) : perspective === "ALL" ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden md:flex items-center gap-1 shrink-0">
                <Crown className="h-2.5 w-2.5 text-amber-400" />
                <span>Boss (Toàn quyền)</span>
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden lg:flex items-center gap-1 shrink-0">
                <ShieldCheck className="h-2.5 w-2.5" />
                <span>Thành viên chính thức</span>
              </span>
            )}
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-x-2 shrink-0">
        {type === "conversation" && <ChatVideoButton />}

        {/* Pinned Messages Popover */}
        {activeChatId && <PinnedMessagesPopover chatId={activeChatId} />}

        {/* In-channel Search */}
        {activeChatId && <ChatSearchInput chatId={activeChatId} />}

        {/* Notification Sound Toggle */}
        <ActionTooltip
          label={soundEnabled ? "Mute Notifications" : "Unmute Notifications"}
        >
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="hover:opacity-75 transition p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {soundEnabled ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5 text-rose-500" />
            )}
          </button>
        </ActionTooltip>

        {/* Toggle Member List Sidebar (Channels only) */}
        {type === "channel" && (
          <ActionTooltip
            label={
              isMemberSidebarOpen ? "Hide Member List" : "Show Member List"
            }
          >
            <button
              onClick={toggleMemberSidebar}
              className={`hover:opacity-75 transition p-1 ${
                isMemberSidebarOpen
                  ? "text-indigo-500"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <Users className="h-5 w-5" />
            </button>
          </ActionTooltip>
        )}

        <SocketIndicatior />
      </div>
    </div>
  );
}
