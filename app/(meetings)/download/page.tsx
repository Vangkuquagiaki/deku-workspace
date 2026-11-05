"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Laptop,
  Smartphone,
  Globe,
  Download,
  ArrowLeft,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Sparkles,
  Video,
  LayoutGrid,
  Bell,
  Zap,
  Layers,
  ChevronRight,
  Share2,
  PlusSquare,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export default function DownloadHubPage() {
  const router = useRouter();
  const { canInstall, isInstalled, platform, promptInstall } = usePwaInstall();
  const [mobileOs, setMobileOs] = useState<"android" | "ios">("android");
  const [downloadingWindows, setDownloadingWindows] = useState(false);

  const appUrl = "https://deku-workspace.vercel.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    appUrl
  )}&color=10-185-129&bgcolor=17-18-20`;

  const handleDownloadWindows = () => {
    setDownloadingWindows(true);
    const link = document.createElement("a");
    link.href = "/api/download/windows";
    link.download = "Deku-Workspace-Setup.cmd";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingWindows(false), 2000);
  };

  const handleDirectInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      handleDownloadWindows();
    }
  };

  return (
    <div className="min-h-screen bg-[#111214] text-zinc-100 flex flex-col select-none overflow-y-auto">
      {/* Top Navbar */}
      <header className="h-16 px-4 md:px-8 border-b border-zinc-800/80 bg-[#1e1f22]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/base");
              }
            }}
            className="h-9 w-9 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 transition flex items-center justify-center shrink-0 shadow-sm"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-400" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md shadow-emerald-500/20 bg-black/40 shrink-0">
              <img src="/logo.png" alt="Deku Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                Deku Workspace
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Tải Ứng Dụng
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Trung tâm tải ứng dụng chính thức cho Máy tính & Điện thoại di động
              </p>
            </div>
          </div>
        </div>

        {/* Quick Nav Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/base"
            className="h-8 sm:h-9 px-3 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Lark Base</span>
          </Link>

          <Link
            href="/meetings"
            className="h-8 sm:h-9 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Video className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Phòng họp</span>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Đa nền tảng: Web • Windows PC • Android • iPhone (iOS)</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Làm việc mọi lúc, mọi nơi <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              trên mọi thiết bị của bạn
            </span>
          </h2>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Trải nghiệm Deku Workspace nguyên bản: bạn vẫn dùng trực tiếp trên trình duyệt Web (Google Chrome, Edge, Safari), đồng thời có thể tải ứng dụng độc lập cho <strong className="text-white">Máy tính Windows</strong> và <strong className="text-white">Điện thoại di động</strong> để nhận thông báo khay hệ thống và gọi video mượt mà.
          </p>
        </div>

        {/* 2 Main Platform Cards: Windows & Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Windows Desktop App */}
          <div className="rounded-3xl bg-[#1e1f22] border border-zinc-800 hover:border-emerald-500/40 transition p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition" />

            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
                  <Laptop className="h-7 w-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Windows 10 / 11
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Ứng Dụng Máy Tính Windows
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Cài đặt Deku Workspace thành ứng dụng desktop riêng biệt trên thanh Taskbar và Desktop, khởi chạy ngay mà không cần mở tab trình duyệt.
                </p>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Chạy độc lập trên Desktop, không bị lẫn với các tab lướt web</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Thông báo cuộc gọi và tin nhắn tức thì ở khay hệ thống (Tray)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Hội nghị WebRTC âm thanh & camera mượt mà, độ trễ cực thấp</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Tự động ghim lối tắt & mở cùng hệ thống chỉ với 1 cú nhấp</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 sm:pt-8 space-y-3">
              <button
                type="button"
                onClick={handleDownloadWindows}
                disabled={downloadingWindows}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>
                  {downloadingWindows
                    ? "Đang tải xuống bộ cài..."
                    : "Tải Bộ Cài Đặt Windows (.cmd / 1-Click Setup)"}
                </span>
              </button>

              {canInstall && (
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="w-full h-11 rounded-2xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs border border-white/10 transition flex items-center justify-center gap-2"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Cài đặt PWA ngay trên trình duyệt máy tính</span>
                </button>
              )}

              <p className="text-[11px] text-zinc-500 text-center">
                Bộ cài đặt tự động tương thích Windows 10 & Windows 11 64-bit
              </p>
            </div>
          </div>

          {/* Card 2: Mobile App (Android & iPhone) */}
          <div className="rounded-3xl bg-[#1e1f22] border border-zinc-800 hover:border-emerald-500/40 transition p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition" />

            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>

                {/* Switcher Android / iOS */}
                <div className="flex items-center p-1 rounded-xl bg-[#2b2d31] border border-white/5 text-xs font-semibold">
                  <button
                    onClick={() => setMobileOs("android")}
                    className={`px-3 py-1 rounded-lg transition ${
                      mobileOs === "android"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Android
                  </button>
                  <button
                    onClick={() => setMobileOs("ios")}
                    className={`px-3 py-1 rounded-lg transition ${
                      mobileOs === "ios"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    iPhone (iOS)
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Ứng Dụng Điện Thoại Thông Minh
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Cài đặt Deku Workspace trên điện thoại Android hoặc iPhone để duyệt công việc, họp video và chat với trợ lý AI mọi lúc mọi nơi.
                </p>
              </div>

              {/* QR Code and Mobile Step-by-Step Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center bg-[#18191c] p-4 rounded-2xl border border-zinc-800/80">
                <div className="sm:col-span-2 flex flex-col items-center text-center space-y-2">
                  <div className="p-2 bg-[#111214] rounded-2xl border border-emerald-500/30 shadow-md">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code Deku Workspace"
                      className="w-32 h-32 rounded-lg"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    Quét bằng camera điện thoại
                  </span>
                </div>

                <div className="sm:col-span-3 space-y-2.5 text-xs text-zinc-300">
                  {mobileOs === "android" ? (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          1
                        </span>
                        <p>Quét mã QR hoặc mở <strong>deku-workspace.vercel.app</strong> trên Google Chrome.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          2
                        </span>
                        <p>Nhấp vào banner <strong>&ldquo;Cài đặt ứng dụng&rdquo;</strong> hoặc bấm menu ⋮ rồi chọn <strong>&ldquo;Cài đặt ứng dụng&rdquo;</strong>.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          3
                        </span>
                        <p>Biểu tượng Deku sẽ hiển thị trên màn hình chính như một ứng dụng native mượt mà.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          1
                        </span>
                        <p>Mở camera quét QR hoặc truy cập <strong>deku-workspace.vercel.app</strong> bằng <strong>Safari</strong> trên iPhone.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          2
                        </span>
                        <p>Nhấn vào biểu tượng <strong>Chia sẻ</strong> (hình vuông có mũi tên trỏ lên) ở thanh dưới cùng.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          3
                        </span>
                        <p>Chọn <strong>&ldquo;Thêm vào MH chính&rdquo; (Add to Home Screen)</strong> rồi nhấn <strong>&ldquo;Thêm&rdquo;</strong>.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Mobile Action */}
            <div className="pt-6 sm:pt-8 space-y-3">
              <a
                href={appUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full h-12 rounded-2xl bg-[#2b2d31] hover:bg-zinc-700 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <span>Mở Trực Tiếp Trên Trình Duyệt Điện Thoại</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </a>

              <p className="text-[11px] text-zinc-500 text-center">
                Tương thích mọi thiết bị iOS 13+ (iPhone) và Android 8.0+
              </p>
            </div>
          </div>
        </div>

        {/* Web Browser Experience Always Available Card */}
        <div className="rounded-3xl bg-gradient-to-r from-[#18191c] via-[#1e1f22] to-[#18191c] border border-zinc-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Trải Nghiệm Web Trực Tiếp (Không Cần Cài Đặt)
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                  100% Tính Năng
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Bạn vẫn có thể tiếp tục sử dụng ứng dụng web trên Google Chrome, Microsoft Edge, Safari, Firefox mà không cần cài đặt bất kỳ thứ gì.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              href="/base"
              className="flex-1 md:flex-none h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Vào Lark Base</span>
            </Link>

            <Link
              href="/meetings"
              className="flex-1 md:flex-none h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Vào Phòng Họp</span>
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="rounded-3xl bg-[#1e1f22] border border-zinc-800 p-6 sm:p-8 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>So Sánh Trải Nghiệm Trên Các Phiên Bản</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Tính năng</th>
                  <th className="py-3 px-4 text-center">Bản Web (Trình duyệt)</th>
                  <th className="py-3 px-4 text-center text-emerald-400">Ứng dụng Windows (PC)</th>
                  <th className="py-3 px-4 text-center text-indigo-400">Ứng dụng Mobile (App)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Lark Base & Bảng việc Kanban</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Đầy đủ</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Tối ưu hóa</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Cảm ứng mượt</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Phòng họp video & AI Phiên dịch</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ WebRTC</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Độ trễ &lt; 100ms</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Camera trước/sau</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Trợ lý AI Cá nhân & Briefing</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Chuẩn ChatGPT</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Chuẩn ChatGPT</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Giọng nói / Chat</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Khởi chạy độc lập ngoài tab duyệt web</td>
                  <td className="py-3 px-4 text-center text-zinc-500">Mở trên tab</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Cửa sổ riêng biệt</td>
                  <td className="py-3 px-4 text-center text-indigo-400 font-bold">✓ Standalone App</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Thông báo khay hệ thống (System Tray / Push)</td>
                  <td className="py-3 px-4 text-center text-zinc-500">Khi mở tab</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Thông báo nền Windows</td>
                  <td className="py-3 px-4 text-center text-indigo-400 font-bold">✓ Thông báo màn hình khóa</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-zinc-800 text-center text-xs text-zinc-500">
        Deku Workspace Enterprise Platform • Đồng bộ thời gian thực trên Web, Windows và Smartphone.
      </footer>
    </div>
  );
}
