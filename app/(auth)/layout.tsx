import React from "react";
import Link from "next/link";
import { Download, Sparkles, Laptop, Smartphone } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111214] text-white flex flex-col overflow-y-auto">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-zinc-800/80 bg-[#1e1f22]/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md shadow-emerald-500/20 bg-black/40 shrink-0">
            <img src="/logo.png" alt="Deku Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              Deku Workspace
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold hidden xs:inline">
                Enterprise
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Nền tảng làm việc, phòng họp video và quản trị nhân sự AI bảo mật
            </p>
          </div>
        </div>

        {/* Right download action */}
        <div className="flex items-center gap-2">
          <Link
            href="/download"
            className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95"
            title="Xem trung tâm tải ứng dụng cho Windows PC và Điện thoại"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải Ứng Dụng (PC & Mobile)</span>
          </Link>
        </div>
      </header>

      {/* Main Auth Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
