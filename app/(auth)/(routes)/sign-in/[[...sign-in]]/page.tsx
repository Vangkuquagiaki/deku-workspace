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
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [clerkError, setClerkError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const demoAccounts = [
    {
      role: "HEAD",
      roleBadge: "Giám Đốc Khối (HEAD)",
      roleColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      name: "Lê Hoàng Long",
      email: "head.tech@enterprise.local",
      dept: "Phòng Công Nghệ",
      desc: "Xem toàn bộ task của mọi tổ trực thuộc phòng, duyệt nhân sự cấp phòng.",
      targetUrl: "/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/e30c2e39-7648-44c5-a693-da7c151877fe"
    },
    {
      role: "LEAD",
      roleBadge: "Trưởng Tổ (LEAD)",
      roleColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      name: "Nguyễn Minh Tuấn",
      email: "lead.cloud@enterprise.local",
      dept: "Tổ Nền Tảng & Cloud",
      desc: "Quản lý và điều phối các nhiệm vụ của tổ mình, xem thâm niên thành viên.",
      targetUrl: "/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/f823aa40-8dd5-4806-b891-c1054d16c407"
    },
    {
      role: "HR",
      roleBadge: "Nhân Sự (HR)",
      roleColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      name: "Phạm Thu Hà",
      email: "hr.admin@enterprise.local",
      dept: "Phòng Nhân Sự",
      desc: "Nhập CSV công nhật, quản trị bảng tin. Bị chặn xem nhiệm vụ phòng ban (B6).",
      targetUrl: "/base"
    },
    {
      role: "MEMBER",
      roleBadge: "Thành Viên (MEMBER)",
      roleColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      name: "Trần Thị Lan",
      email: "member.sales@enterprise.local",
      dept: "Tổ Kinh Doanh Nội Địa",
      desc: "Chỉ thấy công việc của tổ mình và hồ sơ cá nhân bảo mật.",
      targetUrl: "/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/1811e0c6-b6d3-4f93-988c-be1468a38d23"
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center gap-8 py-8">
      {/* Top Quick Access Banner */}
      <div className="w-full max-w-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base">
              Deku Enterprise Workspace Platform
            </h2>
            <p className="text-xs text-white/80">
              Hệ thống phòng họp AI, quản trị nhân sự và không gian làm việc trực tuyến
            </p>
          </div>
        </div>

        <Link
          href="/servers/9825609f-fc16-49e5-99ca-e2c204fdf8ec/channels/e30c2e39-7648-44c5-a693-da7c151877fe"
          className="shrink-0 bg-white hover:bg-zinc-100 text-indigo-700 font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
        >
          <span>Vào Không Gian Ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-8">
        {/* Clerk Sign In Box or Fallback Auth Form */}
        <div className="shrink-0 w-full lg:w-auto flex justify-center">
          {mounted && !clerkError ? (
            <div className="relative">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "mx-auto shadow-2xl rounded-3xl border border-zinc-800"
                  }
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
