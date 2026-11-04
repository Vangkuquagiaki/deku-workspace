"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Video,
  Clock,
  Users,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Languages,
  Download,
  Share2,
  Loader2,
  Check,
  Play,
  RotateCw,
  ExternalLink,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

function removeVietnameseDiacritics(str: string): string {
  if (!str) return "";
  return str
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

interface MeetingDetailViewProps {
  meetingId?: string;
  serverId?: string;
}

export function MeetingDetailView({ meetingId: propMeetingId, serverId }: MeetingDetailViewProps) {
  const params = useParams();
  const router = useRouter();
  const meetingId = propMeetingId || (params?.id as string);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transcriptLang, setTranscriptLang] = useState<"vi" | "en">("vi");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [confirmedItems, setConfirmedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (meetingId) {
      fetchMeetingData();
    }
  }, [meetingId]);

  const handleConfirmTask = async (index: number, actionItem: any) => {
    try {
      const res = await fetch("/api/tasks/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meeting?.id,
          orgUnitId: meeting?.orgUnitId,
          title: actionItem.task,
          assigneeName: actionItem.assignee,
          deadlineText: actionItem.due,
          evidenceText: actionItem.task,
        }),
      });

      if (res.ok) {
        setConfirmedItems((prev) => ({ ...prev, [index]: true }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetingData = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
      }

      const sumRes = await fetch(`/api/meetings/${meetingId}/summary`);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const text = `BIÊN BẢN CUỘC HỌP: ${summary.title}\nMã họp: ${summary.code}\n\nTỔNG QUAN:\n${summary.overview}\n\nCÁC QUYẾT ĐỊNH ĐÃ CHỐT:\n${summary.keyDecisions?.map((d: string) => `- ${d}`).join("\n")}\n\nVIỆC CẦN LÀM (ACTION ITEMS):\n${summary.actionItems?.map((a: any) => `- ${a.task} (${a.assignee} - Hạn: ${a.due})`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#111214] text-zinc-300 gap-3">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <p className="text-sm">Đang tải biên bản cuộc họp & tóm tắt AI...</p>
      </div>
    );
  }

  const recording = meeting?.recordings?.[0];
  const videoSrc = recording?.fileUrl || "/recordings/sample-recording.mp4";

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-zinc-100 overflow-y-auto">
      {/* Header */}
      <header className="h-16 px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#1e1f22]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (serverId) {
                router.push(`/servers/${serverId}/meetings`);
              } else {
                router.push("/meetings");
              }
            }}
            className="p-2 rounded-xl bg-[#2b2d31] hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {meeting?.title || "Biên bản cuộc họp"}
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {meeting?.code}
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Được lưu trữ & tạo biên bản tự động bởi hệ thống AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/meetings/${meeting?.id || meeting?.code}/minutes?format=md`}
            download
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-indigo-300 hover:text-white border border-indigo-500/20 transition flex items-center gap-1.5"
            title="Tải biên bản định dạng Markdown"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Xuất Markdown (.md)</span>
          </a>

          <button
            onClick={handleCopySummary}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 hover:text-white border border-white/5 transition flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copied ? "Đã copy biên bản" : "Sao chép biên bản"}</span>
          </button>

          <button
            onClick={() => router.push(`/meet/${meeting?.code}`)}
            className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Vào lại phòng</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Top Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Trạng thái</span>
            <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {meeting?.status === "LIVE" ? "Đang diễn ra" : "Đã hoàn thành"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Người tham gia</span>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-400" />
              {meeting?.participants?.length || 1} thành viên
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Thời gian bắt đầu</span>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              {new Date(meeting?.createdAt || Date.now()).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium">Bản ghi hình</span>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <Video className="h-4 w-4 text-emerald-400" />
              {recording ? "Đã lưu trữ" : "Không ghi hình"}
            </p>
          </div>
        </div>

        {/* AI Summary Section */}
        {summary && (
          <div className="p-6 md:p-8 rounded-3xl bg-[#1e1f22] border border-zinc-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Tóm Tắt Cuộc Họp Bằng AI</h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Mô hình: Whisper ASR + Llama 3
              </span>
            </div>

            <div className="space-y-4 text-xs md:text-sm">
              <div>
                <h4 className="font-semibold text-zinc-300 mb-1">Tổng quan nội dung:</h4>
                <p className="text-zinc-400 leading-relaxed bg-[#2b2d31]/50 p-4 rounded-2xl border border-white/5">
                  {summary.overview || "Đang tổng hợp thông tin cuộc họp..."}
                </p>
              </div>

              {summary.keyDecisions && summary.keyDecisions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-2">Quyết định quan trọng:</h4>
                  <ul className="space-y-2">
                    {summary.keyDecisions.map((dec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action items table with Confirm to Org Task button */}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-semibold text-indigo-400 mb-2">
                    Nhiệm vụ & Việc cần làm (Trích xuất tự động):
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#2b2d31] text-zinc-400">
                        <tr>
                          <th className="p-3">Nhiệm vụ</th>
                          <th className="p-3">Người phụ trách</th>
                          <th className="p-3">Hạn chót</th>
                          <th className="p-3 text-right">Đẩy vào Base tổ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {summary.actionItems.map((item: any, idx: number) => {
                          const isConfirmed = confirmedItems[idx];
                          return (
                            <tr key={idx} className="hover:bg-[#2b2d31]/30 transition">
                              <td className="p-3 font-semibold text-white">{item.task}</td>
                              <td className="p-3 text-indigo-300">{item.assignee}</td>
                              <td className="p-3 text-zinc-400">{item.due}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleConfirmTask(idx, item)}
                                  disabled={isConfirmed}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ml-auto",
                                    isConfirmed
                                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default"
                                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                                  )}
                                >
                                  {isConfirmed ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      <span>Đã vào Base ✓</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3.5 w-3.5" />
                                      <span>Xác nhận Task</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

