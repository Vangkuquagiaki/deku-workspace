"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  Sparkles,
  PhoneOff,
  Copy,
  Check,
  Languages,
  Radio,
  FileText,
  Loader2,
  ChevronRight,
  X,
  Send,
  Shield,
  Settings,
  UserX,
  VolumeX,
  LogOut,
  Sliders,
  CheckCircle,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { MediaRoom } from "@/components/media-room";
import { cn } from "@/lib/utils";

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const code = (params?.code as string)?.toLowerCase() || "";

  // Lobby state
  const [inLobby, setInLobby] = useState(true);
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userLang, setUserLang] = useState("vi");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  // Live in-call features
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [captionsOpen, setCaptionsOpen] = useState(true);
  const [captionsBotActive, setCaptionsBotActive] = useState(true);
  const [captionLang, setCaptionLang] = useState<"vi" | "en">("vi");
  const [currentCaption, setCurrentCaption] = useState<{
    speaker: string;
    text: string;
    translation: string;
  } | null>(null);

  // Sidebar state & Tabs: "transcripts" | "participants" | "settings"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcripts" | "participants" | "settings">("transcripts");
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [lobbyEnabled, setLobbyEnabled] = useState(false);

  // Speech recognition ref for local speaking
  const recognitionRef = useRef<any>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isHost = meeting?.hostId === user?.id || !meeting?.hostId;

  useEffect(() => {
    if (user) {
      setUserName(user.fullName || user.username || "Thành viên");
    }
    fetchMeeting();
  }, [code, user]);

  // Handle local camera preview in Lobby
  useEffect(() => {
    if (inLobby && videoEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera permission denied or not available
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [inLobby, videoEnabled]);

  // Timer for recording
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // M1 Consent State & Polling
  const [consentData, setConsentData] = useState<any>(null);
  const [consentError, setConsentError] = useState<string | null>(null);

  const fetchConsent = async () => {
    try {
      const res = await fetch(`/api/meetings/${code}/consent`);
      if (res.ok) {
        const data = await res.json();
        setConsentData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!inLobby) {
      fetchConsent();
      const interval = setInterval(fetchConsent, 3000);
      return () => clearInterval(interval);
    }
  }, [inLobby, code]);


  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${code}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setLobbyEnabled(Boolean(data.lobby));
        if (data.participants) {
          setParticipants(data.participants);
        }
        if (data.segments && data.segments.length > 0) {
          setTranscripts(
            data.segments.map((s: any) => ({
              id: s.id,
              speakerName: s.speakerName || "Người tham gia",
              text: s.text,
              translation: s.translation || { vi: s.text, en: s.text },
              time: "Gần đây",
            }))
          );
        }
      } else {
        // Create ad-hoc meeting if code does not exist
        const createRes = await fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `Cuộc họp #${code}` }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          setMeeting(created);
          setLobbyEnabled(Boolean(created.lobby));
          setParticipants(created.participants || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initialize browser Speech Recognition when in-call for live translation
  useEffect(() => {
    if (inLobby) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && audioEnabled) {
      try {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = userLang === "vi" ? "vi-VN" : "en-US";

        recog.onresult = (event: any) => {
          const results = event.results;
          const latest = results[results.length - 1];
          const transcriptText = latest[0].transcript.trim();

          if (transcriptText) {
            const translated =
              userLang === "vi"
                ? `[EN]: ${transcriptText}`
                : `[VI]: ${transcriptText}`;

            setCurrentCaption({
              speaker: userName || "Bạn",
              text: transcriptText,
              translation: translated,
            });

            if (latest.isFinal) {
              fetch(`/api/meetings/${code}/transcript`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  speakerId: user?.id || "guest",
                  speakerName: userName || "Bạn",
                  text: transcriptText,
                  lang: userLang,
                  translation: {
                    vi: userLang === "vi" ? transcriptText : translated,
                    en: userLang === "en" ? transcriptText : translated,
                  },
                }),
              }).catch(() => {});

              setTranscripts((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  speakerName: userName || "Bạn",
                  text: transcriptText,
                  translation: {
                    vi: userLang === "vi" ? transcriptText : translated,
                    en: userLang === "en" ? transcriptText : translated,
                  },
                  time: new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ]);
            }
          }
        };

        recog.onerror = (e: any) => console.warn("SpeechRecog error:", e);
        recog.start();
        recognitionRef.current = recog;
      } catch (err) {
        console.warn("Speech recognition init error:", err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [inLobby, audioEnabled, userLang, code, userName, user?.id]);

  const handleIssueConsentNotice = async () => {
    try {
      const res = await fetch(`/api/meetings/${code}/consent/notify`, { method: "POST" });
      if (res.ok) {
        await fetchConsent();
        alert("Đã phát thông báo đồng thuận ghi âm/ghi hình theo Nghị định 13/2023/NĐ-CP đến tất cả thành viên.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespondConsent = async (agreed: boolean) => {
    try {
      const res = await fetch(`/api/meetings/${code}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentStatus: agreed ? "AGREED" : "DECLINED" }),
      });
      if (res.ok) {
        await fetchConsent();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecording = async () => {
    try {
      setConsentError(null);
      if (!isRecording) {
        const res = await fetch(`/api/meetings/${code}/recording`, { method: "POST" });
        if (res.ok) {
          setIsRecording(true);
        } else if (res.status === 409) {
          const err = await res.json();
          setConsentError(err.message);
          if (confirm(`[Quy định Nghị định 13/2023/NĐ-CP]\n\n${err.message}\n\nBạn có muốn phát thông báo đồng thuận tới toàn bộ người tham gia ngay bây giờ không?`)) {
            await handleIssueConsentNotice();
          }
        } else {
          alert("Lỗi khi kích hoạt ghi hình cuộc họp.");
        }
      } else {
        const res = await fetch(`/api/meetings/${code}/recording`, { method: "DELETE" });
        if (res.ok) setIsRecording(false);
      }
    } catch (e) {
      console.error(e);
    }
  };


  const toggleCaptionsBot = async () => {
    try {
      if (captionsBotActive) {
        await fetch(`/api/meetings/${code}/captions`, { method: "DELETE" });
        setCaptionsBotActive(false);
      } else {
        await fetch(`/api/meetings/${code}/captions`, { method: "POST" });
        setCaptionsBotActive(true);
      }
    } catch (e) {
      setCaptionsBotActive(!captionsBotActive);
    }
  };

  const handleMuteParticipant = async (pid: string) => {
    try {
      await fetch(`/api/meetings/${code}/participants/${pid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muteMic: true }),
      });
      alert("Đã gửi tín hiệu tắt micro thành viên");
    } catch (e) {
      console.error(e);
    }
  };

  const handleKickParticipant = async (pid: string) => {
    if (!confirm("Bạn có chắc chắn muốn mời thành viên này ra khỏi cuộc họp?")) return;
    try {
      const res = await fetch(`/api/meetings/${code}/participants/${pid}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setParticipants((prev) => prev.filter((p) => p.id !== pid && p.userId !== pid));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndMeetingForAll = async () => {
    if (!confirm("Bạn có chắc chắn muốn KẾT THÚC cuộc họp cho tất cả mọi người?")) return;
    try {
      await fetch(`/api/meetings/${code}/end`, { method: "POST" });
      router.push(`/meetings/${meeting?.id || code}`);
    } catch (e) {
      router.push(`/meetings/${meeting?.id || code}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveCall = () => {
    if (meeting?.id) {
      router.push(`/meetings/${meeting.id}`);
    } else {
      router.push("/meetings");
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#111214] text-zinc-300 gap-3">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <p className="text-sm">Đang tải thông tin phòng họp #{code}...</p>
      </div>
    );
  }

  // View 1: Lobby Screen (Màn hình chờ - Pre-join)
  if (inLobby) {
    return (
      <div className="min-h-full w-full bg-[#111214] flex flex-col items-center justify-center p-4 md:p-8 select-none">
        <div className="max-w-xl w-full bg-[#1e1f22] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {code}
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                {meeting?.title || "Phòng họp hội nghị"}
              </h2>
            </div>
            <button
              onClick={handleCopyLink}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 bg-[#2b2d31] px-3 py-1.5 rounded-lg border border-white/5 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Đã copy link" : "Sao chép link"}</span>
            </button>
          </div>

          {/* Device Preview Simulator Box */}
          <div className="aspect-video w-full rounded-2xl bg-black border border-zinc-800 relative flex flex-col items-center justify-center overflow-hidden shadow-inner">
            {videoEnabled ? (
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-extrabold text-2xl shadow-xl">
                {userName.slice(0, 2).toUpperCase() || "ME"}
              </div>
            )}

            <div className="absolute bottom-3 flex items-center gap-2 z-10 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition shadow",
                  audioEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-600 text-white"
                )}
                title={audioEnabled ? "Tắt Micro" : "Bật Micro"}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition shadow",
                  videoEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-600 text-white"
                )}
                title={videoEnabled ? "Tắt Camera" : "Bật Camera"}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Form settings */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full h-11 px-4 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
                <span>Ngôn ngữ bạn sẽ nói trong cuộc họp</span>
                <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                  <Languages className="h-3 w-3" /> AI Phiên dịch tự động
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserLang("vi")}
                  className={cn(
                    "h-11 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2",
                    userLang === "vi"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm"
                      : "bg-[#2b2d31] border-zinc-700 text-zinc-300"
                  )}
                >
                  <span>🇻🇳 Tiếng Việt (Nói)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserLang("en")}
                  className={cn(
                    "h-11 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2",
                    userLang === "en"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                      : "bg-[#2b2d31] border-zinc-700 text-zinc-300"
                  )}
                >
                  <span>🇺🇸 English (Speaking)</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setInLobby(false)}
            className="w-full h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition duration-150 flex items-center justify-center gap-2"
          >
            <span>Tham gia ngay</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // View 2: Live Conference Stage with AI Captions, Recording & Host Controls
  return (
    <div className="h-full w-full flex flex-col bg-[#111214] overflow-hidden select-none relative">
      {/* Top Meeting Header Bar */}
      <header className="h-12 px-4 bg-[#1e1f22] border-b border-zinc-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-bold text-xs text-white truncate max-w-[200px] sm:max-w-xs">
              {meeting?.title || `Họp #${code}`}
            </span>
          </div>

          <span className="text-[11px] font-mono bg-black/50 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold hidden sm:inline">
            {code}
          </span>

          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-1.5 bg-rose-600/20 border border-rose-500/40 text-rose-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-pulse">
              <Radio className="h-3 w-3 text-rose-500 animate-spin" />
              <span>REC {formatSec(recordSeconds)}</span>
            </div>
          )}
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2">
          {/* Record button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-sm",
              isRecording
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/40"
                : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 border border-white/5"
            )}
            title={isRecording ? "Dừng ghi hình cuộc họp" : "Ghi hình cuộc họp (Record)"}
          >
            <Radio className={cn("h-3.5 w-3.5", isRecording ? "text-white" : "text-rose-400")} />
            <span className="hidden sm:inline">{isRecording ? "Dừng ghi" : "Ghi hình"}</span>
          </button>

          {/* Captions Toggle button */}
          <button
            type="button"
            onClick={() => setCaptionsOpen(!captionsOpen)}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-sm",
              captionsOpen
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/40"
                : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 border border-white/5"
            )}
            title="Bật/Tắt dải phụ đề dịch thuật (Captions)"
          >
            <Languages className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Phụ đề CC</span>
          </button>

          {/* Participants button */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("participants");
              setSidebarOpen(true);
            }}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-sm",
              sidebarOpen && activeTab === "participants"
                ? "bg-emerald-600 text-white"
                : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 border border-white/5"
            )}
            title="Xem danh sách người tham gia & Quản trị host"
          >
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{participants.length || 1}</span>
          </button>

          {/* Transcript Drawer button */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("transcripts");
              setSidebarOpen(true);
            }}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-sm",
              sidebarOpen && activeTab === "transcripts"
                ? "bg-emerald-600 text-white"
                : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 border border-white/5"
            )}
            title="Xem transcript & biên bản trực tiếp"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Biên bản</span>
          </button>

          {/* Host Settings button */}
          {isHost && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("settings");
                setSidebarOpen(true);
              }}
              className={cn(
                "h-8 px-2.5 rounded-full text-xs font-semibold flex items-center gap-1 transition shadow-sm",
                sidebarOpen && activeTab === "settings"
                  ? "bg-amber-600 text-white"
                  : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 border border-white/5"
              )}
              title="Cài đặt phòng họp của Host"
            >
              <Settings className="h-3.5 w-3.5 text-amber-400" />
            </button>
          )}

          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-8 px-2.5 rounded-full text-xs bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 border border-white/5 transition flex items-center gap-1"
            title="Sao chép liên kết mời họp"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* M1: Recording Consent Banner (Quy định Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & NĐ 13/2023/NĐ-CP) */}
      {consentData?.recordingNoticeAt && (consentData?.myConsent === "PENDING" || !consentData?.myConsent) && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] p-3.5 rounded-2xl bg-indigo-950/95 border border-indigo-500/50 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-2.5">
            <Shield className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Thông báo thu thập dữ liệu giọng nói (M1)
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                  Luật 91/2025/QH15
                </span>
              </h4>
              <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                Chủ tọa đã phát thông báo ghi âm để phân tích AI. Bạn có đồng thuận cho phép ghi âm dữ liệu giọng nói trong cuộc họp này không?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRespondConsent(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Đồng ý</span>
            </button>
            <button
              onClick={() => handleRespondConsent(false)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs transition"
            >
              Từ chối
            </button>
          </div>
        </div>
      )}

      {/* Consent Block / Warning for Host */}
      {consentError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] p-3 rounded-2xl bg-amber-950/95 border border-amber-500/40 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-xs text-amber-200 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-[11px]">{consentError}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleIssueConsentNotice}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow transition"
            >
              Phát thông báo ngay
            </button>
            <button
              onClick={() => setConsentError(null)}
              className="p-1 rounded-lg hover:bg-black/20 text-zinc-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Video Meeting Stage & Sidebars */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        {/* LiveKit Media Conference Room */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0">
          <MediaRoom
            chatId={`meet_${code}`}
            video={videoEnabled}
            audio={audioEnabled}
            onDisconnected={handleLeaveCall}
          />

          {/* Floating Nghị định 13/2023/NĐ-CP Consent Request Banner */}
          {consentData?.recordingNoticeAt && (!consentData?.myConsent || consentData?.myConsent === "PENDING") && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 max-w-xl w-[92%] z-50 bg-amber-950/95 border border-amber-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                      Yêu cầu Đồng thuận Ghi hình & AI (Nghị định 13/2023/NĐ-CP)
                    </h4>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded">
                      Bảo vệ DLCN
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    Chủ tọa cuộc họp vừa phát thông báo xin phép ghi âm, ghi hình và phân tích biên bản tự động. Theo quy định pháp luật, toàn bộ thành viên cần xác nhận sự đồng thuận.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRespondConsent(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Tôi đồng ý ghi hình</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondConsent(false)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Realtime Subtitle Bar (Google Meet Style) */}
          {captionsOpen && (

            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-[92%] z-40 bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 shadow-2xl transition-all select-none">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    {currentCaption ? currentCaption.speaker : "AI Phụ Đề Dịch Thuật"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-zinc-400">Xem bản:</span>
                  <button
                    onClick={() => setCaptionLang("vi")}
                    className={cn(
                      "px-1.5 py-0.5 rounded font-bold transition",
                      captionLang === "vi" ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    VI
                  </button>
                  <button
                    onClick={() => setCaptionLang("en")}
                    className={cn(
                      "px-1.5 py-0.5 rounded font-bold transition",
                      captionLang === "en" ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    EN
                  </button>
                </div>
              </div>

              <p className="text-sm md:text-base font-semibold text-white leading-snug">
                {currentCaption
                  ? captionLang === "vi"
                    ? currentCaption.text
                    : currentCaption.translation
                  : "Đang lắng nghe âm thanh trong phòng họp để tự động dịch thuật và hiển thị phụ đề..."}
              </p>
            </div>
          )}
        </div>

        {/* Right-side Multi-Tab Sidebar */}
        {sidebarOpen && (
          <div className="w-80 md:w-96 border-l border-zinc-800 bg-[#1e1f22] flex flex-col h-full shrink-0 z-30 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Tab Selector Header */}
            <div className="h-12 px-3 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#2b2d31]/50">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("transcripts")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                    activeTab === "transcripts" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Biên bản</span>
                </button>

                <button
                  onClick={() => setActiveTab("participants")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                    activeTab === "participants" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Thành viên</span>
                </button>

                {isHost && (
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                      activeTab === "settings" ? "bg-amber-600 text-white" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Host</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TAB 1: Transcripts */}
            {activeTab === "transcripts" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {transcripts.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
                      <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2 opacity-60" />
                      <p>Chưa có câu thoại nào được ghi nhận.</p>
                      <p className="text-[11px] text-zinc-500">
                        Khi bạn hoặc đồng nghiệp phát biểu, transcript sẽ xuất hiện tại đây theo thời gian thực.
                      </p>
                    </div>
                  ) : (
                    transcripts.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-[#2b2d31]/60 border border-white/5 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400">{t.speakerName}</span>
                          <span className="text-[10px] text-zinc-500">{t.time}</span>
                        </div>
                        <p className="text-zinc-200 font-medium">{t.text}</p>
                        <p className="text-indigo-300 text-[11px] italic bg-black/30 p-1.5 rounded">
                          {captionLang === "en" ? t.translation?.en : t.translation?.vi}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-zinc-800 bg-[#2b2d31]/30">
                  <button
                    onClick={() => router.push(`/meetings/${meeting?.id || code}`)}
                    className="w-full h-9 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Xem Tóm Tắt & Biên Bản AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Participants List with Host Controls */}
            {activeTab === "participants" && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
                <div className="text-xs text-zinc-400 font-medium pb-1 border-b border-zinc-800 flex items-center justify-between">
                  <span>{participants.length || 1} người trong phòng</span>
                  {isHost && <span className="text-amber-400 font-bold text-[10px]">Bạn là Host</span>}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {participants.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#2b2d31]/50 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                          {userName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{userName} (Bạn)</p>
                          <span className="text-[10px] text-emerald-400 font-semibold">HOST</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    participants.map((p) => {
                      const isMe = p.userId === user?.id;
                      const pConsent = consentData?.participants?.find(
                        (cp: any) => cp.name === p.name || cp.profileId === p.profileId || cp.id === p.id
                      );
                      const status = pConsent?.consentStatus || "PENDING";
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-[#2b2d31]/50 border border-white/5 flex items-center justify-between text-xs group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xs">
                              {p.name?.slice(0, 1) || "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {p.name} {isMe ? "(Bạn)" : ""}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-zinc-400 font-mono uppercase bg-black/30 px-1.5 py-0.5 rounded">
                                  {p.role}
                                </span>
                                {status === "AGREED" && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                                    ✓ Đồng thuận
                                  </span>
                                )}
                                {status === "DECLINED" && (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-medium">
                                    ✗ Từ chối
                                  </span>
                                )}
                                {status === "PENDING" && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                    Chờ duyệt
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isHost && !isMe && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMuteParticipant(p.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                                title="Tắt mic thành viên này"
                              >
                                <VolumeX className="h-3.5 w-3.5 text-zinc-300" />
                              </button>
                              <button
                                onClick={() => handleKickParticipant(p.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Mời ra khỏi phòng họp"
                              >
                                <UserX className="h-3.5 w-3.5 text-rose-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Host Settings Dialog */}
            {activeTab === "settings" && isHost && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                <div className="text-xs text-zinc-400 font-medium pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span>Bảng điều khiển & Cài đặt của Host</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Nghị định 13/2023/NĐ-CP Compliance Panel */}
                  <div className="p-3.5 rounded-2xl bg-[#2b2d31]/60 border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-white">Tuân thủ Nghị định 13</span>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                          consentData?.isUnanimous
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        )}
                      >
                        {consentData?.isUnanimous ? "Đủ 100% đồng thuận" : "Chưa đủ điều kiện"}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {consentData?.counts
                        ? `${consentData.counts.agreed}/${consentData.counts.total} người đã đồng thuận ghi âm và xử lý dữ liệu AI.`
                        : "Chưa phát yêu cầu đồng thuận ghi âm."}
                    </p>
                    <button
                      type="button"
                      onClick={handleIssueConsentNotice}
                      className="w-full h-8 rounded-lg text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Phát thông báo xin đồng thuận lại</span>
                    </button>
                  </div>

                  {/* Lobby Toggle */}
                  <div className="p-3.5 rounded-2xl bg-[#2b2d31]/60 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Phòng chờ (Lobby)</span>
                      <button
                        onClick={() => setLobbyEnabled(!lobbyEnabled)}
                        className={cn(
                          "w-11 h-6 rounded-full transition relative",
                          lobbyEnabled ? "bg-emerald-600" : "bg-zinc-700"
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full bg-white absolute top-1 transition",
                            lobbyEnabled ? "right-1" : "left-1"
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Khi bật, người tham gia bên ngoài phải chờ host phê duyệt mới được cấp token vào phòng.
                    </p>
                  </div>

                  {/* AI Captions Bot Toggle */}
                  <div className="p-3.5 rounded-2xl bg-[#2b2d31]/60 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Bot AI Phụ đề dịch thuật</span>
                      <button
                        onClick={toggleCaptionsBot}
                        className={cn(
                          "w-11 h-6 rounded-full transition relative",
                          captionsBotActive ? "bg-indigo-600" : "bg-zinc-700"
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full bg-white absolute top-1 transition",
                            captionsBotActive ? "right-1" : "left-1"
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Tự động nghe và dịch phụ đề song ngữ Việt - Anh thời gian thực.
                    </p>
                  </div>

                  {/* End Meeting for all */}
                  <div className="pt-4 border-t border-zinc-800">
                    <button
                      onClick={handleEndMeetingForAll}
                      className="w-full h-10 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Kết thúc họp cho tất cả</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
