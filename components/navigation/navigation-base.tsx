"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

export function NavigationBase() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/base");

  const handleClick = () => {
    sounds?.playPop?.();
    router.push("/base");
  };

  return (
    <ActionTooltip side="right" align="center" label="Lark Base & Bảng Việc Của Tổ (Grid/Kanban)">
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
            "relative flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden items-center justify-center bg-[#313338] group-hover:bg-indigo-600 shadow-sm",
            isActive && "bg-indigo-600 rounded-[16px] shadow-[0_0_12px_rgba(99,102,241,0.4)]"
          )}
        >
          <LayoutGrid
            className={cn(
              "w-6 h-6 transition-colors duration-200",
              isActive ? "text-white" : "text-indigo-400 group-hover:text-white"
            )}
          />
        </div>
      </button>
    </ActionTooltip>
  );
}
