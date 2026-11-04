"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  ArrowRight,
  Clock,
  Users,
  Sparkles,
  FileText,
  Calendar,
  ShieldCheck,
  Languages,
  ChevronRight,
  Loader2,
  Lock,
  Eye,
  ArrowLeft,
  LogOut,
  LayoutGrid,
  Home,
  RotateCcw,
  Settings,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface MeetingsPageViewProps {
  serverId?: string;
}

export function MeetingsPageView({ serverId }: MeetingsPageViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const [meetingCode, setMeetingCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingRole, setMeetingRole] = useState<"LEAD" | "MEMBER">("LEAD");

  useEffect(() => {
    fetchRecentMeetings();
  }, []);

  const fetchRecentMeetings = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch("/api/meetings", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setRecentMeetings(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Họp nội bộ - ${user?.fullName || user?.username || "Thành viên"}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/meet/${data.code}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = meetingCode.trim().replace(/^https?:\/\/[^\/]+\/meet\//, "");
    if (cleanCode) {
      router.push(`/meet/${cleanCode}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-zinc-100 overflow-y-auto">
      {/* Header */}
      <header className="h-14 sm:h-16 px-4 md:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#1e1f22]/90 backdrop-blur-md sticky top-0 z-30 gap-3">
        {/* Left: Navigation and Branding */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {/* Compact Back & Exit icon buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(serverId ? `/servers/${serverId}` : "/");
                }
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 transition flex items-center justify-center shrink-0 shadow-sm"
              title="Quay lại trang trước"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => router.push(serverId ? `/servers/${serverId}` : "/")}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#2b2d31] hover:bg-rose-950/40 hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 border border-white/5 transition flex items-center justify-center shrink-0 shadow-sm"
              title="Thoát khỏi phòng họp, về Workspace chính (Discord)"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block shrink-0" />

          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white whitespace-nowrap truncate">
                  Phòng Họp & Hội Nghị Doanh Nghiệp
                </h1>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 hidden md:inline">
                  AI Phiên Dịch
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden xl:block truncate">
                Công nghệ WebRTC độ trễ thấp & Dịch thuật trực tiếp Việt - Anh
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions & Role */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick link to Base */}
          <button
            type="button"
            onClick={() => router.push(serverId ? `/servers/${serverId}/base` : "/base")}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 shadow-sm"
            title="Mở Bảng việc Base"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Bảng việc Base</span>
          </button>

          {/* Admin Recordings link */}
          <button
            type="button"
            onClick={() => router.push("/admin/meetings")}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 transition flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 shadow-sm"
            title="Quản trị bản ghi cuộc họp"
          >
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden md:inline">Quản trị bản ghi</span>
          </button>

          {/* Role switcher dropdown */}
          <div className="flex items-center gap-1.5 bg-[#2b2d31] border border-white/5 px-2.5 py-1 rounded-xl text-xs shadow-sm shrink-0 whitespace-nowrap">
            <Eye className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-zinc-400 text-[11px] font-medium hidden 2xl:inline">Vai trò:</span>
            <select
              value={meetingRole}
              onChange={(e) => setMeetingRole(e.target.value as "LEAD" | "MEMBER")}
              className="bg-transparent text-[11px] font-bold text-amber-300 focus:outline-none cursor-pointer whitespace-nowrap pr-1"
            >
              <option value="LEAD" className="bg-[#1e1f22] text-amber-300">👑 Trưởng nhóm</option>
              <option value="MEMBER" className="bg-[#1e1f22] text-zinc-300">👤 Nhân viên</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#1e1f22] p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phiên dịch song ngữ thời gian thực & Ghi hình bảo mật</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Cuộc họp video chất lượng cao cho doanh nghiệp của bạn
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-xl">
              Tạo phòng họp nhanh chóng chỉ với 1 cú click. Tự động chuyển giọng nói thành văn bản,
              dịch ngữ cảnh Việt – Anh tức thì và lưu trữ biên bản cuộc họp AI.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {meetingRole === "LEAD" ? (
                <button
                  type="button"
                  onClick={handleCreateMeeting}
                  disabled={isCreating}
                  className="h-12 px-6 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition duration-200 active:scale-95 disabled:opacity-70 shrink-0"
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  <span>Cuộc họp mới</span>
                </button>
              ) : (
                <div className="h-12 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 font-medium shrink-0">
                  <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Phân quyền Nhân sự: Xem phòng họp & Vào phòng gọi</span>
                </div>
              )}

              <form onSubmit={handleJoinMeeting} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã cuộc họp (abc-defg-hij)"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="h-12 px-4 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 flex-1 transition"
                />
                <button
                  type="submit"
                  disabled={!meetingCode.trim()}
                  className="h-12 px-4 rounded-xl font-semibold text-xs md:text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  <span>Vào phòng</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#2b2d31]/80 border border-zinc-700/40 space-y-2">
              <Languages className="h-6 w-6 text-indigo-400" />
              <h3 className="font-bold text-xs md:text-sm text-white">Phiên dịch trực tiếp</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Phụ đề Việt – Anh hiển thị thời gian thực theo câu nói.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#2b2d31]/80 border border-zinc-700/40 space-y-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <h3 className="font-bold text-xs md:text-sm text-white">Bảo mật nội bộ</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Đồng thuận ghi âm theo Luật 91/2025/QH15, kiểm duyệt phòng chờ.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#2b2d31]/80 border border-zinc-700/40 space-y-2">
              <Sparkles className="h-6 w-6 text-amber-400" />
              <h3 className="font-bold text-xs md:text-sm text-white">Biên bản AI</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Tự động tóm tắt cuộc họp, trích xuất action item vào Kanban.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#2b2d31]/80 border border-zinc-700/40 space-y-2">
              <Clock className="h-6 w-6 text-sky-400" />
              <h3 className="font-bold text-xs md:text-sm text-white">Độ trễ thấp</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Hạ tầng LiveKit kết nối siêu tốc & ổn định.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Meetings & Minutes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Biên bản & Cuộc họp gần đây</span>
            </h3>
            <span className="text-xs text-zinc-400">
              Tổng số: {recentMeetings.length} cuộc họp
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <span className="text-xs">Đang tải danh sách cuộc họp...</span>
            </div>
          ) : recentMeetings.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#1e1f22] border border-zinc-800 text-center text-xs text-zinc-500">
              Chưa có cuộc họp nào được ghi nhận. Hãy tạo cuộc họp mới ở trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentMeetings.map((m) => {
                const isLive = m.status === "LIVE";
                const isEnded = m.status === "ENDED";
                const detailHref = serverId
                  ? `/servers/${serverId}/meetings/${m.id}`
                  : `/meetings/${m.id}`;

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-3xl bg-[#1e1f22] border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-4 group shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isLive
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : isEnded
                              ? "bg-zinc-800 text-zinc-300"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isLive ? "bg-rose-500 animate-ping" : "bg-current"
                            }`}
                          />
                          {isLive ? "Đang diễn ra" : isEnded ? "Đã kết thúc" : "Đã lên lịch"}
                        </span>

                        <span className="font-mono text-xs text-zinc-400 font-semibold">
                          #{m.code}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition leading-snug">
                        {m.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-indigo-400" />
                          {m.participants?.length || 1} người
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          {new Date(m.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                      <button
                        onClick={() => router.push(`/meet/${m.code}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition active:scale-95"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Vào phòng gọi</span>
                      </button>

                      <button
                        onClick={() => router.push(detailHref)}
                        className="px-3 py-1.5 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/5"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Xem biên bản AI</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

