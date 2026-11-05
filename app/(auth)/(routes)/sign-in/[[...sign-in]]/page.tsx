"use client";

import React, { useState, useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  Building2,
  Users,
  ArrowRight,
  CheckCircle2,
  LogIn,
  Layers,
  Video,
  Laptop,
  Smartphone,
  Download,
  QrCode,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  ExternalLink,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [clerkError, setClerkError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showQrPanel, setShowQrPanel] = useState(false);
  const [mobileOs, setMobileOs] = useState<"android" | "ios">("android");
  const [downloadingWindows, setDownloadingWindows] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const appUrl = "https://deku-workspace.vercel.app";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
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

  const demoAccounts = [
    {
      role: "HEAD",
      roleBadge: "Giám Đốc Khối (HEAD)",
      roleColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      name: "Lê Hoàng Long",
      email: "head.tech@enterprise.local",
      dept: "Phòng Công Nghệ",
      desc: "Xem toàn bộ task của mọi tổ trực thuộc phòng, duyệt nhân sự cấp phòng.",
      targetUrl: "/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/e30c2e39-7648-44c5-a693-da7c151877fe",
    },
    {
      role: "LEAD",
      roleBadge: "Trưởng Tổ (LEAD)",
      roleColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      name: "Nguyễn Minh Tuấn",
      email: "lead.cloud@enterprise.local",
      dept: "Tổ Nền Tảng & Cloud",
      desc: "Quản lý và điều phối các nhiệm vụ của tổ mình, xem thâm niên thành viên.",
      targetUrl: "/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/f823aa40-8dd5-4806-b891-c1054d16c407",
    },
    {
      role: "HR",
      roleBadge: "Nhân Sự (HR)",
      roleColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      name: "Phạm Thu Hà",
      email: "hr.admin@enterprise.local",
      dept: "Phòng Nhân Sự",
      desc: "Nhập CSV công nhật, quản trị bảng tin. Bị chặn xem nhiệm vụ phòng ban (B6).",
      targetUrl: "/base",
    },
    {
      role: "MEMBER",
      roleBadge: "Thành Viên (MEMBER)",
      roleColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      name: "Trần Thị Lan",
      email: "member.sales@enterprise.local",
      dept: "Tổ Kinh Doanh Nội Địa",
      desc: "Chỉ thấy công việc của tổ mình và hồ sơ cá nhân bảo mật.",
      targetUrl: "/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/1811e0c6-b6d3-4f93-988c-be1468a38d23",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center gap-6 py-6 select-none">
      {/* 1. TOP DOWNLOAD HUB: WINDOWS PC & SMARTPHONE APP (Đặt ở phần đầu theo yêu cầu) */}
      <div className="w-full max-w-4xl bg-gradient-to-r from-[#18191c] via-[#1e1f22] to-[#18191c] border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <Sparkles className="h-3 w-3" />
              <span>Đa Nền Tảng: Web • Windows PC • Android • iOS (iPhone)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Tải Ứng Dụng Deku Cho Máy Tính & Điện Thoại</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
              Bạn có thể đăng nhập trên Web ngay bên dưới, hoặc tải ứng dụng riêng cho máy tính và điện thoại để nhận cuộc gọi, thông báo khay hệ thống mượt mà nhất.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/test-bot"
              className="shrink-0 h-9 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Khởi chạy Bot tự động full test toàn bộ tính năng demo"
            >
              <Bot className="h-3.5 w-3.5 text-indigo-400" />
              <span>Bot Auto-Test</span>
            </Link>

            <Link
              href="/download"
              className="shrink-0 h-9 px-3.5 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <span>Trung tâm tải về</span>
              <ExternalLink className="h-3 w-3 text-emerald-400" />
            </Link>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {/* Windows Download Button */}
          <button
            type="button"
            onClick={handleDownloadWindows}
            disabled={downloadingWindows}
            className="h-11 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Laptop className="h-4 w-4" />
            <span>
              {downloadingWindows
                ? "Đang tải xuống bộ cài..."
                : "Tải Cho Windows (1-Click Setup)"}
            </span>
          </button>

          {/* Smartphone QR Code Toggle Button */}
          <button
            type="button"
            onClick={() => setShowQrPanel(!showQrPanel)}
            className={`h-11 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 border cursor-pointer ${
              showQrPanel
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                : "bg-[#2b2d31] hover:bg-zinc-700 text-zinc-200 border-white/5"
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-400" />
            <span>Quét Mã Cài Cho Điện Thoại</span>
            {showQrPanel ? (
              <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>

          {/* Quick Web Mode Link */}
          <div className="h-11 px-4 rounded-2xl bg-[#111214]/60 border border-zinc-800 text-zinc-400 text-xs flex items-center justify-center gap-2 sm:col-span-2 md:col-span-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bản Web sẵn sàng bên dưới</span>
          </div>
        </div>

        {/* Expandable Mobile App QR Code & Guide */}
        {showQrPanel && (
          <div className="mt-3 p-4 rounded-2xl bg-[#111214] border border-indigo-500/30 space-y-3 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-400" />
                Quét mã bằng Camera điện thoại để cài đặt ứng dụng ngay
              </span>

              {/* OS Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#2b2d31] border border-white/5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMobileOs("android")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    mobileOs === "android"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOs("ios")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    mobileOs === "ios"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  iPhone (iOS)
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <div className="p-2 bg-black/60 rounded-xl border border-emerald-500/40 shrink-0 shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Deku Workspace"
                  className="w-28 h-28 rounded-lg"
                />
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300">
                {mobileOs === "android" ? (
                  <>
                    <p className="font-semibold text-emerald-400">
                      Hướng dẫn cài đặt trên Android (Samsung, Xiaomi, Oppo...):
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                      <li>Bật máy ảnh điện thoại quét mã QR để mở trang trong Google Chrome.</li>
                      <li>Nhấn vào thông báo <strong>&ldquo;Cài đặt ứng dụng Deku&rdquo;</strong> hoặc bấm nút ⋮ chọn <strong>&ldquo;Cài đặt ứng dụng&rdquo;</strong>.</li>
                      <li>Ứng dụng sẽ hiển thị trực tiếp trên màn hình chính như một app tải từ CH Play.</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-indigo-400">
                      Hướng dẫn cài đặt trên iPhone / iPad (iOS Safari):
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                      <li>Mở Camera iPhone quét mã QR để mở liên kết trong <strong>Safari</strong>.</li>
                      <li>Nhấn nút <strong>Chia sẻ</strong> (hình vuông có mũi tên trỏ lên ở dưới cùng).</li>
                      <li>Cuộn xuống chọn <strong>&ldquo;Thêm vào MH chính&rdquo; (Add to Home Screen)</strong> rồi nhấn <strong>Thêm</strong>.</li>
                    </ol>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN SIGN-IN & EXPLORE AREA */}
      <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-8">
        {/* Clerk Sign In Box or Fallback Auth Form */}
        <div className="shrink-0 w-full lg:w-auto flex justify-center">
          {mounted && !clerkError ? (
            <div className="relative">
              <SignIn
                afterSignInUrl="/"
                afterSignUpUrl="/"
                redirectUrl="/"
                appearance={{
                  elements: {
                    rootBox: "mx-auto shadow-2xl rounded-3xl border border-zinc-800",
                  },
                }}
              />
            </div>
          ) : (
            <div className="w-full max-w-sm bg-[#1e1f22] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg">Đăng Nhập Doanh Nghiệp</h3>
              <p className="text-xs text-zinc-400">
                Nhấn bên dưới để vào trực tiếp không gian làm việc Deku Workspace.
              </p>
              <Button
                asChild
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-11 font-bold"
              >
                <Link href="/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/e30c2e39-7648-44c5-a693-da7c151877fe">
                  Truy Cập Nền Tảng Ngay
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Demo Credentials & Quick Explore Guide */}
        <div className="max-w-md w-full bg-[#1e1f22]/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="space-y-1.5 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-white text-base">Hệ Thống Doanh Nghiệp Demo</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bấm chọn bất kỳ vai trò nào bên dưới để chuyển thẳng vào góc nhìn của phòng ban đó:
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              4 Vai Trò Demo (Bấm để vào trực tiếp)
            </span>

            {demoAccounts.map((acc) => (
              <Link
                key={acc.email}
                href={acc.targetUrl}
                className="block p-3.5 rounded-2xl bg-[#2b2d31]/60 border border-white/5 space-y-1.5 hover:border-indigo-500/50 hover:bg-[#2b2d31] transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition">
                    {acc.name}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${acc.roleColor}`}>
                    {acc.roleBadge}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>{acc.email}</span>
                  <span className="text-zinc-500">{acc.dept}</span>
                </div>
                <p className="text-[11px] text-zinc-400 italic">{acc.desc}</p>
                <div className="flex items-center justify-end text-[11px] text-indigo-400 font-bold gap-1 pt-1 opacity-80 group-hover:opacity-100 transition">
                  <span>Vào phòng ban này</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
            <Link
              href="/base"
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 group bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Bảng Tin Lark Base</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/meetings"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 group bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"
            >
              <Video className="h-3.5 w-3.5 text-emerald-400" />
              <span>Phòng Họp AI</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
