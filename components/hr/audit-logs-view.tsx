"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  FileCheck,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = `/api/audit-logs?action=${selectedAction}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const actionLabels: Record<
    string,
    { label: string; color: string; icon: any }
  > = {
    PROFILE_SENSITIVE_VIEW: {
      label: "Truy cập lương & CCCD",
      color: "bg-rose-500/10 text-rose-300 border-rose-500/30",
      icon: Lock,
    },
    LEAVE_APPROVED: {
      label: "Phê duyệt nghỉ phép",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: CheckCircle2,
    },
    LEAVE_REJECTED: {
      label: "Từ chối nghỉ phép",
      color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      icon: AlertCircle,
    },
    LEAVE_REQUEST_SUBMITTED: {
      label: "Nộp đơn nghỉ phép",
      color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      icon: FileText,
    },
    EMPLOYEE_TRANSFERRED: {
      label: "Điều chuyển nhân sự",
      color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      icon: UserCheck,
    },
    EMPLOYEE_CREATED: {
      label: "Tiếp nhận nhân sự mới",
      color: "bg-blue-500/10 text-blue-300 border-blue-500/30",
      icon: UserCheck,
    },
    PROFILE_ATTENDANCE_VIEW: {
      label: "Xem công nhật bảo mật",
      color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      icon: Eye,
    },
    CONSENT_AGREED: {
      label: "Đồng thuận ghi âm (NĐ 13)",
      color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
      icon: ShieldCheck,
    },
    HR_IMPORT: {
      label: "Nhập dữ liệu CSV",
      color: "bg-zinc-800 text-zinc-300 border-zinc-700",
      icon: FileText,
    },
    TASK_CREATED_FROM_AI: {
      label: "AI tạo việc từ cuộc họp",
      color: "bg-teal-500/10 text-teal-300 border-teal-500/30",
      icon: Cpu,
    },
    ANNOUNCEMENT_PUBLISHED: {
      label: "Phát hành chỉ thị",
      color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      icon: Megaphone,
    },
    ANNOUNCEMENT_ACKNOWLEDGED: {
      label: "Ký nhận chỉ thị",
      color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      icon: CheckCircle2,
    },
    MEETING_CREATED_VIA_AI: {
      label: "AI tạo phòng họp",
      color: "bg-teal-500/10 text-teal-300 border-teal-500/30",
      icon: Cpu,
    },
    SECURITY_POLICY_UPDATE: {
      label: "Cập nhật chính sách bảo mật",
      color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      icon: ShieldAlert,
    },
  };

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchTarget = log.targetType?.toLowerCase().includes(q);
      const matchDetail = JSON.stringify(log.detail || {}).toLowerCase().includes(q);
      const matchId = log.id?.toLowerCase().includes(q);
      return matchAction || matchTarget || matchDetail || matchId;
    });
  }, [logs, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["ID", "ThoiGian", "HanhDong", "DoiTuong", "ActorID", "ChiTiet"];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.action,
      l.targetType || "",
      l.actorId || "",
      `"${JSON.stringify(l.detail || {}).replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kiem_toan_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header and Compliance Banner */}
      <div className="bg-[#1e1f22] p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Nhật Ký Kiểm Toán & Quản Trị Tuân Thủ (Audit & Compliance Log)
                  <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Bất biến (Immutable)
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Lưu vết toàn bộ truy cập hồ sơ nhạy cảm, phê duyệt nghỉ phép, giao việc AI và đồng thuận cuộc họp
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="h-9 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 border border-white/5"
            >
              <Download className="h-3.5 w-3.5 text-teal-400" />
              <span>Xuất CSV Báo Cáo</span>
            </button>

            <button
              onClick={fetchLogs}
              className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* 4 Compliance Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#2b2d31]/50 p-3 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Tổng bản ghi ghi vết</span>
            <div className="text-xl font-bold text-white font-mono">{logs.length}</div>
          </div>

          <div className="bg-[#2b2d31]/50 p-3 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Luật 91/2025/QH15</span>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> 100% Tuân thủ
            </div>
          </div>

          <div className="bg-[#2b2d31]/50 p-3 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Bảo mật Lark Base</span>
            <div className="text-sm font-bold text-sky-400">3-Tier Matrix</div>
          </div>

          <div className="bg-[#2b2d31]/50 p-3 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Cơ chế lưu vết</span>
            <div className="text-sm font-bold text-teal-300">Tự động thời gian thực</div>
          </div>
        </div>

        {/* Legal Compliance Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black/40 to-black/40 border border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-300">
          <FileCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Bảo vệ dữ liệu cá nhân & Kiểm toán độc lập:</strong> Hệ thống thực hiện kiểm soát phân quyền theo bản ghi (Record-Level) và mặt nạ trường nhạy cảm (Field-Level) theo đúng quy định tại <strong>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15</strong>, <strong>Nghị định 13/2023/NĐ-CP</strong> và <strong>Nghị định 356/2025/NĐ-CP</strong>.
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#1e1f22] p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1 mr-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-400" /> Hành động:
          </span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "ANNOUNCEMENT_PUBLISHED", label: "📢 Chỉ thị phát hành" },
            { id: "ANNOUNCEMENT_ACKNOWLEDGED", label: "✅ Ký nhận chỉ thị" },
            { id: "PROFILE_SENSITIVE_VIEW", label: "🔒 Lương & CCCD" },
            { id: "LEAVE_APPROVED", label: "Phê duyệt nghỉ" },
            { id: "CONSENT_AGREED", label: "Đồng thuận NĐ 13" },
            { id: "TASK_CREATED_FROM_AI", label: "AI tạo việc" },
            { id: "EMPLOYEE_TRANSFERRED", label: "Điều chuyển tổ" },
            { id: "PROFILE_ATTENDANCE_VIEW", label: "Xem công nhật" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedAction(btn.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border",
                selectedAction === btn.id
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                  : "bg-[#2b2d31] border-zinc-700/80 text-zinc-400 hover:text-white"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo người xem, đối tượng, log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-xs">Đang nạp nhật ký kiểm toán bất biến...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#1e1f22] border border-zinc-800 text-center text-xs text-zinc-500">
          Không tìm thấy nhật ký kiểm toán phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-3xl bg-[#1e1f22] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2b2d31]/90 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 select-none">
                <tr>
                  <th className="p-3.5 pl-6">Thời gian</th>
                  <th className="p-3.5">Hành động kiểm toán</th>
                  <th className="p-3.5">Đối tượng</th>
                  <th className="p-3.5 min-w-[280px]">Nội dung & Tuân thủ</th>
                  <th className="p-3.5 pr-6 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredLogs.map((log) => {
                  const actionMeta = actionLabels[log.action] || {
                    label: log.action,
                    color: "bg-zinc-800 text-zinc-300 border-zinc-700",
                    icon: ShieldCheck,
                  };
                  const Icon = actionMeta.icon;
                  const isExpanded = expandedRow === log.id;
                  const d = log.detail || {};

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-[#2b2d31]/50 transition group">
                        {/* Timestamp */}
                        <td className="p-3.5 pl-6 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        {/* Action Badge */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold leading-none",
                              actionMeta.color
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {actionMeta.label}
                          </span>
                        </td>

                        {/* Target Type & ID */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-semibold text-white">
                            {log.targetType || "HỆ THỐNG"}
                          </span>
                          {log.targetId && (
                            <span className="block text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">
                              {log.targetId}
                            </span>
                          )}
                        </td>

                        {/* Readable Content */}
                        <td className="p-3.5 text-zinc-300 text-[11px] leading-relaxed">
                          {d.viewedTarget && (
                            <span className="font-semibold text-white">
                              {d.viewer || "Người xem"}{" "}
                              <span className="text-zinc-500">➔</span>{" "}
                              <span className="text-sky-300">{d.viewedTarget}</span>
                            </span>
                          )}

                          {d.taskTitle && (
                            <div className="font-medium text-white truncate max-w-md">
                              📝 Nhiệm vụ: <span className="text-teal-300">{d.taskTitle}</span>
                            </div>
                          )}

                          {d.meetingTitle && !d.taskTitle && (
                            <div className="font-medium text-white truncate max-w-md">
                              🎙️ Cuộc họp: <span className="text-indigo-300">{d.meetingTitle}</span>
                            </div>
                          )}

                          {d.employeeName && (
                            <div className="font-semibold text-white">
                              👤 {d.employeeName}: {d.fromUnit} ➔ {d.toUnit}
                            </div>
                          )}

                          {d.leaveType && (
                            <div className="text-white">
                              {d.requester} xin nghỉ {d.durationDays} ngày ({d.leaveType})
                            </div>
                          )}

                          {d.purpose && (
                            <div className="text-[10px] text-zinc-400 italic">
                              Mục đích: {d.purpose}
                            </div>
                          )}

                          {d.law && (
                            <span className="inline-block mt-0.5 text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                              ⚖️ {d.law}
                            </span>
                          )}
                        </td>

                        {/* Toggle Raw JSON */}
                        <td className="p-3.5 pr-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 inline-flex items-center gap-1 transition"
                          >
                            <span>JSON</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Detail Row */}
                      {isExpanded && (
                        <tr className="bg-black/30 border-t border-zinc-800">
                          <td colSpan={5} className="p-4 pl-6 pr-6">
                            <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                Raw Audit Log Payload (ID: {log.id})
                              </div>
                              <pre className="overflow-x-auto whitespace-pre-wrap text-emerald-300/90 max-h-48">
                                {JSON.stringify(log.detail, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
