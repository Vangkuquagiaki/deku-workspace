"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  LayoutGrid,
  Sparkles,
  Video,
  Smartphone,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

export function MobileBottomNav() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't show in active video calls, auth pages, or windows download script
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/meet/") ||
    pathname.includes("/meetings/")
  ) {
    return null;
  }

  const isChat =
    pathname.startsWith("/servers/") &&
    !pathname.includes("/base") &&
    !pathname.includes("/meetings") ||
    pathname.startsWith("/channels");

  const isBaseTasks =
    pathname.startsWith("/base") && (!currentTab || currentTab === "tasks") ||
    pathname.includes("/base") && currentTab === "tasks";

  const isAiToday =
    pathname.startsWith("/base") && currentTab === "today" ||
    pathname.includes("/base") && currentTab === "today";

  const isMeetings =
    pathname === "/meetings" ||
    pathname.includes("/servers/") && pathname.includes("/meetings");

  const isMobileApp = pathname.startsWith("/mobile") || pathname.startsWith("/download");

  const navItems = [
    {
      id: "chat",
      label: "Trò chuyện",
      href: "/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec",
      icon: MessageSquare,
      isActive: isChat,
      activeColor: "text-emerald-400",
      activeBg: "bg-emerald-500/15",
    },
    {
      id: "base",
      label: "Bảng việc",
      href: "/base?tab=tasks",
      icon: LayoutGrid,
      isActive: isBaseTasks,
      activeColor: "text-indigo-400",
      activeBg: "bg-indigo-500/15",
    },
    {
      id: "ai",
      label: "AI Trợ lý",
      href: "/base?tab=today",
      icon: Sparkles,
      isActive: isAiToday,
      activeColor: "text-amber-400",
      activeBg: "bg-amber-500/15",
      badge: "AI",
    },
    {
      id: "meetings",
      label: "Phòng họp",
      href: "/meetings",
      icon: Video,
      isActive: isMeetings,
      activeColor: "text-emerald-400",
      activeBg: "bg-emerald-500/15",
    },
    {
      id: "download",
      label: "Tải App",
      href: "/download",
      icon: Download,
      isActive: isMobileApp,
      activeColor: "text-emerald-400",
      activeBg: "bg-emerald-500/15",
      badge: "HOT",
    },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1e1f22]/95 backdrop-blur-xl border-t border-zinc-800/90 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)] shadow-2xl select-none"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                if (!item.isActive) {
                  try {
                    sounds.playPop();
                  } catch (_) {}
                }
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 relative group active:scale-95",
                item.isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-colors relative flex items-center justify-center",
                  item.isActive ? item.activeBg : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    item.isActive ? cn(item.activeColor, "scale-110") : "text-zinc-400"
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-black shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-tight mt-0.5 truncate max-w-[64px]",
                  item.isActive ? item.activeColor : "text-zinc-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

