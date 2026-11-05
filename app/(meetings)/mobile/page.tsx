"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  Sparkles,
  Zap,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Video,
  LayoutGrid,
  Bell,
  MessageSquare,
  Flame,
  Laptop,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { sounds } from "@/lib/sounds";

export default function MobileHubPage() {
  const router = useRouter();
  const { canInstall, isInstalled, platform, promptInstall } = usePwaInstall();
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "other">("android");
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/iPhone|iPad|iPod/.test(ua)) {
        setDeviceType("ios");
      } else if (/Android/.test(ua)) {
        setDeviceType("android");
      } else {
        setDeviceType(platform === "ios" ? "ios" : "android");
      }
    }
  }, [platform]);

  const handleInstallClick = async () => {
    try {
      sounds.playPop();
    } catch (_) {}

    if (canInstall) {
      await promptInstall();
      setInstallSuccess(true);
    } else if (deviceType === "android") {
      // Prompt user with Chrome menu guidance
      alert(
        "Nhấn vào biểu tượng 3 dấu chấm (⋮) ở góc trên bên phải trình duyệt Chrome, sau đó chọn 'Cài đặt ứng dụng' hoặc 'Thêm vào Màn hình chính'!"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#111214] text-white flex flex-col select-none overflow-x-hidden pb-20 md:pb-8">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-zinc-800/80 bg-[#1e1f22]/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/20 bg-black/40 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Deku Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Deku Workspace
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Mobile App
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 hidden xs:block">
              Ứng dụng di động chuyên nghiệp cho Android & iPhone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/base?tab=today"
            className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Vào App Ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
            <Smartphone className="h-4 w-4" />
            <span>Tối Ưu Hóa Riêng Biệt Cho Điện Thoại Di Động</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            Trải nghiệm làm việc mượt mà <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              ngay trong lòng bàn tay bạn
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Ứng dụng được thiết kế tối ưu cho thao tác chạm vuốt một tay, giao diện toàn màn hình không viền trình duyệt, nhận thông báo tức thì và gọi video dọc sắc nét.
          </p>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex items-center justify-center">
          <div className="p-1 rounded-2xl bg-[#1e1f22] border border-zinc-800 flex items-center gap-1 shadow-xl">
            <button
              onClick={() => setDeviceType("android")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                deviceType === "android"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Android (Samsung, Xiaomi, Oppo...)</span>
            </button>

            <button
              onClick={() => setDeviceType("ios")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                deviceType === "ios"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>iPhone & iPad (iOS Safari)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Installation Guide Card */}
        <div className="bg-[#1e1f22]/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {deviceType === "android" ? (
            /* ANDROID INSTALL FLOW */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Chuẩn Google PWA
                    </span>
                    <span className="text-xs text-zinc-400">• Dung lượng &lt; 3MB</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Cài đặt Deku Mobile cho điện thoại Android
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Tương thích Google Chrome, Edge, Samsung Internet, Brave...
                  </p>
                </div>

                <Button
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>{canInstall ? "Cài Đặt Ứng Dụng Ngay (1-Click)" : "Cài Đặt Ứng Dụng"}</span>
                </Button>
              </div>

              {/* 3 Steps Guide for Android */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-white">Mở bằng Google Chrome</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Mở đường link này trong trình duyệt Chrome trên điện thoại của bạn.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-white">Bấm Cài Đặt Ứng Dụng</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Nhấn nút <strong>&ldquo;Cài đặt&rdquo;</strong> ở trên hoặc chọn nút ⋮ góc trên bên phải $\rightarrow$ <strong>&ldquo;Cài đặt ứng dụng&rdquo;</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-white">Hoạt Động Toàn Màn Hình</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Icon Deku Workspace sẽ xuất hiện trên màn hình chính và khay ứng dụng như tải từ CH Play.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* IOS SAFARI INSTALL FLOW */
            <div className="space-y-6">
              <div className="border-b border-zinc-800 pb-5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Apple iOS Safari
                  </span>
                  <span className="text-xs text-zinc-400">• Không cần Jailbreak</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Cài đặt Deku Mobile trên iPhone & iPad
                </h3>
                <p className="text-xs text-zinc-300">
                  Thực hiện trực tiếp trên trình duyệt <strong>Safari</strong> theo 3 bước đơn giản dưới đây:
                </p>
              </div>

              {/* 3 Steps Guide for iOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-indigo-500/20 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Bấm nút Chia Sẻ (Share)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Nhấn biểu tượng ô vuông có mũi tên hướng lên ở thanh công cụ dưới đáy màn hình Safari.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-indigo-500/20 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-white">Thêm vào Màn hình chính</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Cuộn xuống danh sách tính năng và chọn <strong>&ldquo;Thêm vào MH chính&rdquo; (Add to Home Screen)</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-indigo-500/20 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-white">Nhấn &ldquo;Thêm&rdquo; (Add)</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Nhấn chữ <strong>&ldquo;Thêm&rdquo;</strong> ở góc trên bên phải. Ứng dụng sẽ có logo Deku sắc nét trên màn hình iPhone!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Direct Mobile Launch Button */}
          <div className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400 text-center sm:text-left">
              💡 Bạn cũng có thể dùng thử ứng dụng ngay trên trình duyệt mà không cần cài đặt.
            </div>

            <Button
              asChild
              className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Link href="/base?tab=today">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Mở Không Gian Làm Việc Di Động Ngay</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Feature Highlights for Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-2 text-center sm:text-left">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
              <Zap className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Cực Kỳ Nhẹ & Nhanh</h4>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Tải trang dưới 1 giây, tiết kiệm pin và dung lượng 4G/5G.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-2 text-center sm:text-left">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto sm:mx-0">
              <Bell className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Thông Báo Tức Thì</h4>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Không bỏ lỡ cuộc họp khẩn cấp và phân công nhiệm vụ từ sếp.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-2 text-center sm:text-left">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto sm:mx-0">
              <Video className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Họp Video Dọc Chuẩn HD</h4>
            <p className="text-[11px] text-zinc-400 leading-tight">
              WebRTC trực tuyến, tự động xoay ngang dọc và khử ồn AI.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-2 text-center sm:text-left">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto sm:mx-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Bảo Mật 3 Tầng</h4>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Dữ liệu tin nhắn và tài liệu doanh nghiệp được mã hóa bảo mật.
            </p>
          </div>
        </div>

        {/* Back to Computer download link */}
        <div className="text-center pt-4">
          <Link
            href="/download"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition underline underline-offset-4"
          >
            <Laptop className="h-3.5 w-3.5 text-sky-400" />
            <span>Bạn đang sử dụng máy tính? Chuyển sang trang tải ứng dụng cho Windows PC</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

