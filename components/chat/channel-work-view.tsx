"use client";

import React, { useState } from "react";
import { MessageSquare, Kanban, Video, Sparkles, Lock } from "lucide-react";
import { Channel, ChannelType, Member, Profile, Server } from "@prisma/client";
import { cn } from "@/lib/utils";
import { LarkBaseView } from "@/components/lark/lark-base-view";
import { MeetingsPageView } from "@/components/meeting/meetings-page-view";
import { useDepartmentPerspective } from "@/hooks/use-department-perspective";
import {
  getDepartmentCode,
  getDepartmentInfo,
  canAccessDepartment,
} from "@/lib/department-utils";

interface ChannelWorkViewProps {
  channel: Channel;
  member: Member & { profile: Profile };
  server: Server;
  children: React.ReactNode;
}

export function ChannelWorkView({
  channel,
  member,
  server,
  children,
}: ChannelWorkViewProps) {
  const [activeView, setActiveView] = useState<"chat" | "tasks" | "meet">("chat");
  const { perspective, setPerspective } = useDepartmentPerspective();

  const deptCode = getDepartmentCode({
    name: channel.name,
    orgUnit: (channel as any).orgUnit,
  });
  const deptInfo = getDepartmentInfo(deptCode);
  const isAuthorized = canAccessDepartment(perspective, deptCode);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Outside Department Access Warning Banner */}
      {!isAuthorized && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300 select-none shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Góc nhìn <strong>{perspective}</strong>: Kênh thuộc <strong>{deptInfo.name}</strong>. Bạn đang xem với quyền hạn nhân sự ngoài phòng ban (Chỉ đọc).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPerspective("ALL")}
            className="text-[11px] underline text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer shrink-0 ml-2"
          >
            Chuyển quyền Boss
          </button>
        </div>
      )}

      {/* Quick Channel Sub-Header Tabs */}
      <div className="h-10 px-4 bg-[#2b2d31]/80 border-b border-zinc-800/80 flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView("chat")}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
              activeView === "chat"
                ? "bg-zinc-700/60 text-white shadow-sm font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
            <span>Thảo luận ({channel.name})</span>
          </button>

          <button
            onClick={() => setActiveView("tasks")}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
              activeView === "tasks"
                ? "bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 shadow-sm font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            )}
          >
            <Kanban className="h-3.5 w-3.5 text-indigo-400" />
            <span>Bảng việc của tổ</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
              Base
            </span>
          </button>

          <button
            onClick={() => setActiveView("meet")}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
              activeView === "meet"
                ? "bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 shadow-sm font-bold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            )}
          >
            <Video className="h-3.5 w-3.5 text-emerald-400" />
            <span>Phòng họp & Biên bản</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
              AI
            </span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 hidden md:flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Không gian làm việc đồng bộ: Chat + Base + Họp AI</span>
        </div>
      </div>

      {/* Active Stage Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeView === "chat" && children}

        {activeView === "tasks" && (
          <div className="flex-1 h-full overflow-hidden">
            <LarkBaseView
              serverId={server.id}
              defaultUnitId={channel.orgUnitId || "all"}
              hideHeader
            />
          </div>
        )}

        {activeView === "meet" && (
          <div className="flex-1 h-full overflow-hidden">
            <MeetingsPageView serverId={server.id} />
          </div>
        )}
      </div>
    </div>
  );
}

