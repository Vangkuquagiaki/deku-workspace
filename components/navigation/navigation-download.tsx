"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Download } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

export function NavigationDownload() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/download");

  const handleClick = () => {
    sounds?.playPop?.();
    router.push("/download");
  };

  return (
    <ActionTooltip side="right" align="center" label="Tải Ứng Dụng (Windows Desktop & Mobile App)">
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
            "relative flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden items-center justify-center bg-[#313338] group-hover:bg-emerald-600 shadow-sm",
            isActive && "bg-emerald-600 rounded-[16px] shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          )}
        >
          <Download
            className={cn(
              "w-5 h-5 transition-colors duration-200",
              isActive ? "text-white" : "text-emerald-400 group-hover:text-white"
            )}
          />
        </div>
      </button>
    </ActionTooltip>
  );
}
