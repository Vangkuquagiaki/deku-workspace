"use client";

import React from "react";
import { Plus } from "lucide-react";

import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";
import { sounds } from "@/lib/sounds";

export function NavigationAction() {
  const { onOpen } = useModal();

  return (
    <div>
      <ActionTooltip side="right" align="center" label="Thêm Phòng ban / Không gian làm việc">
        <button
          onClick={() => {
            sounds.playPop();
            onOpen("createServer");
          }}
          className="group relative flex items-center focus:outline-none"
        >
          {/* Left pill on hover */}
          <div className="absolute left-0 bg-white rounded-r-full transition-all duration-200 w-[4px] group-hover:h-[20px] h-0" />
          <div className="flex mx-3 h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden items-center justify-center bg-[#313338] group-hover:bg-[#23a55a]">
            <Plus
              className="text-[#23a55a] group-hover:text-white transition-colors duration-200"
              size={24}
            />
          </div>
        </button>
      </ActionTooltip>
    </div>
  );
}
