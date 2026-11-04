"use client";

import React from "react";
import { Member, MemberRole, Profile } from "@prisma/client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { UserAvatar } from "@/components/user-avatar";
import { useMemberSidebar } from "@/hooks/use-member-sidebar-store";
import { useModal } from "@/hooks/use-modal-store";
import { cn } from "@/lib/utils";

interface ChatMemberSidebarProps {
  members: (Member & { profile: Profile })[];
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-4 w-4 ml-1.5 text-indigo-500 shrink-0" />
  ),
  [MemberRole.ADMIN]: (
    <ShieldAlert className="h-4 w-4 ml-1.5 text-rose-500 shrink-0" />
  )
};

export function ChatMemberSidebar({ members }: ChatMemberSidebarProps) {
  const { isOpen } = useMemberSidebar();
  const { onOpen } = useModal();
  const params = useParams();

  if (!isOpen) return null;

  const admins = members.filter((m) => m.role === MemberRole.ADMIN);
  const moderators = members.filter((m) => m.role === MemberRole.MODERATOR);
  const guests = members.filter((m) => m.role === MemberRole.GUEST);

  const onMemberClick = (member: Member & { profile: Profile }) => {
    onOpen("userProfile", { member });
  };

  const renderGroup = (
    title: string,
    groupMembers: (Member & { profile: Profile })[]
  ) => {
    if (groupMembers.length === 0) return null;

    return (
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-2 mb-1 select-none">
          {title} — {groupMembers.length}
        </p>
        <div className="space-y-[1px]">
          {groupMembers.map((member) => {
            const isSelected = params?.memberId === member.id;
            return (
              <button
                key={member.id}
                onClick={() => onMemberClick(member)}
                className={cn(
                  "group px-2 py-1.5 rounded-md flex items-center gap-x-2.5 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/40 transition select-none text-left",
                  isSelected && "bg-zinc-700/20 dark:bg-zinc-700/60"
                )}
              >
                <div className="relative shrink-0">
                  <UserAvatar
                    src={member.profile.imageUrl}
                    className="h-8 w-8 md:h-8 md:w-8"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#2b2d31]" />
                </div>
                <div className="flex items-center min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-semibold text-xs text-zinc-600 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white truncate",
                      member.role === MemberRole.ADMIN && "text-rose-500 dark:text-rose-400 font-bold",
                      member.role === MemberRole.MODERATOR && "text-indigo-500 dark:text-indigo-400 font-bold"
                    )}
                  >
                    {member.profile.name}
                  </p>
                  {roleIconMap[member.role]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="hidden lg:flex flex-col w-60 h-full bg-[#f2f3f5] dark:bg-[#2b2d31] border-l border-zinc-200 dark:border-zinc-800/80 px-2 py-3 overflow-y-auto shrink-0 select-none">
      {renderGroup("Admin", admins)}
      {renderGroup("Moderator", moderators)}
      {renderGroup("Online", guests)}
    </div>
  );
}
