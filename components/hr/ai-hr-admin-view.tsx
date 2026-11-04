"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Upload,
  RefreshCw,
  UserX,
  UserPlus,
  ArrowRightLeft,
  Lock,
  FileText,
  Clock,
  Layers,
  Check,
  X,
  ChevronRight,
  Database,
  Radio,
  Briefcase,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

interface AiAdminRequestItem {
  id: string;
  actorName: string;
  intent: string;
  riskLevel: string;
  state: string;
  targetEmployeeCode?: string;
  targetName?: string;
  diffJson?: any;
  executionReport?: any;
  approverId?: string;
  approvalNote?: string;
  createdAt: string;
}

export function AiHrAdminView() {
  const [activeTab, setActiveTab] = useState<"assistant" | "reconcile" | "history">("assistant");
  const [command, setCommand] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<AiAdminRequestItem | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [approvalNote, setApprovalNote] = useState("Phê duyệt thực thi theo chính sách nhân sự");

  // Reconcile state
  const [reconcileReport, setReconcileReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  // History state
  const [historyRequests, setHistoryRequests] = useState<AiAdminRequestItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Quick Action Command Presets
  const quickActions = [
    {
      label: "🛑 Nghỉ việc E0317 ngay",
      cmd: "Nhân viên E0317 nghỉ việc hiệu lực ngay, thu hồi toàn bộ quyền và bàn giao công việc.",
    },
    {
      label: "👤 Thêm E1281 (Trần Minh An)",
      cmd: "Thêm nhân viên E1281 - Trần Minh An, phòng Kế toán, tổ Kế toán tổng hợp, email an.tran@congty.com.",
    },
    {
      label: "🔄 Điều chuyển E010 sang Backend",
      cmd: "Điều chuyển nhân viên E010 sang Khối Kỹ thuật - Tổ Backend.",
    },
    {
      label: "🔒 Khóa khẩn cấp E022",
      cmd: "Tạm khóa khẩn cấp tài khoản nhân viên E022 và ngắt kết nối voice.",
    },
    {
      label: "🔍 Đối soát quyền mồ côi",
      cmd: "Thực hiện đối soát và rà soát quyền mồ côi toàn bộ hệ thống.",
    },
  ];

  // Fetch history
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/ai-admin/requests");
      if (res.ok) {
        const data = await res.json();
        setHistoryRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Run Reconcile Scan
  const runReconcileScan = async () => {
    try {
      setIsScanning(true);
      const res = await fetch("/api/ai-admin/reconcile");
      if (res.ok) {
        const data = await res.json();
        setReconcileReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  // Fix Orphaned Access
  const handleFixOrphaned = async () => {
    try {
      setIsFixing(true);
      const res = await fetch("/api/ai-admin/reconcile", { method: "POST" });
      if (res.ok) {
        sounds.playPop();
        await runReconcileScan();
        alert("Đã tự động thu hồi toàn bộ quyền mồ côi và bàn giao nhiệm vụ tồn đọng!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFixing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reconcile") {
      runReconcileScan();
    } else if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  // Submit Planning Command
  const handlePlanCommand = async (e?: React.FormEvent, customCmd?: string) => {
    if (e) e.preventDefault();
    const cmdToRun = customCmd || command;
    if (!cmdToRun.trim() || isPlanning) return;

    try {
      setIsPlanning(true);
      sounds.playJoinVoice();
      const res = await fetch("/api/ai-admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmdToRun }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data);
        setCommand("");
      } else {
        alert("Không thể phân tích yêu cầu. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlanning(false);
    }
  };

  // Approve & Execute Request
  const handleApprove = async () => {
    if (!currentPlan || isExecuting) return;

    try {
      setIsExecuting(true);
      const res = await fetch(`/api/ai-admin/requests/${currentPlan.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: approvalNote }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentPlan(updated);
        sounds.playPop();
      } else {
        alert("Thực thi thất bại. Vui lòng kiểm tra báo cáo lỗi.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Cancel Request
  const handleCancel = async () => {
    if (!currentPlan) return;
    try {
      await fetch(`/api/ai-admin/requests/${currentPlan.id}/cancel`, {
        method: "POST",
      });
      setCurrentPlan(null);
    } catch (e) {
      console.error(e);
    }
  };

  const diff = currentPlan?.diffJson;
  const report = currentPlan?.executionReport;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* 1. Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950/70 via-[#1e1f22] to-indigo-950/50 border border-emerald-500/30 p-5 md:p-6 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              <span>Deku AI HR Administrator · V1.0 Kiến Trúc Tự Động</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Trợ Lý AI Quản Trị Nhân Sự & Điều Phối Quyền</span>
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              Tự động hóa toàn diện chu trình Onboarding, Offboarding, Điều chuyển tổ và Bàn giao công việc trên HRM, Discord Channels, LiveKit Voice và Threads theo tiêu chuẩn Luật Bảo vệ Dữ Liệu Cá Nhân 91/2025/QH15.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("assistant")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                activeTab === "assistant"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-[#2b2d31] text-zinc-400 hover:text-white"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ra Lệnh AI</span>
            </button>
            <button
              onClick={() => setActiveTab("reconcile")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                activeTab === "reconcile"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-[#2b2d31] text-zinc-400 hover:text-white"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Đối Soát Quyền</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5",
                activeTab === "history"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-[#2b2d31] text-zinc-400 hover:text-white"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Nhật Ký</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: AI ASSISTANT & PLANNING */}
      {activeTab === "assistant" && (
        <div className="space-y-6">
          {/* Quick Action Presets */}
          <div className="bg-[#1e1f22] p-4 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Kịch bản lệnh mẫu đã kiểm thử (Quick Action Presets)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCommand(qa.cmd);
                    handlePlanCommand(undefined, qa.cmd);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#2b2d31] hover:bg-emerald-600/20 hover:border-emerald-500/40 text-xs font-medium text-zinc-200 border border-zinc-700/60 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Natural Language Command Bar */}
          <form
            onSubmit={(e) => handlePlanCommand(e)}
            className="bg-[#1e1f22] p-4 rounded-2xl border border-zinc-800 shadow-md space-y-3"
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Nhập yêu cầu quản trị nhân sự... (Ví dụ: 'Nhân viên E0317 nghỉ việc hiệu lực ngay', 'Thêm nhân viên E1281 phòng Kế toán'...)"
                className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={!command.trim() || isPlanning}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 transition shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isPlanning ? "Đang lập kế hoạch..." : "Phân Tích AI"}</span>
              </button>
            </div>
          </form>

          {/* PLAN PREVIEW & IMPACT DIFF CARD */}
          {currentPlan && diff && (
            <div className="bg-[#1e1f22] rounded-3xl border border-emerald-500/40 p-5 md:p-6 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-300">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      MÃ YÊU CẦU: #{currentPlan.id.substring(0, 8)}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        currentPlan.riskLevel === "L3"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : currentPlan.riskLevel === "L2"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                      )}
                    >
                      MỨC RỦI RO: {currentPlan.riskLevel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Ý ĐỊNH: {currentPlan.intent}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white">
                    {diff.summary}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-zinc-300">
                    Trạng thái:{" "}
                    <span
                      className={cn(
                        "font-bold",
                        currentPlan.state === "COMPLETED"
                          ? "text-emerald-400"
                          : currentPlan.state === "EXECUTING"
                          ? "text-indigo-400 animate-pulse"
                          : "text-amber-400"
                      )}
                    >
                      {currentPlan.state}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Người yêu cầu: {currentPlan.actorName}
                  </div>
                </div>
              </div>

              {/* Impact Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. HRM */}
                <div className="p-3.5 rounded-2xl bg-[#2b2d31]/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Briefcase className="h-4 w-4" />
                    <span>1. Hồ sơ HRM</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Mã nhân viên: <strong className="text-white">{diff.targetEmployeeCode}</strong>
                  </p>
                  <p className="text-xs text-zinc-300">
                    Họ và tên: <strong className="text-white">{diff.targetName}</strong>
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Đơn vị: {diff.currentDepartment} {diff.newDepartment && `➔ ${diff.newDepartment}`}
                  </p>
                </div>

                {/* 2. Auth & Session */}
                <div className="p-3.5 rounded-2xl bg-[#2b2d31]/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Lock className="h-4 w-4" />
                    <span>2. Tài khoản & Đăng nhập</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Hành động:{" "}
                    <span className="font-bold text-white">
                      {diff.accountAction === "REVOKE_LOGIN"
                        ? "Thu hồi & Vô hiệu hóa ngay"
                        : diff.accountAction === "CREATE_INVITE"
                        ? "Khởi tạo lời mời nhận việc"
                        : diff.accountAction === "SUSPEND"
                        ? "Tạm khóa đăng nhập"
                        : "Không thay đổi"}
                    </span>
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Ngắt phiên Refresh Token & WebSocket
                  </p>
                </div>

                {/* 3. Channels & Chat */}
                <div className="p-3.5 rounded-2xl bg-[#2b2d31]/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <Users className="h-4 w-4" />
                    <span>3. Kênh Chat & Tổ</span>
                  </div>
                  {diff.channelsToRevoke.length > 0 && (
                    <div className="text-[11px] text-rose-300">
                      Thu hồi: {diff.channelsToRevoke.join(", ")}
                    </div>
                  )}
                  {diff.channelsToAssign.length > 0 && (
                    <div className="text-[11px] text-emerald-300">
                      Cấp mới: {diff.channelsToAssign.join(", ")}
                    </div>
                  )}
                  {diff.channelsToRevoke.length === 0 && diff.channelsToAssign.length === 0 && (
                    <p className="text-[11px] text-zinc-400">Không tác động quyền kênh</p>
                  )}
                </div>

                {/* 4. LiveKit Voice */}
                <div className="p-3.5 rounded-2xl bg-[#2b2d31]/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Radio className="h-4 w-4" />
                    <span>4. LiveKit Voice / Video</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Phiên thoại tác động:{" "}
                    <strong className="text-white">
                      {diff.voiceSessionsToDisconnect > 0 ? "Ngắt kết nối ngay" : "0 phòng"}
                    </strong>
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Chặn quyền tái gia nhập phòng họp
                  </p>
                </div>

                {/* 5. Tasks Handover */}
                <div className="p-3.5 rounded-2xl bg-[#2b2d31]/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
                    <FileText className="h-4 w-4" />
                    <span>5. Bàn giao công việc</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Số task cần bàn giao:{" "}
                    <strong className="text-white">{diff.openTasksToReassign.length} nhiệm vụ</strong>
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Bàn giao cho: {diff.newAssigneeName || "Quản lý tổ"}
                  </p>
                </div>

                {/* 6. Legal & Compliance */}
                <div className="p-3.5 rounded-2xl bg-[#2b2d31]/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                    <Shield className="h-4 w-4" />
                    <span>6. Luật 91/2025/QH15 & NĐ 356</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 line-clamp-2">
                    {diff.complianceNotes}
                  </p>
                </div>
              </div>

              {/* Execution Progress Report (if executed) */}
              {report && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Tiến độ thực thi đa phân hệ (Multi-System Saga Execution)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#2b2d31] flex items-center justify-between">
                      <span className="text-zinc-300">HRM Lifecycle:</span>
                      <span className="font-bold text-emerald-400">{report.hrm.status}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#2b2d31] flex items-center justify-between">
                      <span className="text-zinc-300">Auth Token Revocation:</span>
                      <span className="font-bold text-emerald-400">{report.auth.status}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#2b2d31] flex items-center justify-between">
                      <span className="text-zinc-300">LiveKit Voice Drop:</span>
                      <span className="font-bold text-emerald-400">{report.voice.status}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#2b2d31] flex items-center justify-between">
                      <span className="text-zinc-300">Channels & Chat:</span>
                      <span className="font-bold text-emerald-400">{report.channels.status}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#2b2d31] flex items-center justify-between">
                      <span className="text-zinc-300">Task Handover:</span>
                      <span className="font-bold text-emerald-400">{report.tasks.status}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#2b2d31] flex items-center justify-between">
                      <span className="text-zinc-300">Audit Trail Log:</span>
                      <span className="font-bold text-emerald-400">{report.audit.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Actions Bar */}
              {currentPlan.state === "PREVIEWED" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <input
                      type="text"
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="Ghi chú phê duyệt của Quản lý / HR..."
                      className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-[#2b2d31] hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isExecuting}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{isExecuting ? "Đang thực thi saga..." : "Phê Duyệt & Thực Thi Ngay"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACCESS RECONCILIATION */}
      {activeTab === "reconcile" && (
        <div className="bg-[#1e1f22] p-5 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>Đối Soát Quyền Mồ Côi Toàn Doanh Nghiệp (AIHR-12)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Tự động quét và phát hiện các nhân viên đã thôi việc hoặc tạm khóa nhưng vẫn còn là thành viên kênh chat, nhóm tổ hoặc còn task mở.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={runReconcileScan}
                disabled={isScanning}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2b2d31] hover:bg-zinc-700 text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isScanning && "animate-spin")} />
                <span>Quét lại</span>
              </button>
              {reconcileReport && reconcileReport.orphanedCount > 0 && (
                <button
                  type="button"
                  onClick={handleFixOrphaned}
                  disabled={isFixing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{isFixing ? "Đang thu hồi..." : "Thu Hồi Toàn Bộ Quyền Tồn Đọng"}</span>
                </button>
              )}
            </div>
          </div>

          {isScanning ? (
            <div className="py-12 text-center text-xs text-zinc-400 space-y-2">
              <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin mx-auto" />
              <p>Đang quét đối soát toàn bộ cơ sở dữ liệu nhân sự và phân quyền...</p>
            </div>
          ) : reconcileReport?.orphanedCount === 0 ? (
            <div className="py-12 text-center bg-black/20 rounded-2xl border border-white/5 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Hệ thống đồng bộ 100%</p>
              <p className="text-xs text-zinc-400">
                Không phát hiện bất kỳ quyền mồ côi nào từ nhân viên đã thôi việc hoặc tạm khóa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-amber-300 font-semibold">
                Phát hiện {reconcileReport?.orphanedCount} tài khoản còn quyền tồn đọng:
              </div>
              <div className="space-y-2">
                {reconcileReport?.findings?.map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#2b2d31] border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{f.name}</span>
                        <span className="text-[10px] text-zinc-400">({f.employeeCode})</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {f.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Còn trong tổ: {f.orphanedUnits.join(", ") || "Không có"} · Nhiệm vụ chưa xong: {f.pendingTasks.length} task
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFixOrphaned}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition"
                    >
                      Thu hồi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY */}
      {activeTab === "history" && (
        <div className="bg-[#1e1f22] p-5 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Nhật Ký Yêu Cầu Quản Trị AI (AIHR-15)</span>
            </h3>
            <button
              onClick={fetchHistory}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-[#2b2d31] transition"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingHistory && "animate-spin")} />
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-xs text-zinc-400">Đang tải nhật ký...</div>
          ) : historyRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">Chưa có yêu cầu quản trị AI nào được ghi nhận.</div>
          ) : (
            <div className="space-y-2.5">
              {historyRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-[#2b2d31] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">#{req.id.substring(0, 8)}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {req.intent}
                      </span>
                      <span className="text-zinc-400">Mục tiêu: {req.targetName || req.targetEmployeeCode || "Toàn công ty"}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Người đề xuất: {req.actorName} · {new Date(req.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold border",
                        req.state === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : req.state === "PREVIEWED"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}
                    >
                      {req.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

