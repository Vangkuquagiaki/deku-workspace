"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bell,
  Send,
  User,
  Shield,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  Check,
  ChevronRight,
  Pin,
  Trash2,
  Lock,
  Mail,
  UserPlus,
  Copy,
  Users,
  Building,
  CheckCircle,
  XCircle,
  Eye,
  Megaphone,
  Share2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

type SubTab = "briefing" | "ai_assistant" | "announcements" | "invite_gate";

export function PersonalWorkspaceView() {
  const { user } = useUser();
  const [subTab, setSubTab] = useState<SubTab>("briefing");
  const [loading, setLoading] = useState(true);

  // Today Briefing Data
  const [briefing, setBriefing] = useState<any>(null);

  // AI Assistant Chat State (ChatGPT Grade)
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<
    { sender: "user" | "ai"; text: string; sources?: any[] }[]
  >([
    {
      sender: "ai",
      text: `Xin chào **${user?.fullName || "bạn"}**! Tôi là **Trợ lý AI Doanh nghiệp Deku** của bạn.\n\nTôi đã đồng bộ toàn bộ cơ sở dữ liệu về lịch trình, nhiệm vụ được giao và chỉ thị doanh nghiệp của bạn.\n\n**Bạn có thể tương tác với tôi như ChatGPT:**\n- ⚡ **Giao việc:** Gõ *"Giao việc cho [Tên]: [Nhiệm vụ]"* để AI tự động tạo task và đẩy vào AI của đồng nghiệp.\n- 📝 **Ghi chú riêng:** Gõ *"Ghi chú lại: [Nội dung]"* để lưu vào sổ tay mã hóa.\n- ✍️ **Soạn thảo:** Yêu cầu soạn email, báo cáo tuần, dự thảo thông báo hoặc lập kế hoạch dự án.\n- 🔍 **Tra cứu:** Hỏi về lịch họp hôm nay, việc cần làm khẩn cấp hoặc quy chế công ty!`,
      sources: [
        { type: "Lõi Trợ lý AI", title: "Deku Enterprise Assistant" },
        { type: "Bối cảnh nhân sự", title: user?.fullName || "Thành viên" },
      ],
    },
  ]);

  // Announcements Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementFilter, setAnnouncementFilter] = useState<string>("ALL");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [ackLoading, setAckLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Announcement Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<"INFORMATION" | "IMPORTANT" | "MANDATORY" | "EMERGENCY">("MANDATORY");
  const [newScope, setNewScope] = useState<"COMPANY_WIDE" | "DEPARTMENT" | "MANAGERS_ONLY">("COMPANY_WIDE");
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Private Notes
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Invitations Data
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteDept, setInviteDept] = useState("Kỹ thuật");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, notiRes, notesRes, invRes] = await Promise.all([
        fetch("/api/personal/today"),
        fetch("/api/announcements"),
        fetch("/api/personal/notes"),
        fetch("/api/invitations"),
      ]);

      if (todayRes.ok) {
        const data = await todayRes.json();
        setBriefing(data);
      }
      if (notiRes.ok) {
        const notiData = await notiRes.json();
        setAnnouncements(notiData);
      }
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvitations(invData);
      }
    } catch (e) {
      console.error("[WORKSPACE_FETCH_ERROR]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle AI Chat
  const handleSendAi = async (textToSend?: string) => {
    const q = (textToSend || aiQuery).trim();
    if (!q || aiLoading) return;

    setChatHistory((prev) => [...prev, { sender: "user", text: q }]);
    if (!textToSend) setAiQuery("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/personal/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.answer,
            sources: data.sources,
          },
        ]);
        // Auto-refresh briefing if an action was executed (e.g. task or note created)
        if (q.toLowerCase().includes("giao việc") || q.toLowerCase().includes("ghi chú")) {
          fetchData();
        }
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Xin lỗi, đã xảy ra sự cố khi truy vấn trợ lý cá nhân. Vui lòng thử lại sau.",
          },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra kết nối mạng.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle Acknowledge Announcement
  const handleAcknowledge = async (campaignId: string) => {
    setAckLoading(true);
    try {
      const res = await fetch(`/api/announcements/${campaignId}/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        showToast("✅ Đã ký nhận chỉ thị thành công! Dấu vết thời gian đã được lưu vào hệ thống kiểm toán.");
        fetchData();
        if (selectedAnnouncement && selectedAnnouncement.id === campaignId) {
          setSelectedAnnouncement((prev: any) => ({
            ...prev,
            acknowledgments: [{ id: "temp", ackAt: new Date().toISOString() }],
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAckLoading(false);
    }
  };

  // Handle Create Announcement Campaign (Auto-Publish immediately to Bulletin & Acks)
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          summary: newSummary || newTitle,
          content: newContent,
          priority: newPriority,
          targetScope: newScope,
          requireAck: true,
          status: "PUBLISHED", // Immediately broadcast
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewSummary("");
        setNewContent("");
        showToast("📢 Đã phát hành chỉ thị thành công! Thông báo đã được đẩy đến toàn bộ nhân sự và Bảng tin doanh nghiệp.");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingCampaign(false);
    }
  };

  // Handle Create Private Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    try {
      const res = await fetch("/api/personal/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNoteTitle,
          content: newNoteContent,
        }),
      });
      if (res.ok) {
        setNewNoteTitle("");
        setNewNoteContent("");
        showToast("📝 Đã lưu ghi chú vào sổ tay riêng tư.");
        const nData = await (await fetch("/api/personal/notes")).json();
        setNotes(nData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Delete Private Note
  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`/api/personal/notes?id=${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showToast("Đã xóa ghi chú.");
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Invitation Token
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setCreatingInvite(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          fullName: inviteFullName || inviteEmail.split("@")[0],
          department: inviteDept,
          role: inviteRole,
        }),
      });
      if (res.ok) {
        setInviteEmail("");
        setInviteFullName("");
        showToast("🎉 Đã tạo mã lời mời an toàn! Hãy sao chép liên kết bên dưới gửi cho nhân sự mới.");
        const iData = await (await fetch("/api/invitations")).json();
        setInvitations(iData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    showToast("📋 Đã sao chép liên kết mời nhân sự mới vào bộ nhớ tạm!");
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const copyAiAnswer = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Clean data bindings
  const displayName = briefing?.userName || briefing?.employee?.name || user?.fullName || "Thành viên";
  const displaySummary = briefing?.summaryText || briefing?.briefingText || "Chào mừng bạn đến với Deku Workspace. Dữ liệu công việc của bạn đã được sẵn sàng.";
  const countMeetings = briefing?.todayMeetings ?? briefing?.stats?.todayMeetings ?? (briefing?.meetings?.length || 0);
  const countTasks = briefing?.pendingTasks ?? briefing?.stats?.pendingTasks ?? (briefing?.urgentTasks?.length || 0);
  const countPendingAcks = briefing?.pendingAcksCount ?? briefing?.stats?.pendingAcks ?? (briefing?.pendingAcks?.length || 0);
  const scheduleList = Array.isArray(briefing?.scheduleTimeline)
    ? briefing.scheduleTimeline
    : Array.isArray(briefing?.schedule)
    ? briefing.schedule
    : [];
  const urgentTaskList = Array.isArray(briefing?.urgentTasks)
    ? briefing.urgentTasks
    : Array.isArray(briefing?.schedule)
    ? briefing.schedule.filter((s: any) => s.type === "TASK")
    : [];
  const pendingAckList = Array.isArray(briefing?.pendingAcks)
    ? briefing.pendingAcks
    : Array.isArray(briefing?.announcements)
    ? briefing.announcements.filter((a: any) => a.requiresAck && !a.hasAcked)
    : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-zinc-100 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1e1f22] border border-emerald-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-header navigation bar */}
      <div className="h-14 px-4 md:px-6 bg-[#1e1f22] border-b border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSubTab("briefing")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap",
              subTab === "briefing"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Hôm nay của tôi</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("ai_assistant")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap",
              subTab === "ai_assistant"
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trợ lý AI Cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("announcements")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap relative",
              subTab === "announcements"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Chỉ thị & Thông báo</span>
            {countPendingAcks > 0 && (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("invite_gate")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap",
              subTab === "invite_gate"
                ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Cấp quyền & Lời mời</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
          title="Làm mới toàn bộ dữ liệu"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-emerald-400")} />
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* ================= TAB 1: HÔM NAY CỦA TÔI ================= */}
        {subTab === "briefing" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Morning Greeting & AI Digest Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-[#1e1f22] border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Morning Briefing (AI-NOTI-01)</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    Chào buổi sáng, {displayName}!
                  </h2>
                  <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
                    {displaySummary}
                  </p>
                </div>

                {/* Quick Status Pill */}
                <div className="flex items-center gap-3">
                  <div className="bg-[#2b2d31]/80 backdrop-blur border border-white/5 px-4 py-3 rounded-2xl text-center min-w-[85px]">
                    <span className="text-xs text-zinc-400 block font-medium">Cuộc họp</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {countMeetings}
                    </span>
                  </div>
                  <div className="bg-[#2b2d31]/80 backdrop-blur border border-white/5 px-4 py-3 rounded-2xl text-center min-w-[85px]">
                    <span className="text-xs text-zinc-400 block font-medium">Việc đến hạn</span>
                    <span className="text-lg font-bold text-amber-400">
                      {countTasks}
                    </span>
                  </div>
                  <div className="bg-[#2b2d31]/80 backdrop-blur border border-white/5 px-4 py-3 rounded-2xl text-center min-w-[85px]">
                    <span className="text-xs text-zinc-400 block font-medium">Chỉ thị cần ký</span>
                    <span className="text-lg font-bold text-rose-400">
                      {countPendingAcks}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Action Required Banner (if any pending Acks) */}
            {pendingAckList.length > 0 && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 md:p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-200">
                      Bạn có {pendingAckList.length} Chỉ thị Bắt buộc cần ký nhận xác nhận
                    </h3>
                    <p className="text-xs text-rose-300/80 mt-1">
                      {pendingAckList[0]?.title} - Yêu cầu toàn thể nhân sự xác nhận theo quy chế quản trị nội bộ.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnnouncement(pendingAckList[0]);
                    setSubTab("announcements");
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition whitespace-nowrap shadow-md shadow-rose-600/20"
                >
                  Xem & Ký nhận
                </button>
              </div>
            )}

            {/* Two-Column Grid: Schedule & Private Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Today Timeline & Action Items */}
              <div className="lg:col-span-7 space-y-6">
                {/* Schedule Timeline */}
                <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl p-5 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Lịch trình hôm nay ({scheduleList.length})
                      </h3>
                    </div>
                  </div>

                  {scheduleList.length > 0 ? (
                    <div className="space-y-3">
                      {scheduleList.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#2b2d31]/60 hover:bg-[#2b2d31] transition border border-white/5"
                        >
                          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                            {item.timeText || "Hôm nay"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-zinc-100 truncate">{item.title}</h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {item.type === "MEETING" ? "Cuộc họp trực tuyến WebRTC" : "Nhiệm vụ trong Bảng việc"}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            {item.type === "MEETING" ? "Cuộc họp" : "Nhiệm vụ"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500 text-xs">
                      Không có lịch họp hoặc sự kiện nào trong hôm nay.
                    </div>
                  )}
                </div>

                {/* Urgent Tasks */}
                <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl p-5 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Nhiệm vụ cần ưu tiên ({urgentTaskList.length})
                      </h3>
                    </div>
                  </div>

                  {urgentTaskList.length > 0 ? (
                    <div className="space-y-2.5">
                      {urgentTaskList.map((t: any) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[#2b2d31]/60 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <div>
                              <h4 className="text-xs font-semibold text-zinc-100">{t.title}</h4>
                              <span className="text-[10px] text-zinc-400">Trạng thái: {t.status || "Đang mở"}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            {t.priority || "MEDIUM"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-xs">
                      Không có nhiệm vụ khẩn cấp nào cần xử lý.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Private Personal Notes (AI-NOTI-13) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl p-5 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Sổ tay cá nhân riêng tư
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Mã hóa riêng tư</span>
                  </div>

                  {/* Add note form */}
                  <form onSubmit={handleCreateNote} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Tiêu đề ghi chú..."
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full h-8 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nội dung tóm tắt..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="flex-1 h-8 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!newNoteTitle.trim()}
                        className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition shrink-0"
                      >
                        Thêm
                      </button>
                    </div>
                  </form>

                  {/* Notes list */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-2xl bg-[#2b2d31]/80 border border-white/5 group hover:border-zinc-700 transition relative"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-bold text-zinc-100">{note.title}</h4>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition"
                            title="Xóa ghi chú"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {note.content && (
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-3 leading-relaxed">
                            {note.content}
                          </p>
                        )}
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div className="text-center py-8 text-zinc-500 text-xs">
                        Chưa có ghi chú nào. Chỉ bạn mới có thể xem các ghi chú này.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: TRỢ LÝ AI CÁ NHÂN (CHATGPT GRADE) ================= */}
        {subTab === "ai_assistant" && (
          <div className="max-w-4xl mx-auto flex flex-col h-full space-y-4">
            {/* Header info card */}
            <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl p-5 flex items-center justify-between shrink-0 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Trợ lý AI Doanh nghiệp Deku (ChatGPT-Grade)
                    <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Zero-Trust
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Trợ lý đàm thoại thông minh: Giao việc tự động, soạn thảo văn bản, phân tích lịch trình và trả lời mọi câu hỏi.
                  </p>
                </div>
              </div>

              {/* Action shortcut chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSendAi("Giao việc cho Ngô Anh Thảo: Hoàn thiện báo cáo tài chính quý 4 hạn chót ngày mai")}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-[11px] font-semibold transition"
                >
                  ⚡ Giao việc qua AI
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAi("Soạn giúp tôi một email thông báo nghỉ lễ 30/4 cho toàn thể nhân sự")}
                  className="px-2.5 py-1 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white text-[11px] font-semibold transition"
                >
                  ✍️ Soạn email mẫu
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAi("Hôm nay tôi có cuộc họp hoặc nhiệm vụ nào cần làm gấp không?")}
                  className="px-2.5 py-1 rounded-xl bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] transition"
                >
                  📅 Việc hôm nay?
                </button>
              </div>
            </div>

            {/* Chat Messages Stage */}
            <div className="flex-1 bg-[#1e1f22] border border-zinc-800 rounded-3xl p-5 overflow-y-auto space-y-4 min-h-[440px]">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 text-white"
                    )}
                  >
                    {msg.sender === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>

                  <div
                    className={cn(
                      "p-4 rounded-2xl text-xs leading-relaxed space-y-2 group relative",
                      msg.sender === "user"
                        ? "bg-emerald-600/20 text-white border border-emerald-500/30"
                        : "bg-[#2b2d31] text-zinc-100 border border-white/5"
                    )}
                  >
                    <div className="whitespace-pre-line prose prose-invert prose-xs max-w-none">
                      {msg.text}
                    </div>

                    {/* Sources citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-zinc-400 font-semibold">Căn cứ trích xuất:</span>
                        {msg.sources.map((src: any, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-indigo-500/20"
                          >
                            {src.type || "Nguồn"}: {src.title || src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Copy Button for Assistant answers */}
                    {msg.sender === "ai" && (
                      <button
                        type="button"
                        onClick={() => copyAiAnswer(msg.text, idx)}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                        title="Sao chép câu trả lời"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#2b2d31] text-zinc-400 text-xs border border-white/5 flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span>Trợ lý AI đang suy nghĩ và đồng bộ với cơ sở dữ liệu...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAi();
              }}
              className="flex items-center gap-2 bg-[#1e1f22] border border-zinc-800 p-2 rounded-2xl shrink-0"
            >
              <input
                type="text"
                placeholder="Hỏi AI bất kỳ điều gì, hoặc gõ: 'Giao việc cho [Tên]: [Nhiệm vụ]', 'Soạn email...'"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || aiLoading}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0"
              >
                <span>Gửi</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 3: CHỈ THỊ & THÔNG BÁO DOANH NGHIỆP ================= */}
        {subTab === "announcements" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header with Filter & Create Button */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-amber-400" />
                  <span>Trung tâm Chỉ thị & Thông báo Doanh nghiệp</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Phát hành tự động đến Bảng tin công ty và xuất hiện trên màn hình Hôm nay của toàn thể nhân sự.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Phát hành chỉ thị mới</span>
                </button>
              </div>
            </div>

            {/* Priority Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "ALL", label: "Tất cả" },
                { key: "EMERGENCY", label: "🚨 Khẩn cấp", color: "text-rose-400" },
                { key: "MANDATORY", label: "⚠️ Bắt buộc ký nhận", color: "text-amber-400" },
                { key: "IMPORTANT", label: "⭐ Quan trọng", color: "text-indigo-400" },
                { key: "INFORMATION", label: "ℹ️ Thông tin chung", color: "text-zinc-400" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setAnnouncementFilter(f.key)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-semibold transition border",
                    announcementFilter === f.key
                      ? "bg-[#2b2d31] border-zinc-600 text-white"
                      : "border-transparent text-zinc-400 hover:text-white"
                  )}
                >
                  <span className={f.color}>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements
                .filter((a) => announcementFilter === "ALL" || a.priority === announcementFilter)
                .map((a) => {
                  const hasAcked = a.acks && a.acks.length > 0;
                  return (
                    <div
                      key={a.id}
                      className="bg-[#1e1f22] border border-zinc-800 rounded-3xl p-5 hover:border-zinc-700 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              a.priority === "EMERGENCY" && "bg-rose-500/20 text-rose-300 border-rose-500/40",
                              a.priority === "MANDATORY" && "bg-amber-500/20 text-amber-300 border-amber-500/40",
                              a.priority === "IMPORTANT" && "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
                              a.priority === "INFORMATION" && "bg-zinc-800 text-zinc-400 border-zinc-700"
                            )}
                          >
                            {a.priority}
                          </span>

                          <span className="text-[10px] text-zinc-500 font-mono">
                            v{a.version} • {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white line-clamp-2">{a.title}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                          {a.body || a.summary || a.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                        <div className="text-[11px] text-zinc-400">
                          Người phát: <span className="font-semibold text-zinc-200">{a.authorName}</span>
                        </div>

                        {a.requiresAck && (
                          <div>
                            {hasAcked ? (
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" />
                                <span>Đã ký nhận</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={ackLoading}
                                onClick={() => handleAcknowledge(a.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                              >
                                <span>Ký nhận chỉ thị</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              {announcements.length === 0 && (
                <div className="col-span-2 text-center py-12 text-zinc-500 text-xs">
                  Chưa có thông báo nào. Bấm nút &quot;Phát hành chỉ thị mới&quot; để tạo thông báo đầu tiên.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: CẤP QUYỀN & LỜI MỜI (INVITE-ONLY) ================= */}
        {subTab === "invite_gate" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Cổng Cấp Quyền & Lời Mời Nhân Sự Mới (Invite-Only Gatekeeper)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Nguyên tắc Zero-Trust: Chỉ tài khoản sở hữu token lời mời do HR/Admin tạo mới được kích hoạt vào cơ sở dữ liệu công ty.
                  </p>
                </div>
              </div>

              {/* Create Invite Form */}
              <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
                <div className="sm:col-span-4">
                  <input
                    type="email"
                    placeholder="Email công ty (*@congty.com)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Họ và tên nhân sự"
                    value={inviteFullName}
                    onChange={(e) => setInviteFullName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Kỹ thuật">Phòng Kỹ thuật</option>
                    <option value="Nhân sự">Phòng Nhân sự</option>
                    <option value="Kinh doanh">Phòng Kinh doanh</option>
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={creatingInvite || !inviteEmail.trim()}
                    className="w-full h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Cấp mã mời</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active Invitations Table */}
            <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl p-5 md:p-6 space-y-4">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Danh sách liên kết lời mời đã cấp ({invitations.length})
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#2b2d31]/80 text-[11px] font-bold text-zinc-400 uppercase border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Email & Họ tên</th>
                      <th className="px-4 py-3">Phòng ban</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Hạn kích hoạt</th>
                      <th className="px-4 py-3 rounded-r-xl text-right">Liên kết kích hoạt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#2b2d31]/40 transition">
                        <td className="px-4 py-3 font-medium text-white">
                          <div>{inv.fullName || inv.email.split("@")[0]}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{inv.email}</div>
                        </td>
                        <td className="px-4 py-3">{inv.orgUnitName || inv.department || "Toàn công ty"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              inv.status === "PENDING" && "bg-amber-500/20 text-amber-300 border-amber-500/30",
                              inv.status === "ACCEPTED" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                              inv.status === "EXPIRED" && "bg-zinc-800 text-zinc-400 border-zinc-700"
                            )}
                          >
                            {inv.status === "PENDING" ? "Chờ kích hoạt" : inv.status === "ACCEPTED" ? "Đã kích hoạt" : "Hết hạn"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString("vi-VN") : "7 ngày"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(inv.token || inv.tokenHash)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 transition inline-flex items-center gap-1.5 font-semibold text-xs shadow-sm"
                          >
                            {copiedToken === (inv.token || inv.tokenHash) ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Đã sao chép!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="h-3.5 w-3.5" />
                                <span>Sao chép link mời</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {invitations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-zinc-500">
                          Chưa có mã lời mời nào được khởi tạo. Hãy điền form bên trên để tạo liên kết mời đầu tiên.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Announcement Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-400" />
              <span>Phát hành Chỉ thị / Thông báo Mới</span>
            </h3>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Tiêu đề chỉ thị (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chỉ thị tuân thủ an toàn thông tin & Ký nhận chính sách"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Mức độ ưu tiên</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white focus:outline-none"
                  >
                    <option value="MANDATORY">⚠️ Bắt buộc ký nhận</option>
                    <option value="EMERGENCY">🚨 Khẩn cấp</option>
                    <option value="IMPORTANT">⭐ Quan trọng</option>
                    <option value="INFORMATION">ℹ️ Thông tin chung</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Phạm vi áp dụng</label>
                  <select
                    value={newScope}
                    onChange={(e: any) => setNewScope(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white focus:outline-none"
                  >
                    <option value="COMPANY_WIDE">Toàn công ty</option>
                    <option value="MANAGERS_ONLY">Chỉ cấp Quản lý</option>
                    <option value="DEPARTMENT">Theo phòng ban</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nội dung chi tiết (*)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ghi rõ các điều khoản hoặc yêu cầu hành động bắt buộc..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#2b2d31] border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>Phát hành & Đẩy thông báo ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
