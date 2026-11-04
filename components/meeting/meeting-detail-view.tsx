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
  Pause,
  RotateCcw,
  LogOut,
  Volume2,
  VolumeX,
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
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<Record<number, boolean>>({});

  const handleRewind = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - seconds);
      setCurrentVideoTime(videoRef.current.currentTime);
    }
  };

  const handleFastForward = (seconds = 10) => {
    if (videoRef.current) {
      const maxDuration = videoRef.current.duration || 9999;
      videoRef.current.currentTime = Math.min(maxDuration, videoRef.current.currentTime + seconds);
      setCurrentVideoTime(videoRef.current.currentTime);
    }
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (timeSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec;
      setCurrentVideoTime(timeSec);
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  const handleConfirmAllTasks = async () => {
    if (!summary?.actionItems || summary.actionItems.length === 0) return;
    for (let idx = 0; idx < summary.actionItems.length; idx++) {
      if (!confirmedItems[idx]) {
        await handleConfirmTask(idx, summary.actionItems[idx]);
      }
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
      <header className="h-14 sm:h-16 px-4 md:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#1e1f22]/90 backdrop-blur-md sticky top-0 z-20 gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
          {/* Segmented Back & Exit Buttons */}
          <div className="flex items-center bg-[#2b2d31] p-0.5 sm:p-1 rounded-xl border border-white/5 shrink-0 shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (serverId) {
                  router.push(`/servers/${serverId}/meetings`);
                } else {
                  router.push("/meetings");
                }
              }}
              className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
              title="Quay lại danh sách cuộc họp"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>

            <div className="h-3.5 w-[1px] bg-zinc-700 mx-0.5" />

            <button
              type="button"
              onClick={() => router.push(serverId ? `/servers/${serverId}` : "/")}
              className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg hover:bg-rose-600/20 text-zinc-400 hover:text-rose-300 transition flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
              title="Thoát về Workspace chính (Discord)"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Thoát</span>
            </button>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white whitespace-nowrap truncate">
              {meeting?.title || "Biên bản cuộc họp"}
            </h1>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
              {meeting?.code}
            </span>
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
            <span className="hidden md:inline">{copied ? "Đã copy biên bản" : "Sao chép"}</span>
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
              {recording ? "Đã lưu trữ" : "Bản ghi mô phỏng"}
            </p>
          </div>
        </div>

        {/* Video Player & Tua Lại (Playback Controls) */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#1e1f22] border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Xem Lại & Tua Bản Ghi Cuộc Họp</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                MP4 Video Player
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-mono">
                {formatTime(currentVideoTime)} / {formatTime(videoDuration || 180)}
              </span>
            </div>
          </div>

          {/* Video element */}
          <div className="aspect-video w-full rounded-2xl bg-black border border-zinc-800 relative overflow-hidden shadow-inner flex items-center justify-center group">
            <video
              ref={videoRef}
              src={videoSrc}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentVideoTime(videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setVideoDuration(videoRef.current.duration || 180);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
              playsInline
            />

            {/* Big center play button if paused */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handleTogglePlay}
                className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl transition hover:scale-105"
                title="Phát video"
              >
                <Play className="h-8 w-8 ml-1" />
              </button>
            )}
          </div>

          {/* Player controls toolbar: Tua lại 10s, Tua tới 10s, Play/Pause, Seekbar */}
          <div className="bg-[#2b2d31] p-4 rounded-2xl border border-white/5 space-y-3">
            {/* Seek bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400 w-12 text-right">
                {formatTime(currentVideoTime)}
              </span>
              <input
                type="range"
                min={0}
                max={videoDuration || 180}
                value={currentVideoTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs font-mono text-zinc-400 w-12">
                {formatTime(videoDuration || 180)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {/* Play / Pause button */}
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlaying ? "Tạm dừng" : "Phát video"}</span>
                </button>

                {/* Tua lại 10 giây (Rewind 10s) */}
                <button
                  type="button"
                  onClick={() => handleRewind(10)}
                  className="h-10 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-white/5 transition"
                  title="Tua lại 10 giây (Rewind 10s)"
                >
                  <RotateCcw className="h-4 w-4 text-emerald-400" />
                  <span>Tua lại 10s</span>
                </button>

                {/* Tua tới 10 giây (Fast forward 10s) */}
                <button
                  type="button"
                  onClick={() => handleFastForward(10)}
                  className="h-10 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-white/5 transition"
                  title="Tua tới 10 giây (Forward 10s)"
                >
                  <RotateCw className="h-4 w-4 text-emerald-400" />
                  <span>Tua tới 10s</span>
                </button>
              </div>

              {/* Speed & Volume */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-700 text-xs">
                  <span className="text-[11px] text-zinc-400 pl-1.5">Tốc độ:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSpeedChange(spd)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-xs font-bold transition",
                        playbackSpeed === spd
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Download recording */}
                <a
                  href={videoSrc}
                  download={`cuoc-hop-${meeting?.code || "recording"}.mp4`}
                  className="h-10 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold border border-white/5 transition"
                  title="Tải video ghi hình về máy"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tải MP4</span>
                </a>
              </div>
            </div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-indigo-400">
                      Nhiệm vụ & Việc cần làm (Trích xuất tự động):
                    </h4>
                    <button
                      type="button"
                      onClick={handleConfirmAllTasks}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Đẩy toàn bộ vào Base tổ</span>
                    </button>
                  </div>
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

