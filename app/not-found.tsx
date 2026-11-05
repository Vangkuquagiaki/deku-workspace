import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Home, LayoutGrid, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#111214] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-[#1e1f22]/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
            404 • Không Tìm Thấy Trang
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Đường Dẫn Không Tồn Tại
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Trang hoặc phân hệ doanh nghiệp bạn đang tìm kiếm có thể đã được di chuyển hoặc bạn chưa được phân quyền truy cập.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <Button
            asChild
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 text-xs font-semibold shadow-md shadow-indigo-600/20"
          >
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="w-3.5 h-3.5" />
              <span>Về Trang Chủ</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-200 rounded-xl h-10 text-xs font-semibold"
          >
            <Link href="/base?tab=today" className="flex items-center justify-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảng Việc Lark</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:col-span-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-xl h-10 text-xs font-medium"
          >
            <Link href="/meetings" className="flex items-center justify-center gap-2">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phòng Họp Doanh Nghiệp & Hội Nghị AI</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
