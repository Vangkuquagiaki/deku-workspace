"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Copy,
  Edit,
  Headphones,
  LogOut,
  MessageSquare,
  Mic,
  Moon,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserCheck,
  Volume2,
  VolumeX,
  X,
  MapPin,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  DollarSign,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Video,
  FileText,
  Sliders,
  CheckCircle2,
  Loader2,
  Shield,
  Save,
  Globe,
  Radio,
  Lock,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";
import {
  useUserPreferences,
  UserStatus,
  ChatDensity,
  VoiceMode,
} from "@/hooks/use-user-preferences";
import { UserAvatar } from "@/components/user-avatar";
import { sounds } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";

type SettingsTab =
  | "my-account"
  | "hr-profile"
  | "compensation"
  | "meeting-ai"
  | "voice-video"
  | "appearance"
  | "notifications"
  | "chat-text"
  | "privacy";

const statusList: {
  value: UserStatus;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    value: "online",
    label: "Trực tuyến (Online)",
    desc: "Bạn sẽ nhận tất cả thông báo",
    color: "bg-emerald-500",
  },
  {
    value: "idle",
    label: "Chờ (Idle)",
    desc: "Hiển thị trạng thái đang vắng mặt",
    color: "bg-amber-500",
  },
  {
    value: "dnd",
    label: "Không làm phiền (Do Not Disturb)",
    desc: "Tắt tất cả âm thanh thông báo",
    color: "bg-rose-500",
  },
  {
    value: "invisible",
    label: "Ẩn danh (Invisible)",
    desc: "Xuất hiện như đang offline",
    color: "bg-zinc-400",
  },
];

function DiscordSlider({
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="relative flex items-center w-full">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none"
      />
    </div>
  );
}

export function UserSettingsModal() {
  const { isOpen, onClose, type, data, onOpen } = useModal();
  const [activeTab, setActiveTab] = useState<SettingsTab>("my-account");
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [copiedId, setCopiedId] = useState(false);

  // Live Employee & HR Data
  const [empData, setEmpData] = useState<any>(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [showSalary, setShowSalary] = useState(false);

  // Form Editing for HR Profile
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { signOut } = useClerk();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const {
    soundEnabled,
    setSoundEnabled,
    status,
    setStatus,
    chatDensity,
    setChatDensity,
    voiceMode,
    setVoiceMode,
    inputVolume,
    setInputVolume,
    outputVolume,
    setOutputVolume,
    messagePreviews,
    setMessagePreviews,
    customStatus,
    customStatusEmoji,
    setCustomStatus,
    language,
    setLanguage,
    timezone,
    setTimezone,
    autoRecordMeeting,
    setAutoRecordMeeting,
    consentNotification,
    setConsentNotification,
    autoAiMinutes,
    setAutoAiMinutes,
    autoSyncActionItems,
    setAutoSyncActionItems,
    whisperLanguage,
    setWhisperLanguage,
    noiseSuppression,
    setNoiseSuppression,
    echoCancellation,
    setEchoCancellation,
  } = useUserPreferences();

  const isModalOpen = isOpen && type === "userSettings";
  const profile = data?.profile;

  // Load employee profile data when modal opens
  const fetchEmployeeData = async () => {
    setEmpLoading(true);
    try {
      const res = await fetch("/api/profile/me");
      if (res.ok) {
        const json = await res.json();
        setEmpData(json);
        setEditName(json.profile?.name || "");
        setEditAddress(json.employee?.address || "");
        setEditPhone(json.employee?.phoneNumber || "");
        setEditDob(
          json.employee?.dob
            ? new Date(json.employee.dob).toISOString().split("T")[0]
            : ""
        );
        setEditBankAccount(json.employee?.bankAccount || "");
        setEditBankName(json.employee?.bankName || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmpLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchEmployeeData();
    }
  }, [isModalOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, onClose]);

  // Mic test simulation with bouncing VU meter
  useEffect(() => {
    let interval: any;
    if (isMicTesting) {
      interval = setInterval(() => {
        setMicLevel(Math.floor(Math.random() * 65) + 20);
      }, 120);
    } else {
      setMicLevel(0);
    }
    return () => clearInterval(interval);
  }, [isMicTesting]);

  if (!isModalOpen) return null;

  const onCopyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    router.push("/");
  };

  const handleSaveHrProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          address: editAddress,
          phoneNumber: editPhone,
          dob: editDob || null,
          bankAccount: editBankAccount,
          bankName: editBankName,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể lưu thông tin nhân sự");
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        fetchEmployeeData();
      }, 1200);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const emp = empData?.employee;
  const org = empData?.orgUnits?.[0];
  const annualLeave = empData?.leaveBalances?.find((b: any) => b.policyCode === "ANNUAL") || {
    totalDays: 12,
    usedDays: 0,
    remainingDays: 12,
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#313338] text-zinc-200 p-0 overflow-hidden max-w-5xl h-[700px] border border-zinc-800 shadow-2xl rounded-3xl flex flex-col md:flex-row gap-0 select-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Cài Đặt Hệ Thống Doanh Nghiệp Toàn Diện</DialogTitle>
        </DialogHeader>

        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 bg-[#2b2d31] p-4 flex flex-col justify-between shrink-0 border-r border-zinc-800/80 overflow-y-auto">
          <div className="space-y-4">
            {/* Group 1: Hồ Sơ & Nhân Sự */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 mb-1.5 flex items-center justify-between">
                <span>Hồ Sơ & Doanh Nghiệp</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 rounded font-mono">HRM</span>
              </p>
              <div className="space-y-[2px]">
                <button
                  onClick={() => setActiveTab("my-account")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "my-account"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <User className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>Tài khoản & Định danh</span>
                </button>

                <button
                  onClick={() => setActiveTab("hr-profile")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "hr-profile"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <Briefcase className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Hồ sơ nhân sự & Cư trú</span>
                </button>

                <button
                  onClick={() => setActiveTab("compensation")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "compensation"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <DollarSign className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Lương, Ngày công & Phép</span>
                </button>
              </div>
            </div>

            {/* Group 2: Họp AI & Âm Thanh */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 mb-1.5 flex items-center justify-between">
                <span>Họp AI & Đàm Thoại</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-mono">AI</span>
              </p>
              <div className="space-y-[2px]">
                <button
                  onClick={() => setActiveTab("meeting-ai")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "meeting-ai"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Họp trực tuyến & Trợ lý AI</span>
                </button>

                <button
                  onClick={() => setActiveTab("voice-video")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "voice-video"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <Mic className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>Thoại & Thiết bị Video</span>
                </button>
              </div>
            </div>

            {/* Group 3: Ứng Dụng & Bản Địa Hóa */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 mb-1.5">
                Ứng Dụng & Hệ Thống
              </p>
              <div className="space-y-[2px]">
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "appearance"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <Palette className="h-4 w-4 text-pink-400 shrink-0" />
                  <span>Giao diện & Bản địa hóa</span>
                </button>

                <button
                  onClick={() => setActiveTab("notifications")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "notifications"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <Bell className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Thông báo & Chuông báo</span>
                </button>

                <button
                  onClick={() => setActiveTab("chat-text")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "chat-text"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <MessageSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Tin nhắn & Trò chuyện</span>
                </button>

                <button
                  onClick={() => setActiveTab("privacy")}
                  className={cn(
                    "w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-left",
                    activeTab === "privacy"
                      ? "bg-zinc-700/60 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30"
                  )}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Bảo mật 3 tầng & An toàn</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Logout Button */}
          <div className="pt-3 border-t border-zinc-700/60 mt-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 bg-[#313338] p-7 overflow-y-auto relative flex flex-col">
          {/* Top Right ESC Badge */}
          <div className="absolute top-5 right-6 flex flex-col items-center z-10">
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-zinc-600 flex items-center justify-center hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">ESC</span>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: TÀI KHOẢN & ĐỊNH DANH */}
          {/* ========================================================================= */}
          {activeTab === "my-account" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <User className="h-5 w-5 text-sky-400" />
                  <span>Tài Khoản & Định Danh Doanh Nghiệp</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Thông tin nhận diện tài khoản Google và mã định danh nhân sự nội bộ.
                </p>
              </div>

              {/* Profile Card Banner */}
              <div className="bg-[#1e1f22] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                <div className="h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 relative">
                  <div className="absolute top-3 right-4">
                    <span className="text-[10px] font-mono font-bold bg-black/40 text-white px-2 py-0.5 rounded-full border border-white/20">
                      Google Workspace SSO
                    </span>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0 relative">
                  <div className="flex items-end justify-between -mt-12 mb-4">
                    <div className="relative">
                      <UserAvatar
                        src={profile?.imageUrl}
                        className="h-20 w-20 border-[4px] border-[#1e1f22] shadow-2xl"
                      />
                      <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#1e1f22]" />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onOpen("editProfile", { profile })}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-4 font-semibold rounded-xl"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      <span>Đổi ảnh đại diện</span>
                    </Button>
                  </div>

                  <div className="bg-[#2b2d31] p-4 rounded-xl space-y-3 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-zinc-400">
                          Tên hiển thị nhân sự
                        </p>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{profile?.name}</span>
                          {emp?.employeeCode && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              {emp.employeeCode}
                            </span>
                          )}
                        </p>
                      </div>
                      <ActionTooltip label="Tài khoản doanh nghiệp đã xác minh">
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                      </ActionTooltip>
                    </div>

                    <div className="h-[1px] bg-zinc-700/60" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-zinc-400">
                          Email công vụ (Google Account)
                        </p>
                        <p className="text-xs text-zinc-300 font-mono">{profile?.email}</p>
                      </div>
                      <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                        Đang hoạt động
                      </span>
                    </div>

                    <div className="h-[1px] bg-zinc-700/60" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-zinc-400">User ID</p>
                        <p className="text-xs font-mono text-zinc-400">{profile?.id}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onCopyId}
                        className="h-7 px-2.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg"
                      >
                        {copiedId ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span>{copiedId ? "Đã chép" : "Sao chép ID"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-zinc-400">
                  Trạng thái hoạt động (Activity Status)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {statusList.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setStatus(item.value)}
                      className={cn(
                        "flex items-start gap-x-2.5 p-3 rounded-xl border text-left transition",
                        status === item.value
                          ? "border-indigo-500 bg-indigo-950/40"
                          : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/50"
                      )}
                    >
                      <span className={cn("h-3 w-3 rounded-full mt-0.5 shrink-0", item.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">{item.label}</p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{item.desc}</p>
                      </div>
                      {status === item.value && (
                        <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: HỒ SƠ NHÂN SỰ & CƯ TRÚ (HR PROFILE) */}
          {/* ========================================================================= */}
          {activeTab === "hr-profile" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                  <span>Hồ Sơ Nhân Sự & Nơi Cư Trú</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Thông tin nhân sự, địa chỉ nơi ở, thâm niên và chức danh được bảo mật theo NĐ 13/2023/NĐ-CP.
                </p>
              </div>

              {empLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                  <p className="text-xs">Đang tải hồ sơ nhân sự...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveHrProfile} className="space-y-4">
                  {/* Summary Card */}
                  <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Chức danh công tác</span>
                      <strong className="text-white text-sm">{emp?.jobTitle || "Thành viên doanh nghiệp"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Thâm niên công tác</span>
                      <strong className="text-emerald-400 text-sm">{emp?.tenure || "Mới gia nhập"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Phòng ban & Tổ</span>
                      <strong className="text-indigo-300">{org?.unitName || "Doanh nghiệp"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Mã định danh CCCD</span>
                      <strong className="text-zinc-300 font-mono">{emp?.idCardNumber || "Chưa cập nhật"}</strong>
                    </div>
                  </div>

                  {/* Form Editable Fields */}
                  <div className="p-5 rounded-2xl bg-[#2b2d31] border border-zinc-800 space-y-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Edit className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Chỉnh sửa thông tin cá nhân của bạn</span>
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Họ và tên đầy đủ</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-400">Ngày sinh (tự động tính Tuổi)</label>
                        <input
                          type="date"
                          value={editDob}
                          onChange={(e) => setEditDob(e.target.value)}
                          className="w-full bg-[#1e1f22] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-400">Số điện thoại liên hệ</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-[#1e1f22] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="09xx xxx xxx"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Nơi ở hiện tại / Địa chỉ thường trú</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Số nhà, đường, phường, quận/huyện, tỉnh/TP"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-400">Số tài khoản nhận lương</label>
                        <input
                          type="text"
                          value={editBankAccount}
                          onChange={(e) => setEditBankAccount(e.target.value)}
                          className="w-full bg-[#1e1f22] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-400">Ngân hàng nhận lương</label>
                        <input
                          type="text"
                          value={editBankName}
                          onChange={(e) => setEditBankName(e.target.value)}
                          className="w-full bg-[#1e1f22] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Vietcombank, MB, Techcombank..."
                        />
                      </div>
                    </div>

                    {saveSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Đã lưu thành công thông tin hồ sơ của bạn!</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                      >
                        {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Lưu Thay Đổi Hồ Sơ</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LƯƠNG, NGÀY CÔNG & ĐÃI NGỘ */}
          {/* ========================================================================= */}
          {activeTab === "compensation" && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-400" />
                    <span>Lương, Ngày Công & Đãi Ngộ Cá Nhân</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Bảng kê chi tiết thu nhập, ngày công thực tế và quỹ phép năm của riêng bạn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSalary(!showSalary)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1.5 transition border border-white/10"
                >
                  {showSalary ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Ẩn số tiền</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 text-amber-400" />
                      <span>Hiện số tiền</span>
                    </>
                  )}
                </button>
              </div>

              {/* Total Salary Highlight */}
              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                      Tổng thu nhập thực lĩnh (Net)
                    </span>
                    <div className="text-3xl font-black text-amber-400 mt-1">
                      {showSalary ? (
                        `${(emp?.totalSalary || 0).toLocaleString("vi-VN")} đ`
                      ) : (
                        <span className="font-mono tracking-widest text-xl text-zinc-400">
                          •••••••••••• đ
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                    Kỳ lương Tháng 10/2026
                  </span>
                </div>

                <div className="pt-3 border-t border-amber-500/20 space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Lương cơ bản:</span>
                    <strong>{showSalary ? `${(emp?.baseSalary || 0).toLocaleString("vi-VN")} đ` : "•••••• đ"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Phụ cấp ăn trưa, xăng xe, trách nhiệm:</span>
                    <strong>{showSalary ? `${(emp?.allowance || 0).toLocaleString("vi-VN")} đ` : "•••••• đ"}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Thưởng hiệu suất KPI / Dự án:</span>
                    <strong>{showSalary ? `+${(emp?.bonus || 0).toLocaleString("vi-VN")} đ` : "•••••• đ"}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-amber-500/10 text-zinc-400">
                    <span>Mức đóng BHXH theo luật:</span>
                    <span>{showSalary ? `${(emp?.insuranceSalary || 0).toLocaleString("vi-VN")} đ` : "•••••• đ"}</span>
                  </div>
                </div>
              </div>

              {/* Attendance & Leave Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    Chấm công tháng này
                  </span>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-2xl font-black text-emerald-400">
                      {emp?.workedDaysThisMonth || 22.0}
                    </span>
                    <span className="text-xs text-zinc-400">/ 22.0 ngày chuẩn</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-medium">Đạt 100% ngày công</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-indigo-400" />
                    Quỹ ngày phép năm
                  </span>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-2xl font-black text-indigo-400">
                      {annualLeave.remainingDays}
                    </span>
                    <span className="text-xs text-zinc-400">/ {annualLeave.totalDays} ngày tổng</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Đã dùng: {annualLeave.usedDays} ngày</span>
                </div>
              </div>

              {/* Bank account */}
              <div className="p-3.5 rounded-2xl bg-[#1e1f22] border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <CreditCard className="h-4 w-4 text-sky-400" />
                  <span>Tài khoản nhận lương:</span>
                  <strong className="text-white font-mono">{emp?.bankAccount || "Chưa cập nhật"}</strong>
                </div>
                <span className="text-zinc-400 font-semibold">{emp?.bankName || "Vietcombank"}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: HỌP TRỰC TUYẾN & TRỢ LÝ AI (MEETING INTELLIGENCE) */}
          {/* ========================================================================= */}
          {activeTab === "meeting-ai" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span>Cấu Hình Họp Trực Tuyến & Biên Bản AI</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Thiết lập tự động ghi âm, cảnh báo đồng ý (Luật 91/2025/QH15) và trích xuất Action Items.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Consent banner compliance */}
                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[420px]">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-white">
                        Cảnh báo đồng ý ghi âm cuộc họp
                      </h4>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                        Luật 91/2025/QH15
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Hiển thị thanh thông báo bắt buộc yêu cầu thành viên xác nhận trước khi cuộc họp được ghi âm và phiên âm AI.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setConsentNotification(!consentNotification)}
                    className={cn(
                      "text-xs h-8 px-4 font-bold rounded-xl",
                      consentNotification
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {consentNotification ? "Đang Bật" : "Đã Tắt"}
                  </Button>
                </div>

                {/* 2. Auto recording */}
                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[420px]">
                    <h4 className="font-bold text-xs text-white">Tự động ghi âm cuộc họp (Auto Recording)</h4>
                    <p className="text-[11px] text-zinc-400">
                      Tự động bắt đầu ghi âm khi chủ tọa (Host) bắt đầu phòng họp trực tuyến.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAutoRecordMeeting(!autoRecordMeeting)}
                    className={cn(
                      "text-xs h-8 px-4 font-bold rounded-xl",
                      autoRecordMeeting
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {autoRecordMeeting ? "Đang Bật" : "Đã Tắt"}
                  </Button>
                </div>

                {/* 3. Auto AI Minutes */}
                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[420px]">
                    <h4 className="font-bold text-xs text-white">Tự động tạo biên bản tóm tắt bằng AI</h4>
                    <p className="text-[11px] text-zinc-400">
                      Sử dụng mô hình AI phân tích hội thoại và trích xuất các quyết định chính ngay sau khi cuộc họp kết thúc.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAutoAiMinutes(!autoAiMinutes)}
                    className={cn(
                      "text-xs h-8 px-4 font-bold rounded-xl",
                      autoAiMinutes
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {autoAiMinutes ? "Đang Bật" : "Đã Tắt"}
                  </Button>
                </div>

                {/* 4. Auto sync to Lark Base */}
                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[420px]">
                    <h4 className="font-bold text-xs text-white">Đồng bộ Action Items vào Bảng Việc Lark Base</h4>
                    <p className="text-[11px] text-zinc-400">
                      Tự động tạo các thẻ nhiệm vụ Kanban trong tổ từ danh sách đầu việc đã được xác nhận trong cuộc họp.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAutoSyncActionItems(!autoSyncActionItems)}
                    className={cn(
                      "text-xs h-8 px-4 font-bold rounded-xl",
                      autoSyncActionItems
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {autoSyncActionItems ? "Đang Bật" : "Đã Tắt"}
                  </Button>
                </div>

                {/* 5. Whisper Speech-to-Text Language */}
                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white">Ngôn ngữ nhận dạng phiên âm (Whisper STT)</h4>
                    <span className="text-[10px] text-zinc-400">Độ chính xác cao</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: "vi", label: "🇻🇳 Tiếng Việt (Chuẩn)" },
                      { code: "en", label: "🇺🇸 English" },
                      { code: "auto", label: "🌐 Tự động song ngữ" },
                    ].map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setWhisperLanguage(opt.code as any)}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-xs font-semibold text-center transition",
                          whisperLanguage === opt.code
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            : "bg-[#1e1f22] border-zinc-800 text-zinc-400 hover:text-white"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: THOẠI & THIẾT BỊ VIDEO */}
          {/* ========================================================================= */}
          {activeTab === "voice-video" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <Mic className="h-5 w-5 text-sky-400" />
                  <span>Thoại & Thiết Bị Video</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Điều chỉnh âm lượng, kiểm tra micro trực tiếp và bộ lọc chống ồn thông minh.
                </p>
              </div>

              {/* Volume Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2b2d31] p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-x-1.5">
                      <Mic className="h-4 w-4 text-sky-400" />
                      Âm lượng Micro
                    </span>
                    <span className="font-mono text-zinc-400">{inputVolume}%</span>
                  </div>
                  <DiscordSlider value={inputVolume} max={100} onChange={(val) => setInputVolume(val)} />
                </div>

                <div className="bg-[#2b2d31] p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-x-1.5">
                      <Headphones className="h-4 w-4 text-indigo-400" />
                      Âm lượng Loa
                    </span>
                    <span className="font-mono text-zinc-400">{outputVolume}%</span>
                  </div>
                  <DiscordSlider value={outputVolume} max={100} onChange={(val) => setOutputVolume(val)} />
                </div>
              </div>

              {/* Mic Test Section with VU Meter */}
              <div className="bg-[#2b2d31] p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">Kiểm tra Micro thời gian thực</h4>
                    <p className="text-[11px] text-zinc-400">Nói vào micro để kiểm tra cường độ tín hiệu sóng âm.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsMicTesting(!isMicTesting);
                      if (!isMicTesting) sounds.playMessageSent();
                    }}
                    className={cn(
                      "text-xs h-8 px-4 font-bold rounded-xl",
                      isMicTesting
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    )}
                  >
                    {isMicTesting ? "Dừng kiểm tra" : "Bắt đầu kiểm tra"}
                  </Button>
                </div>

                {/* Animated VU Meter Bar */}
                <div className="h-3.5 w-full bg-[#1e1f22] rounded-full overflow-hidden p-0.5 flex items-center">
                  <div
                    className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>

              {/* Input Mode */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-zinc-400">Chế độ kích hoạt đầu vào (Input Mode)</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVoiceMode("voice-activity")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition",
                      voiceMode === "voice-activity"
                        ? "border-indigo-500 bg-indigo-950/40"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40"
                    )}
                  >
                    <p className="font-semibold text-xs text-white">Kích hoạt bằng giọng nói</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Tự động thu âm khi bạn bắt đầu nói</p>
                  </button>

                  <button
                    onClick={() => setVoiceMode("push-to-talk")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition",
                      voiceMode === "push-to-talk"
                        ? "border-indigo-500 bg-indigo-950/40"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40"
                    )}
                  >
                    <p className="font-semibold text-xs text-white">Nhấn để nói (Push-to-Talk)</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Giữ phím để truyền âm thanh</p>
                  </button>
                </div>
              </div>

              {/* Advanced Audio Filters */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <p className="text-xs font-bold uppercase text-zinc-400">Bộ lọc âm thanh nâng cao</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#2b2d31] rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Khử tiếng ồn thông minh</h5>
                      <p className="text-[10px] text-zinc-400">Lọc tạp âm quạt, bàn phím</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setNoiseSuppression(!noiseSuppression)}
                      className={cn(
                        "h-7 px-2.5 text-xs rounded-lg font-bold",
                        noiseSuppression ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-400"
                      )}
                    >
                      {noiseSuppression ? "Bật" : "Tắt"}
                    </Button>
                  </div>

                  <div className="p-3 bg-[#2b2d31] rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Khử tiếng vang (Echo)</h5>
                      <p className="text-[10px] text-zinc-400">Chống dội âm thanh loa</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setEchoCancellation(!echoCancellation)}
                      className={cn(
                        "h-7 px-2.5 text-xs rounded-lg font-bold",
                        echoCancellation ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-400"
                      )}
                    >
                      {echoCancellation ? "Bật" : "Tắt"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: GIAO DIỆN & BẢN ĐỊA HÓA */}
          {/* ========================================================================= */}
          {activeTab === "appearance" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-pink-400" />
                  <span>Giao Diện & Bản Địa Hóa</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Tùy chỉnh chủ đề hiển thị, ngôn ngữ và múi giờ làm việc của doanh nghiệp.
                </p>
              </div>

              {/* Theme Picker */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-zinc-400">Chủ đề (Theme)</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex items-center gap-x-3 p-3.5 rounded-2xl border text-left transition",
                      theme === "dark"
                        ? "border-indigo-500 bg-indigo-950/40 text-white"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40 text-zinc-300"
                    )}
                  >
                    <Moon className="h-5 w-5 text-indigo-400" />
                    <div>
                      <p className="font-bold text-xs">Tối (Dark Theme)</p>
                      <p className="text-[10px] text-zinc-400">Chế độ tối dịu mắt Discord</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex items-center gap-x-3 p-3.5 rounded-2xl border text-left transition",
                      theme === "light"
                        ? "border-indigo-500 bg-indigo-950/40 text-white"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40 text-zinc-300"
                    )}
                  >
                    <Sun className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="font-bold text-xs">Sáng (Light Theme)</p>
                      <p className="text-[10px] text-zinc-400">Chế độ sáng văn phòng</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Language & Timezone */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <p className="text-xs font-bold uppercase text-zinc-400">Ngôn ngữ giao diện & Múi giờ</p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLanguage("vi")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition",
                      language === "vi"
                        ? "border-emerald-500 bg-emerald-950/40 text-white"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40 text-zinc-300"
                    )}
                  >
                    <p className="font-semibold text-xs flex items-center justify-between">
                      <span>🇻🇳 Tiếng Việt (Chuẩn)</span>
                      {language === "vi" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">Ngôn ngữ chính cho toàn bộ hệ thống</p>
                  </button>

                  <button
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition",
                      language === "en"
                        ? "border-emerald-500 bg-emerald-950/40 text-white"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40 text-zinc-300"
                    )}
                  >
                    <p className="font-semibold text-xs flex items-center justify-between">
                      <span>🇺🇸 English</span>
                      {language === "en" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">International enterprise interface</p>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Múi giờ làm việc hành chính:</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white focus:outline-none"
                  >
                    <option value="Asia/Ho_Chi_Minh">Hà Nội, TP.HCM (GMT+7) - Giờ hành chính Việt Nam</option>
                    <option value="Asia/Tokyo">Tokyo, Seoul (GMT+9)</option>
                    <option value="Europe/London">London (GMT+0)</option>
                    <option value="America/New_York">New York (EST / GMT-5)</option>
                  </select>
                </div>
              </div>

              {/* Chat density */}
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <p className="text-xs font-bold uppercase text-zinc-400">Mật độ hiển thị tin nhắn</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setChatDensity("cozy")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition",
                      chatDensity === "cozy"
                        ? "border-indigo-500 bg-indigo-950/40"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40"
                    )}
                  >
                    <p className="font-semibold text-xs text-white">Thoải mái (Cozy)</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Khoảng cách thoáng, hiển thị avatar đầy đủ</p>
                  </button>

                  <button
                    onClick={() => setChatDensity("compact")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition",
                      chatDensity === "compact"
                        ? "border-indigo-500 bg-indigo-950/40"
                        : "border-zinc-800 bg-[#2b2d31] hover:bg-zinc-700/40"
                    )}
                  >
                    <p className="font-semibold text-xs text-white">Gọn gàng (Compact)</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Tiết kiệm diện tích, xem được nhiều tin hơn</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: THÔNG BÁO & CHUÔNG BÁO */}
          {/* ========================================================================= */}
          {activeTab === "notifications" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-400" />
                  <span>Thông Báo & Âm Báo Hệ Thống</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Âm thanh thông báo tin nhắn mới, chuông vào phòng họp và nhắc hạn chót công việc.
                </p>
              </div>

              {/* Master Soundpack Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#2b2d31] border border-zinc-800">
                <div className="flex items-center gap-x-3">
                  {soundEnabled ? (
                    <Volume2 className="h-6 w-6 text-indigo-400" />
                  ) : (
                    <VolumeX className="h-6 w-6 text-zinc-500" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs text-white">Âm báo hệ thống (System Chimes)</h4>
                    <p className="text-[11px] text-zinc-400">Bật/tắt toàn bộ âm thanh thông báo cuộc họp và tin nhắn</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) sounds.playMessageReceived();
                  }}
                  className={cn(
                    "text-xs h-8 px-4 font-bold rounded-xl",
                    soundEnabled ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-300"
                  )}
                >
                  {soundEnabled ? "Đang Bật" : "Đang Tắt"}
                </Button>
              </div>

              {/* Individual Sound Previews */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-zinc-400">Thử nghiệm các âm thanh thông báo</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Tin nhắn công việc", desc: "Âm báo nhẹ", action: () => sounds.playMessageReceived() },
                    { label: "Gửi phản hồi", desc: "Âm gửi đi", action: () => sounds.playMessageSent() },
                    { label: "Vào phòng họp", desc: "Join room", action: () => sounds.playJoinVoice() },
                    { label: "Rời phòng họp", desc: "Leave room", action: () => sounds.playLeaveVoice() },
                    { label: "Tắt micro (Mute)", desc: "Mute tone", action: () => sounds.playMute() },
                    { label: "Bật micro (Unmute)", desc: "Unmute tone", action: () => sounds.playUnmute() },
                  ].map((s) => (
                    <div key={s.label} className="p-3 bg-[#2b2d31] rounded-xl border border-zinc-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">{s.label}</p>
                        <p className="text-[10px] text-zinc-400">{s.desc}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={s.action}
                        className="h-7 px-2.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-indigo-300 rounded-lg"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        <span>Nghe</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: TIN NHẮN & TRÒ CHUYỆN */}
          {/* ========================================================================= */}
          {activeTab === "chat-text" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                  <span>Tin Nhắn & Trò Chuyện (Text & Media)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Cấu hình hiển thị tin nhắn, mã Markdown và xem trước đường dẫn tài liệu.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">Định dạng mã lệnh Markdown (Code Blocks)</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Tự động làm nổi bật cú pháp code, chữ in đậm, in nghiêng</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    ✓ Luôn kích hoạt
                  </span>
                </div>

                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">Thả cảm xúc biểu tượng (Emoji Reactions)</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Hiển thị thanh phản ứng nhanh ❤️, 👍, 😂, 🔥</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    ✓ Luôn kích hoạt
                  </span>
                </div>

                <div className="p-4 bg-[#2b2d31] rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">Xem trước liên kết (Link Previews)</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Tự động tải thẻ mô tả và tiêu đề từ URL chia sẻ</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setMessagePreviews(!messagePreviews)}
                    className={cn(
                      "text-xs h-8 px-4 font-bold rounded-xl",
                      messagePreviews ? "bg-indigo-600 text-white" : "bg-zinc-700 text-zinc-300"
                    )}
                  >
                    {messagePreviews ? "Bật" : "Tắt"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: BẢO MẬT 3 TẦNG & QUYỀN RIÊNG TƯ */}
          {/* ========================================================================= */}
          {activeTab === "privacy" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span>Bảo Mật 3 Tầng & Quyền Riêng Tư Doanh Nghiệp</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân & tiêu chuẩn bảo mật Lark Base.
                </p>
              </div>

              {/* 3-Tier Security Matrix explanation */}
              <div className="p-5 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span>Ma trận bảo mật 3 tầng đang áp dụng cho tài khoản của bạn</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                    <span className="font-bold text-indigo-400 shrink-0">Tầng 1 (Công khai nội bộ):</span>
                    <span className="text-zinc-300">Họ tên, ảnh đại diện, chức vụ, phòng ban/tổ trực thuộc.</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                    <span className="font-bold text-amber-400 shrink-0">Tầng 2 (Tổ chuyên môn & Quản lý):</span>
                    <span className="text-zinc-300">Thâm niên công tác, ngày công thực tế, tiến độ nhiệm vụ Kanban.</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2.5">
                    <span className="font-bold text-rose-400 shrink-0">Tầng 3 (Tuyệt mật - Chỉ Chính chủ & HR):</span>
                    <span className="text-zinc-300">
                      Chi tiết Lương & Đãi ngộ, Số tài khoản ngân hàng, Nơi ở hiện tại, Số điện thoại cá nhân.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#2b2d31] border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Nhật ký truy vết bảo mật (Audit Trail)</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Mọi thao tác xem ngày công hoặc thông tin nhạy cảm đều được ghi log kiểm toán bất biến.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  Đang ghi nhận
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
