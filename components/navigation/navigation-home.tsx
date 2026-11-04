"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

export function NavigationHome() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/channels/@me");

  const handleClick = () => {
    sounds.playPop();
    router.push("/channels/@me");
  };

  return (
    <ActionTooltip side="right" align="center" label="Deku Platform - Cổng làm việc & Danh bạ công ty">
      <button
        onClick={handleClick}
        className="group relative flex items-center focus:outline-none"
      >
        {/* Left Discord White Pill */}
        <div
          className={cn(
            "absolute left-0 bg-white rounded-r-full transition-all duration-200 w-[4px]",
            !isActive && "group-hover:h-[20px] h-[0px]",
            isActive && "h-[40px]"
          )}
        />

        {/* Squircle container with Deku logo */}
        <div
          className={cn(
            "relative flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden items-center justify-center bg-[#111214] border border-white/10 group-hover:border-emerald-500/50 shadow-md",
            isActive && "border-emerald-500 rounded-[16px] ring-2 ring-emerald-500/40"
          )}
        >
          <img
            src="/logo.png"
            alt="Deku"
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
          />
        </div>
      </button>
    </ActionTooltip>
  );
}
