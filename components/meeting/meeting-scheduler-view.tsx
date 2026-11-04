"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  Users,
  Lock,
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Share2,
  CalendarCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sounds } from "@/lib/sounds";

export interface ScheduledMeeting {
  id: string;
  title: string;
  channelName: string;
  targetUrl: string;
  date: string;
  time: string;
  durationMinutes: number;
  host: string;
  department: string;
  isPrivate: boolean;
  pin?: string;
  description: string;
}

const DEFAULT_MEETINGS: ScheduledMeeting[] = [
  {
    id: "meet-1",
    title: "Họp Giao Ban Đầu Tuần & Báo Cáo KPI",
    channelName: "hop-giao-ban",
    targetUrl: "/channels/@me",
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    durationMinutes: 45,
    host: "Ban Giám Đốc",
    department: "Toàn công ty",
    isPrivate: false,
    description: "Đánh giá kết quả sprint tuần trước và phân bổ mục tiêu tuần mới."
  },
  {
    id: "meet-2",
    title: "Rà Soát Kỹ Thuật & Kiến Trúc Hệ Thống",
    channelName: "phong-ky-thuat",
    targetUrl: "/channels/@me",
    date: new Date().toISOString().slice(0, 10),
    time: "14:30",
    durationMinutes: 60,
    host: "Tech Lead",
    department: "Khối Kỹ Thuật & Công Nghệ",
    isPrivate: false,
    description: "Tối ưu hóa hiệu năng socket và kiểm thử tải phòng họp nội bộ."
  },
  {
    id: "meet-3",
    title: "Họp Kín Ban Lãnh Đạo & Kế Hoạch Tài Chính",
    channelName: "ban-giam-doc",
    targetUrl: "/channels/@me",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: "10:00",
    durationMinutes: 60,
    host: "Hội Đồng Quản Trị",
    department: "Ban Điều Hành",
    isPrivate: true,
    pin: "8888",
    description: "Bảo mật cấp cao: Kế hoạch ngân sách quý và phê duyệt định biên nhân sự."
  }
];

interface MeetingSchedulerViewProps {
  currentUserName: string;
}

export function MeetingSchedulerView({ currentUserName }: MeetingSchedulerViewProps) {
  const router = useRouter();
  const storageKey = "company_scheduled_meetings";

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(DEFAULT_MEETINGS);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("Khối Kỹ Thuật");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState("10:00");
  const [newDuration, setNewDuration] = useState("45");
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMeetings(JSON.parse(saved));
      }
    } catch (e) {
      // Ignored
    }
  }, []);

  const saveMeetings = (list: ScheduledMeeting[]) => {
    setMeetings(list);
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
      // Ignored
    }
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    sounds.playPop();
    const meeting: ScheduledMeeting = {
      id: `meet-${Date.now()}`,
      title: newTitle.trim(),
      channelName: newTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20),
      targetUrl: "/channels/@me",
      date: newDate,
      time: newTime,
      durationMinutes: parseInt(newDuration) || 45,
      host: currentUserName,
      department: newDepartment,
      isPrivate: newIsPrivate,
      pin: newIsPrivate ? newPin || "8888" : undefined,
      description: newDesc.trim() || "Cuộc họp làm việc và thảo luận công việc nội bộ."
    };

    saveMeetings([meeting, ...meetings]);
    setIsCreating(false);
    setNewTitle("");
    setNewDesc("");
    setNewPin("");
  };

  const handleDeleteMeeting = (id: string) => {
    sounds.playPop();
    const updated = meetings.filter((m) => m.id !== id);
    saveMeetings(updated);
  };

  const handleCopyLink = (m: ScheduledMeeting) => {
    const text = `[LỊCH HỌP CÔNG TY]\nCuộc họp: ${m.title}\nThời gian: ${m.time} ngày ${m.date} (${m.durationMinutes} phút)\nPhòng ban: ${m.department}\nChủ tọa: ${m.host}\n${m.isPrivate ? "🔒 Phòng họp bảo mật (Yêu cầu mã PIN)" : "Công khai nội bộ"}\nTham gia trực tiếp trên Hệ thống Họp Nội Bộ Công Ty.`;
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    sounds.playPop();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] text-zinc-200 overflow-y-auto select-none">
      {/* Top Header */}
      <div className="p-6 border-b border-zinc-800/80 bg-[#2b2d31]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-x-2.5">
            <CalendarCheck className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Lịch Họp & Sự Kiện Doanh Nghiệp</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tổng hợp các phiên họp giao ban, họp dự án và hội nghị bảo mật nội bộ công ty.
          </p>
        </div>

        <Button
          onClick={() => {
            sounds.playPop();
            setIsCreating(!isCreating);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 font-semibold flex items-center gap-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Hủy bỏ" : "Lên lịch cuộc họp mới"}</span>
        </Button>
      </div>

      <div className="p-6 max-w-5xl space-y-6">
        {/* Create Meeting Card (if toggled) */}
        {isCreating && (
          <div className="p-5 rounded-2xl bg-[#2b2d31] border border-indigo-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-700/60 pb-3">
              <div className="flex items-center gap-x-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm text-white">Thiết lập cuộc họp mới</h4>
              </div>
              <span className="text-[11px] text-zinc-400">Đăng ký vào hệ thống nội bộ</span>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase text-[10px] text-zinc-400 block mb-1">
                    Tiêu đề cuộc họp
                  </label>
                  <input
                    required
                    placeholder="Ví dụ: Họp Rà Soát Sprint 12, Họp Ban Kế Hoạch..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-[10px] text-zinc-400 block mb-1">
                    Khối phòng ban phụ trách
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Toàn công ty">Toàn bộ công ty (All Company)</option>
                    <option value="Khối Kỹ Thuật">Khối Kỹ Thuật & Công Nghệ</option>
                    <option value="Khối Marketing & Sales">Khối Marketing & Sales</option>
                    <option value="Ban Giám Đốc">Ban Giám Đốc & Lãnh Đạo</option>
                    <option value="Phòng Tài Chính Kế Toán">Phòng Tài Chính Kế Toán</option>
                    <option value="Phòng Nhân Sự HR">Phòng Nhân Sự HR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold uppercase text-[10px] text-zinc-400 block mb-1">
                    Ngày họp
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-zinc-400 block mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-zinc-400 block mb-1">
                    Thời lượng dự kiến
                  </label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="30">30 phút</option>
                    <option value="45">45 phút</option>
                    <option value="60">1 tiếng (60 phút)</option>
                    <option value="90">1.5 tiếng (90 phút)</option>
                    <option value="120">2 tiếng</option>
                  </select>
                </div>
              </div>

              {/* Private Meeting & PIN Option */}
              <div className="p-3 bg-[#1e1f22] rounded-xl border border-zinc-700/80 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Yêu cầu mã PIN bảo mật khi vào phòng</p>
                  <p className="text-[11px] text-zinc-400">
                    Chỉ những người có mã PIN mới có thể tham gia (Thích hợp cho cuộc họp kín)
                  </p>
                </div>
                <div className="flex items-center gap-x-3">
                  {newIsPrivate && (
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Mã PIN (VD: 8888)"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-28 bg-[#2b2d31] border border-zinc-600 rounded-lg px-2.5 py-1 text-xs text-white text-center font-mono"
                    />
                  )}
                  <input
                    type="checkbox"
                    checked={newIsPrivate}
                    onChange={(e) => setNewIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-zinc-400 block mb-1">
                  Mô tả / Mục tiêu cuộc họp
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú nội dung chính hoặc tài liệu cần chuẩn bị..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-x-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                  className="h-8 text-xs text-zinc-400"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Xác nhận lên lịch
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Scheduled Meetings List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold px-1">
            <span>DANH SÁCH CUỘC HỌP ĐÃ LÊN LỊCH ({meetings.length})</span>
            <span>Trạng thái tự động cập nhật</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {meetings.map((m) => {
              const isToday = m.date === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-[#2b2d31] border border-zinc-800 hover:border-zinc-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md group"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{m.title}</h4>
                      {isToday && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full animate-pulse">
                          Hôm nay
                        </span>
                      )}
                      {m.isPrivate && (
                        <span className="text-[10px] font-medium text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-x-1">
                          <Lock className="w-3 h-3" />
                          Có mã PIN ({m.pin || "8888"})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-1">{m.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <div className="flex items-center gap-x-1.5 text-indigo-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {m.time} • {m.durationMinutes} phút
                        </span>
                      </div>
                      <div className="flex items-center gap-x-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{m.date}</span>
                      </div>
                      <div className="flex items-center gap-x-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{m.department}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Chủ tọa: <span className="text-zinc-300">@{m.host}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-x-2 shrink-0 pt-2 md:pt-0">
                    <Button
                      size="sm"
                      onClick={() => handleCopyLink(m)}
                      variant="secondary"
                      className="h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          Đã chép link
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                          Mời họp
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        sounds.playPop();
                        router.push(m.targetUrl);
                      }}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-x-1.5 shadow"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Tham gia</span>
                    </Button>

                    <button
                      onClick={() => handleDeleteMeeting(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
