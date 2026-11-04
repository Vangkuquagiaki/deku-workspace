"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  User,
  Sparkles,
  Megaphone,
  Calendar,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServerEnterpriseNavProps {
  serverId: string;
}

function ServerEnterpriseNavContent({ serverId }: ServerEnterpriseNavProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab");
  const [isExpanded, setIsExpanded] = useState(true);

  const isBaseRoute = pathname.startsWith(`/servers/${serverId}/base`);
  const isMeetingsRoute = pathname.startsWith(`/servers/${serverId}/meetings`);

  const navItems = [
    {
      id: "base",
      label: "Bảng Việc Lark Base & Tổ",
      icon: LayoutGrid,
      badge: "Base",
      href: `/servers/${serverId}/base`,
      isActive: isBaseRoute && (!currentTab || currentTab === "tasks"),
      iconColor: "text-indigo-400 group-hover:text-indigo-300",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      activeBg: "bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm shadow-indigo-950/50",
      activeIndicator: "bg-indigo-400",
    },
    {
      id: "me",
      label: "Hồ Sơ & Đãi Ngộ Của Tôi",
      icon: User,
      badge: "Me",
      href: `/servers/${serverId}/base?tab=me`,
      isActive: isBaseRoute && currentTab === "me",
      iconColor: "text-sky-400 group-hover:text-sky-300",
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      activeBg: "bg-sky-950/40 border-sky-500/50 text-white shadow-sm shadow-sky-950/50",
      activeIndicator: "bg-sky-400",
    },
    {
      id: "meetings",
      label: "Họp AI & Biên Bản",
      icon: Sparkles,
      badge: "AI",
      href: `/servers/${serverId}/meetings`,
      isActive: isMeetingsRoute,
      iconColor: "text-emerald-400 group-hover:text-emerald-300",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      activeBg: "bg-emerald-950/40 border-emerald-500/50 text-white shadow-sm shadow-emerald-950/50",
      activeIndicator: "bg-emerald-400",
    },
    {
      id: "bulletin",
      label: "Cổng Bảng Tin Công Ty",
      icon: Megaphone,
      badge: "News",
      href: `/servers/${serverId}/base?tab=bulletin`,
      isActive: isBaseRoute && currentTab === "bulletin",
      iconColor: "text-amber-400 group-hover:text-amber-300",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      activeBg: "bg-amber-950/40 border-amber-500/50 text-white shadow-sm shadow-amber-950/50",
      activeIndicator: "bg-amber-400",
    },
    {
      id: "leave",
      label: "Nghỉ Phép & Phê Duyệt",
      icon: Calendar,
      badge: "HR",
      href: `/servers/${serverId}/base?tab=leave`,
      isActive: isBaseRoute && currentTab === "leave",
      iconColor: "text-purple-400 group-hover:text-purple-300",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      activeBg: "bg-purple-950/40 border-purple-500/50 text-white shadow-sm shadow-purple-950/50",
      activeIndicator: "bg-purple-400",
    },
    {
      id: "directory",
      label: "Danh Bạ & Vòng Đời",
      icon: Users,
      badge: "Dir",
      href: `/servers/${serverId}/base?tab=directory`,
      isActive: isBaseRoute && (currentTab === "directory" || currentTab === "org"),
      iconColor: "text-blue-400 group-hover:text-blue-300",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      activeBg: "bg-blue-950/40 border-blue-500/50 text-white shadow-sm shadow-blue-950/50",
      activeIndicator: "bg-blue-400",
    },
    {
      id: "audit",
      label: "Kiểm Toán & Tuân Thủ",
      icon: ShieldCheck,
      badge: "Audit",
      href: `/servers/${serverId}/base?tab=audit`,
      isActive: isBaseRoute && currentTab === "audit",
      iconColor: "text-teal-400 group-hover:text-teal-300",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      activeBg: "bg-teal-950/40 border-teal-500/50 text-white shadow-sm shadow-teal-950/50",
      activeIndicator: "bg-teal-400",
    },
    {
      id: "threads",
      label: "Threads & Sáng Kiến",
      icon: Flame,
      badge: "V3",
      href: `/servers/${serverId}/base?tab=threads`,
      isActive: isBaseRoute && currentTab === "threads",
      iconColor: "text-violet-400 group-hover:text-violet-300",
      badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
      activeBg: "bg-violet-950/40 border-violet-500/50 text-white shadow-sm shadow-violet-950/50",
      activeIndicator: "bg-violet-400",
    },
  ];

  return (
    <div className="mb-2 px-1 select-none">
      {/* Section Header with collapse toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-2 py-1 flex items-center justify-between text-[11px] uppercase font-bold text-zinc-400 hover:text-zinc-200 tracking-wider transition group rounded-md hover:bg-white/5"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Briefcase className="h-3 w-3 text-indigo-400 shrink-0" />
          <span className="truncate">Không gian doanh nghiệp</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-zinc-500 group-hover:text-zinc-300">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Cards list */}
      {isExpanded && (
        <div className="space-y-1 mt-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "group relative px-2.5 py-1.5 rounded-lg flex items-center gap-x-2.5 w-full text-xs transition-all border",
                  item.isActive
                    ? item.activeBg
                    : "bg-[#232428]/40 hover:bg-[#2b2d31] border-white/[0.04] hover:border-zinc-700/60 text-zinc-300 hover:text-white"
                )}
              >
                {/* Active left indicator bar */}
                {item.isActive && (
                  <div
                    className={cn(
                      "absolute -left-1.5 w-1 h-4 rounded-r-full transition-all shadow-sm",
                      item.activeIndicator
                    )}
                  />
                )}

                {/* Icon */}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                    item.isActive ? "text-white" : item.iconColor
                  )}
                />

                {/* Label text */}
                <span
                  className={cn(
                    "truncate flex-1 min-w-0 font-medium",
                    item.isActive ? "font-semibold text-white" : ""
                  )}
                  title={item.label}
                >
                  {item.label}
                </span>

                {/* Badge on the right - never shrinks or clips */}
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none transition-colors",
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ServerEnterpriseNav(props: ServerEnterpriseNavProps) {
  return (
    <Suspense fallback={<div className="h-8" />}>
      <ServerEnterpriseNavContent {...props} />
    </Suspense>
  );
}
