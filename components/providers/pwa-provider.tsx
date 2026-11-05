"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Laptop, Smartphone, Check } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import Link from "next/link";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { canInstall, isInstalled, platform, promptInstall } = usePwaInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register Service Worker for PWA & offline performance
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // SW registered
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration error:", err);
        });
    }

    // Check if user previously dismissed prompt in this session
    const isDismissed = sessionStorage.getItem("deku_pwa_dismissed");
    if (isDismissed) {
      setDismissed(true);
    } else {
      // Delay prompt appearance so user can see the app first
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    try {
      sessionStorage.setItem("deku_pwa_dismissed", "true");
    } catch (_) {}
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      await promptInstall();
      setShowBanner(false);
    } else {
      // Navigate to download page
      window.location.href = "/download";
    }
  };

  return (
    <>
      {children}

      {/* Floating Smart Install Banner (Non-intrusive) */}
      {showBanner && !isInstalled && !dismissed && (
        <aside
          role="region"
          aria-label="Cài đặt ứng dụng"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-[#1e1f22]/95 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 select-none text-white"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              {platform === "android" || platform === "ios" ? (
                <Smartphone className="h-5 w-5 text-white" />
              ) : (
                <Laptop className="h-5 w-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-bold text-white tracking-wide truncate">
                  {platform === "android" || platform === "ios"
                    ? "Cài đặt ứng dụng Deku trên Điện thoại"
                    : "Cài đặt Deku Workspace trên Máy tính"}
                </h4>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0"
                  title="Đóng thông báo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {platform === "android" || platform === "ios"
                  ? "Cài đặt ứng dụng để trải nghiệm toàn màn hình mượt mà, nhận thông báo tức thì và gọi video không giật lag."
                  : "Mở ứng dụng độc lập trên Windows, chạy nền ở khay hệ thống và nhận cuộc gọi tức thì."}
              </p>

              <div className="flex items-center gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{canInstall ? "Cài đặt ngay (1-Click)" : "Xem cách tải"}</span>
                </button>

                <Link
                  href="/download"
                  onClick={() => setShowBanner(false)}
                  className="h-8 px-3 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 hover:text-white text-xs font-semibold border border-white/5 transition flex items-center"
                >
                  Tùy chọn tải về
                </Link>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
