"use client";

import React, { useState } from "react";
import { Channel, ChannelType, Member, MemberRole, Profile } from "@prisma/client";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Building2,
  Crown,
  Code2,
  TrendingUp,
  Users2,
  Coins,
  Megaphone,
  Settings2,
  Lock,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  FolderLock,
  Hash,
  Video,
  Mic,
} from "lucide-react";

import { ServerWithMembersWithProfiles } from "@/types";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";
import { ServerChannel } from "@/components/server/server-channel";
import { ServerMember } from "@/components/server/server-member";
import { useVoiceSocket } from "@/hooks/use-voice-socket";
import { useDepartmentPerspective, DepartmentPerspective } from "@/hooks/use-department-perspective";
import {
  getDepartmentCode,
  DEPARTMENTS_LIST,
  DepartmentCode,
} from "@/lib/department-utils";
import { cn } from "@/lib/utils";

interface ServerCategoriesProps {
  server: ServerWithMembersWithProfiles;
  role?: MemberRole;
  textChannels?: Channel[];
  audioChannels?: Channel[];
  videoChannels?: Channel[];
  channels?: (Channel & { orgUnit?: any })[];
  members: (Member & { profile: Profile })[];
}

const DEPARTMENT_ICONS: Record<DepartmentCode, React.ElementType> = {
  COMPANY: Building2,
  BDH: Crown,
  IT: Code2,
  SALES: TrendingUp,
  HR: Users2,
  FIN: Coins,
  MKT: Megaphone,
  OPS: Settings2,
};

const DEPARTMENTS_CONFIG = DEPARTMENTS_LIST.map((dept) => ({
  ...dept,
  icon: DEPARTMENT_ICONS[dept.key] || Building2,
}));

export function ServerCategories({
  server,
  role,
  textChannels = [],
  audioChannels = [],
  videoChannels = [],
  channels,
  members,
}: ServerCategoriesProps) {
  useVoiceSocket(server.id);
  const { onOpen } = useModal();
  const { perspective, setPerspective } = useDepartmentPerspective();

  // Collapsed state map for department categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [collapsedMembers, setCollapsedMembers] = useState(false);

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Compile list of all server channels with their org units
  const allChannels = channels || [...textChannels, ...audioChannels, ...videoChannels];

  // Group channels by department code
  const channelsByDept: Record<string, typeof allChannels> = {};
  for (const c of allChannels) {
    const deptKey = getDepartmentCode(c);
    if (!channelsByDept[deptKey]) {
      channelsByDept[deptKey] = [];
    }
    channelsByDept[deptKey].push(c);
  }

  // Filter department groups based on active perspective
  const visibleDeptConfigs = DEPARTMENTS_CONFIG.filter((dept) => {
    // 1. Must have channels
    if (!channelsByDept[dept.key] || channelsByDept[dept.key].length === 0) {
      return false;
    }

    // 2. Company-wide is always visible to everyone
    if (dept.key === "COMPANY") {
      return true;
    }

    // 3. Boss / C-Level mode: sees ALL departments
    if (perspective === "ALL" || perspective === "BDH") {
      return true;
    }

    // 4. Employee perspective: only sees their own department
    return dept.key === perspective;
  });

  return (
    <div className="space-y-3 select-none pb-4">
      {/* ========================================================= */}
      {/* 1. ENTERPRISE PERSPECTIVE SWITCHER (Góc nhìn phân quyền) */}
      {/* ========================================================= */}
      <div className="px-1">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#1e1f22] to-[#18191c] border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Góc nhìn phân quyền</span>
            </div>
            {perspective !== "ALL" && (
              <button
                type="button"
                onClick={() => setPerspective("ALL")}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
              >
                Boss xem tất cả
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={perspective}
              onChange={(e) => setPerspective(e.target.value as DepartmentPerspective)}
              className="w-full text-xs font-semibold py-1.5 pl-2 pr-7 rounded-xl bg-[#2b2d31] border border-zinc-700/80 text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none transition shadow-inner"
            >
              <option value="ALL">👑 Boss / Ban Giám Đốc (Xem tất cả các phòng)</option>
              <option value="IT">💻 Nhân sự: Phòng Công Nghệ (IT)</option>
              <option value="SALES">💼 Nhân sự: Phòng Kinh Doanh (Sales)</option>
              <option value="HR">📋 Nhân sự: Phòng Nhân Sự (HR)</option>
              <option value="FIN">💰 Nhân sự: Phòng Kế Toán (Finance)</option>
              <option value="BDH">👑 Ban Giám Đốc (C-Level & Điều Hành)</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {perspective !== "ALL" ? (
            <div className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5">
              <Lock className="h-3 w-3 shrink-0 text-amber-400" />
              <span className="truncate">
                Đang khóa bảo mật: Kênh của phòng ban khác đã được ẩn
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 px-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Chế độ Quản lý cấp cao: Toàn quyền truy cập mọi phòng ban</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DEPARTMENT-SEGREGATED ROOMS & CHANNELS                 */}
      {/* ========================================================= */}
      <div className="space-y-3">
        {visibleDeptConfigs.map((dept) => {
          const deptChannels = channelsByDept[dept.key] || [];
          const isCollapsed = Boolean(collapsedCategories[dept.key]);
          const Icon = dept.icon;

          return (
            <div key={dept.key} className="space-y-1">
              {/* Category Header */}
              <div className="flex items-center justify-between py-1 group/section">
                <button
                  type="button"
                  onClick={() => toggleCategory(dept.key)}
                  className="flex items-center gap-x-1.5 text-xs uppercase font-bold text-zinc-400 hover:text-zinc-200 transition min-w-0"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400" />
                  )}
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", dept.color)} />
                  <span className="truncate max-w-[170px]">{dept.name}</span>
                  {dept.isPrivate && (
                    <Lock className="h-2.5 w-2.5 text-zinc-400 shrink-0 ml-0.5" />
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.2 rounded-full font-bold border shrink-0",
                      dept.badgeColor
                    )}
                  >
                    {deptChannels.length}
                  </span>

                  {role !== MemberRole.GUEST && (
                    <ActionTooltip label={`Tạo kênh trong ${dept.name}`} side="top">
                      <button
                        type="button"
                        onClick={() =>
                          onOpen("createChannel", {
                            channelType: ChannelType.TEXT,
                          })
                        }
                        className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </ActionTooltip>
                  )}
                </div>
              </div>

              {/* Channels List Inside Department */}
              {!isCollapsed && (
                <div className="space-y-[2px] pl-1">
                  {deptChannels.map((channel) => (
                    <ServerChannel
                      key={channel.id}
                      channel={channel}
                      role={role}
                      server={server}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. MEMBERS DIRECTORY                                      */}
      {/* ========================================================= */}
      {!!members.length && (
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between py-1 group/section">
            <button
              type="button"
              onClick={() => setCollapsedMembers(!collapsedMembers)}
              className="flex items-center gap-x-1.5 text-xs uppercase font-bold text-zinc-400 hover:text-zinc-200 transition"
            >
              {collapsedMembers ? (
                <ChevronRight className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0" />
              )}
              <Users2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Nhân sự — {members.length}</span>
            </button>
            {role === MemberRole.ADMIN && (
              <ActionTooltip label="Quản trị nhân sự phòng ban" side="top">
                <button
                  type="button"
                  onClick={() => onOpen("members", { server })}
                  className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </ActionTooltip>
            )}
          </div>

          {!collapsedMembers && (
            <div className="space-y-[2px] mt-1 max-h-72 overflow-y-auto pr-0.5">
              {members.slice(0, 40).map((member) => (
                <ServerMember
                  key={member.id}
                  member={member}
                  server={server}
                />
              ))}
              {members.length > 40 && (
                <div className="text-center py-1 text-[10px] text-zinc-400">
                  + {members.length - 40} nhân sự khác trong Danh bạ
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
