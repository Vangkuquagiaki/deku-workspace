"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bot } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

export function NavigationBot() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/test-bot");

  const handleClick = () => {
    sounds?.playPop?.();
    router.push("/test-bot");
  };

  return (
    <ActionTooltip side="right" align="center" label="Bot Tự Động Test Demo Toàn Diện (Full E2E Flow)">
      <button
        onClick={handleClick}
        className="group relative flex items-center focus:outline-none"
      >
        <div
          className={cn(
            "absolute left-0 bg-white rounded-r-full transition-all duration-200 w-[4px]",
            !isActive && "group-hover:h-[20px] h-[0px]",
            isActive && "h-[40px]"
          )}
        />

        <div
          className={cn(
            "relative flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden items-center justify-center bg-[#313338] group-hover:bg-purple-600 shadow-sm",
            isActive && "bg-purple-600 rounded-[16px] shadow-[0_0_12px_rgba(168,85,247,0.4)]"
          )}
        >
          <Bot
            className={cn(
              "w-5 h-5 transition-colors duration-200",
              isActive ? "text-white" : "text-purple-400 group-hover:text-white"
            )}
          />
        </div>
      </button>
    </ActionTooltip>
  );
}
