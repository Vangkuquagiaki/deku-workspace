import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#111214] flex flex-col items-center justify-center select-none text-white p-4">
      <div className="flex flex-col items-center gap-4 animate-fadeIn">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-xl shadow-emerald-500/20 bg-black/40 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Deku Workspace"
              className="h-12 w-12 object-contain animate-pulse"
            />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-md -z-10" />
        </div>

        <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          <span>Đang tải không gian làm việc bảo mật...</span>
        </div>
      </div>
    </div>
  );
}

