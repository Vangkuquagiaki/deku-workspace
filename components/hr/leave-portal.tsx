"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  AlertCircle,
  UserCheck,
  Send,
  Loader2,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeavePortalProps {
  demoRole: string;
}

export function LeavePortal({ demoRole }: LeavePortalProps) {
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [approvalsData, setApprovalsData] = useState<any>(null);

  // Modal create leave request
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysCount, setDaysCount] = useState(1);
  const [session, setSession] = useState("FULL_DAY");
  const [reason, setReason] = useState("");
  const [handoverTo, setHandoverTo] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Approval decision state
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [decisionLoading, setDecisionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [demoRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policiesRes, balanceRes, requestsRes, approvalsRes] = await Promise.all([
        fetch("/api/leave/policies"),
        fetch("/api/leave/balances"),
        fetch(`/api/leave/requests?asRole=${demoRole}`),
        fetch(`/api/approvals?asRole=${demoRole}`),
      ]);

      if (policiesRes.ok) {
        const pData = await policiesRes.json();
        setPolicies(pData);
        if (pData.length > 0 && !selectedPolicyId) {
          setSelectedPolicyId(pData[0].id);
        }
      }

      if (balanceRes.ok) {
        const bData = await balanceRes.json();
        setBalanceData(bData);
      }

      if (requestsRes.ok) {
        const rData = await requestsRes.json();
        setMyRequests(rData);
      }

      if (approvalsRes.ok) {
        const aData = await approvalsRes.json();
        setApprovalsData(aData);
      }
    } catch (error) {
      console.error("Error fetching leave data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: selectedPolicyId,
          startDate,
          endDate,
          daysCount,
          session,
          reason,
          handoverTo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể nộp đơn nghỉ phép");
      }

      setIsCreateOpen(false);
      setReason("");
      setHandoverTo("");
      fetchData();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    setDecisionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const note = decisionNotes[requestId] || "";
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          decision,
          note,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Không thể thực hiện phê duyệt");
      }

      fetchData();
    } catch (error) {
      console.error("Approval error:", error);
    } finally {
      setDecisionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-xs">Đang tải cổng thông tin nghỉ phép & phê duyệt...</span>
      </div>
    );
  }

  const balances = balanceData?.balances || [];
  const canApprove = demoRole !== "MEMBER";
  const pendingApprovals = approvalsData?.requests || [];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Header Info */}
      <div className="bg-[#1e1f22] p-6 rounded-3xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Calendar className="h-5 w-5" />
            </span>
            <h3 className="text-base font-bold text-white">
              Cổng Quản Trị Nghỉ Phép & Phê Duyệt (Leave & Approvals)
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Quản trị số dư ngày phép, nộp đơn trực tuyến, phê duyệt đa cấp và kiểm soát qua Transactional Outbox
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="h-10 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nộp Đơn Nghỉ Phép Mới</span>
        </button>
      </div>

      {/* Leave Balances Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Số Dư Ngày Phép Của Tôi (Năm 2026)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.map((b: any) => {
            const remaining = Math.max(0, b.totalDays - b.usedDays - b.pendingDays);
            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{b.policy.name}</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded",
                      b.policy.isPaid
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {b.policy.isPaid ? "Có lương" : "Không lương"}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-y border-zinc-800/80 py-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 block">Số ngày còn lại</span>
                    <span className="text-2xl font-black text-indigo-400">{remaining}</span>
                  </div>
                  <div className="text-right text-[11px] text-zinc-400 space-y-0.5">
                    <div>Tổng: <strong className="text-white">{b.totalDays}</strong></div>
                    <div>Đã nghỉ: <strong className="text-emerald-400">{b.usedDays}</strong></div>
                    {b.pendingDays > 0 && (
                      <div>Chờ duyệt: <strong className="text-amber-400">{b.pendingDays}</strong></div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 truncate">{b.policy.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manager / HR Approvals Queue */}
      {canApprove && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4" />
              Hàng Chờ Phê Duyệt Cấp Quản Lý ({pendingApprovals.length} đơn đang chờ)
            </h4>
            <span className="text-[11px] text-zinc-400">
              Quyền duyệt: <strong className="text-indigo-400">{demoRole}</strong>
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#1e1f22] border border-zinc-800 text-center text-xs text-zinc-500">
              Không có đơn xin nghỉ phép nào đang chờ phê duyệt.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.map((req: any) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-[#1e1f22] border border-amber-500/20 space-y-3.5 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-white">
                        {req.employeeProfile.profile.name}
                      </h5>
                      <span className="text-[11px] text-indigo-300 font-mono">
                        {req.employeeProfile.employeeCode} • {req.employeeProfile.jobTitle}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                      {req.policy.name}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Thời gian:</span>
                      <strong className="text-white">
                        {new Date(req.startDate).toLocaleDateString("vi-VN")} →{" "}
                        {new Date(req.endDate).toLocaleDateString("vi-VN")} ({req.daysCount} ngày)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>Buổi nghỉ: {req.session}</span>
                      <span>Người bàn giao: {req.handoverTo || "Không"}</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] pt-1 border-t border-zinc-800 italic">
                      &quot;{req.reason}&quot;
                    </p>
                  </div>

                  {/* Decision Actions */}
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ghi chú phản hồi (nếu từ chối)..."
                      value={decisionNotes[req.id] || ""}
                      onChange={(e) =>
                        setDecisionNotes({ ...decisionNotes, [req.id]: e.target.value })
                      }
                      className="w-full h-8 px-3 rounded-lg bg-black/30 border border-zinc-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDecision(req.id, "APPROVE")}
                        disabled={decisionLoading[req.id]}
                        className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Phê Duyệt (Approve)</span>
                      </button>

                      <button
                        onClick={() => handleDecision(req.id, "REJECT")}
                        disabled={decisionLoading[req.id]}
                        className="h-8 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-sm"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Từ Chối (Reject)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leave Requests History Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Lịch Sử Đơn Nghỉ Phép Trong Hệ Thống
        </h4>

        <div className="border border-zinc-800 rounded-3xl bg-[#1e1f22] overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2b2d31]/80 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3.5 pl-6">Nhân sự</th>
                <th className="p-3.5">Loại phép</th>
                <th className="p-3.5">Thời gian nghỉ</th>
                <th className="p-3.5">Số ngày</th>
                <th className="p-3.5">Lý do</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 pr-6 text-right">Người duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Chưa có đơn nghỉ phép nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                myRequests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#2b2d31]/40 transition">
                    <td className="p-3.5 pl-6 font-semibold text-white">
                      {r.employeeProfile?.profile?.name}
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        {r.employeeProfile?.employeeCode}
                      </span>
                    </td>
                    <td className="p-3.5 text-indigo-300 font-medium">{r.policy?.name}</td>
                    <td className="p-3.5 text-zinc-300">
                      {new Date(r.startDate).toLocaleDateString("vi-VN")} →{" "}
                      {new Date(r.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3.5 font-bold text-white">{r.daysCount} ngày</td>
                    <td className="p-3.5 text-zinc-300 italic max-w-xs truncate">{r.reason}</td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          r.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : r.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-6 text-right text-zinc-400">
                      {r.approver?.name || "Chờ duyệt"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Submit Leave Request */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
          <div className="max-w-md w-full bg-[#1e1f22] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                Nộp Đơn Xin Nghỉ Phép Mới
              </h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Loại nghỉ phép</label>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.isPaid ? "Có lương" : "Không lương"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Từ ngày</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Đến ngày</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Số ngày nghỉ</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={daysCount}
                    onChange={(e) => setDaysCount(parseFloat(e.target.value) || 1)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Buổi nghỉ</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  >
                    <option value="FULL_DAY">Cả ngày (Full Day)</option>
                    <option value="MORNING">Buổi sáng (Morning)</option>
                    <option value="AFTERNOON">Buổi chiều (Afternoon)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Lý do nghỉ phép</label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi rõ lý do xin nghỉ phép..."
                  className="w-full p-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Đồng nghiệp bàn giao công việc</label>
                <input
                  type="text"
                  value={handoverTo}
                  onChange={(e) => setHandoverTo(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Gửi Đơn Lên Quản Lý</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
