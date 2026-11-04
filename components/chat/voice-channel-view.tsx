"use client";

import React, { useState } from "react";
import { Channel, Member, Profile, Server } from "@prisma/client";
import {
  FileText,
  Hand,
  Maximize2,
  Minimize2,
  MessageSquare,
  PhoneOff,
  Users,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Crown,
  Lock,
  X,
  UserPlus,
  Plus,
  VolumeX,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMemberSidebar } from "@/components/chat/chat-member-sidebar";
import { ActionTooltip } from "@/components/action-tooltip";
import { Button } from "@/components/ui/button";
import { useVoiceState } from "@/hooks/use-voice-state";
import { useSocket } from "@/components/providers/socket-provider";
import { MeetingNotesDrawer } from "@/components/meeting/meeting-notes-drawer";
import { MeetingAttendanceModal } from "@/components/meeting/meeting-attendance-modal";
import { MeetingPinDialog } from "@/components/meeting/meeting-pin-dialog";
import { useRaiseHand } from "@/hooks/use-raise-hand";
import { useDepartmentPerspective } from "@/hooks/use-department-perspective";
import {
  getDepartmentCode,
  getDepartmentInfo,
  canAccessDepartment,
  guessMemberDepartment,
} from "@/lib/department-utils";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface VoiceChannelViewProps {
  channel: Channel;
  member: Member & { profile: Profile };
  server: Server & { members: (Member & { profile: Profile })[] };
  video: boolean;
}

export function VoiceChannelView({
  channel,
  member,
  server,
  video
}: VoiceChannelViewProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");

  const router = useRouter();
  const {
    connectVoice,
    disconnectVoice,
    removeParticipant,
    isSideChatOpen,
    toggleSideChat,
    setSideChatOpen,
    isManualFloating,
    toggleManualFloating,
  } = useVoiceState();
  const { socket } = useSocket();
  const setRaisedHand = useRaiseHand((s) => s.setRaisedHand);
  const { perspective, setPerspective } = useDepartmentPerspective();

  const deptCode = getDepartmentCode({
    name: channel.name,
    orgUnit: (channel as any).orgUnit,
  });
  const deptInfo = getDepartmentInfo(deptCode);
  const isAuthorized = canAccessDepartment(perspective, deptCode);

  const userId = member.profile.userId || member.id;
  const userName = member.profile.name || "Nhân sự";
  const isAdmin = member.role === "ADMIN" || member.role === "MODERATOR";
  const isHost = isAdmin;

  React.useEffect(() => {
    if (!isAuthorized) return;
    connectVoice(
      channel.serverId,
      channel.id,
      channel.name,
      {
        id: userId,
        name: userName,
        imageUrl: member.profile.imageUrl
      },
      video
    );
  }, [channel.serverId, channel.id, channel.name, userId, userName, member.profile.imageUrl, connectVoice, video, isAuthorized]);

  React.useEffect(() => {
    if (!socket) return;
    const onRaiseHand = (data: { channelId: string; memberId: string; isRaised: boolean }) => {
      if (data.channelId === channel.id) {
        setRaisedHand(data.memberId, data.isRaised);
      }
    };
    socket.on("voice:raise-hand", onRaiseHand);
    return () => {
      socket.off("voice:raise-hand", onRaiseHand);
    };
  }, [socket, channel.id, setRaisedHand]);

  const handleLeaveVoice = () => {
    removeParticipant(channel.id, userId);
    removeParticipant(channel.id, member.id);
    disconnectVoice(userId);
    setRaisedHand(userId, false);
    if (socket && channel.serverId) {
      socket.emit("voice:leave", {
        serverId: channel.serverId,
        channelId: channel.id,
        memberId: userId
      });
    }
    router.push(`/servers/${channel.serverId}`);
  };

  const handleToggleRaiseHand = () => {
    sounds.playPop();
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    setRaisedHand(userId, nextState);
    if (socket && channel.serverId) {
      socket.emit("voice:raise-hand", {
        channelId: channel.id,
        memberId: userId,
        memberName: userName,
        isRaised: nextState
      });
    }
  };

  const handleMuteAll = () => {
    sounds.playPop();
    const currentParticipants = useVoiceState.getState().participants[channel.id] || [];
    let count = 0;
    currentParticipants.forEach((p) => {
      if (p.id !== userId && p.id !== member.id) {
        useVoiceState.getState().setParticipantMute(channel.id, p.id, true);
        count++;
        if (socket) {
          socket.emit("voice:state", {
            channelId: channel.id,
            memberId: p.id,
            micMuted: true,
          });
        }
      }
    });
    alert(`Chủ tọa đã tắt mic của ${count > 0 ? count + " người" : "tất cả thành viên"} trong phòng họp!`);
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#111214] select-none h-full">
        <div className="h-20 w-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 shadow-2xl">
          <Lock className="h-10 w-10 text-amber-400" />
        </div>
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          Phòng Họp Trực Tuyến Bảo Mật Theo Phòng Ban
        </span>
        <h2 className="text-xl font-bold text-white mb-3">
          Phòng Họp: #{channel.name}
        </h2>
        <div className="max-w-md w-full bg-[#1e1f22] border border-white/10 rounded-2xl p-4 mb-6 text-xs text-zinc-300 text-left space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-zinc-400">Đơn vị chủ trì:</span>
            <span className={cn("px-2.5 py-0.5 rounded-full font-bold text-[11px]", deptInfo.badgeColor)}>
              {deptInfo.name}
            </span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-zinc-400">Góc nhìn phân quyền hiện tại:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-amber-300 font-mono font-bold text-[11px] border border-white/5">
              {perspective}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
            Quy chế bảo mật thông tin & hội họp: Chỉ cán bộ nhân sự thuộc <strong>{deptInfo.name}</strong> hoặc Ban Giám Đốc mới có thẩm quyền tham gia phiên họp này.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/servers/${channel.serverId}`)}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition shadow cursor-pointer"
          >
            Quay lại Kênh Chung (#general)
          </button>
          <button
            type="button"
            onClick={() => setPerspective("ALL")}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer flex items-center gap-1.5"
          >
            <Crown className="h-3.5 w-3.5 text-amber-300" />
            <span>Chuyển Góc Nhìn Boss (Xem tất cả)</span>
          </button>
        </div>
      </div>
    );
  }

  // Build attendance records from server members
  const participantsList = [
    {
      id: member.id,
      name: `${userName} (Bạn)`,
      email: member.profile.email,
      imageUrl: member.profile.imageUrl,
      joinedAt: "Vừa tham gia",
      role: member.role === "ADMIN" ? "Chủ tọa / Quản trị" : "Nhân sự",
      isHandRaised
    },
    ...server.members
      .filter((m) => m.id !== member.id)
      .slice(0, 8)
      .map((m) => ({
        id: m.id,
        name: m.profile.name,
        email: m.profile.email,
        imageUrl: m.profile.imageUrl,
        joinedAt: "Đang trực tuyến",
        role: m.role === "ADMIN" ? "Ban điều hành" : "Nhân sự",
        isHandRaised: false
      }))
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#313338] relative">
      {/* PIN Security Overlay (if room requires PIN and not unlocked) */}
      {!isUnlocked && (
        <MeetingPinDialog
          channelId={channel.id}
          channelName={channel.name}
          isAdmin={isAdmin}
          onUnlocked={() => setIsUnlocked(true)}
        />
      )}

      {/* Call Header Controls */}
      <div className="h-12 px-4 bg-[#1e1f22] border-b border-zinc-800/80 flex items-center justify-between shrink-0 select-none z-30 gap-x-3 shadow-sm">
        <div className="flex items-center gap-x-2.5 min-w-0">
          <div className="flex items-center gap-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-sm text-zinc-100 truncate">
              {channel.name}
            </span>
          </div>

          {/* Department badge */}
          <span
            className={cn(
              "hidden sm:inline-flex items-center gap-x-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium border",
              deptInfo.badgeColor
            )}
          >
            <Lock className="h-2.5 w-2.5" />
            <span>{deptInfo.shortName}</span>
          </span>

          {/* Host / Member role badge */}
          {isHost ? (
            <span className="hidden md:inline-flex items-center gap-x-1 text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              <Crown className="h-3 w-3 text-amber-400" />
              <span>Chủ tọa / Trưởng phòng</span>
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-x-1 text-[11px] bg-zinc-700/50 text-zinc-300 border border-white/5 px-2.5 py-0.5 rounded-full font-medium">
              <Shield className="h-3 w-3 text-zinc-400" />
              <span>Thành viên</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-x-2 shrink-0">
          {/* Mute All Button (Chỉ dành riêng cho Chủ tọa / Host) */}
          {isHost && (
            <ActionTooltip label="Tắt mic cả phòng (Chủ tọa giữ trật tự)" side="bottom">
              <button
                type="button"
                onClick={handleMuteAll}
                className="h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-x-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all duration-150 shadow-sm cursor-pointer"
              >
                <VolumeX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tắt mic cả phòng</span>
              </button>
            </ActionTooltip>
          )}

          {/* Raise Hand Button */}
          <ActionTooltip label={isHandRaised ? "Hạ tay xuống" : "Giơ tay phát biểu"} side="bottom">
            <button
              type="button"
              onClick={handleToggleRaiseHand}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium flex items-center gap-x-1.5 transition-all duration-150 shadow-sm",
                isHandRaised
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 border border-white/5"
              )}
            >
              <Hand className={cn("h-3.5 w-3.5", isHandRaised ? "text-white" : "text-amber-400")} />
              <span className="hidden sm:inline">{isHandRaised ? "Đang giơ tay" : "Giơ tay"}</span>
            </button>
          </ActionTooltip>

          {/* Meeting Notes Button */}
          <ActionTooltip label="Biên bản cuộc họp & Giao việc" side="bottom">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsNotesOpen(!isNotesOpen);
              }}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium flex items-center gap-x-1.5 transition-all duration-150 shadow-sm",
                isNotesOpen
                  ? "bg-[#5865f2] hover:bg-[#4752c4] text-white shadow-[0_0_12px_rgba(88,101,242,0.4)]"
                  : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 border border-white/5"
              )}
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Biên bản</span>
            </button>
          </ActionTooltip>

          {/* Attendance Log Button */}
          <ActionTooltip label="Danh sách điểm danh" side="bottom">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsAttendanceOpen(true);
              }}
              className="h-8 px-3 rounded-full text-xs font-medium flex items-center gap-x-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 border border-white/5 transition-all duration-150 shadow-sm"
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Điểm danh</span>
            </button>
          </ActionTooltip>

          {/* Quick Invite Colleagues Button */}
          <ActionTooltip label="Thêm người vào cuộc họp" side="bottom">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsInviteOpen(true);
              }}
              className="h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all duration-150 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">+ Thêm người</span>
            </button>
          </ActionTooltip>

          {/* Side-by-side Text Chat Toggle ("Hiện Trò Chuyện") */}
          <ActionTooltip
            label={isSideChatOpen ? "Ẩn trò chuyện" : "Hiện trò chuyện (Mở khung chat bên phải)"}
            side="bottom"
          >
            <button
              type="button"
              onClick={toggleSideChat}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-x-1.5 transition-all duration-150 shadow-sm",
                isSideChatOpen
                  ? "bg-[#5865f2] hover:bg-[#4752c4] text-white shadow-[0_0_12px_rgba(88,101,242,0.4)]"
                  : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 border border-white/5"
              )}
            >
              <MessageSquare className={cn("h-3.5 w-3.5", isSideChatOpen ? "text-white" : "text-sky-400")} />
              <span className="hidden sm:inline">{isSideChatOpen ? "Ẩn chat" : "Hiện trò chuyện"}</span>
            </button>
          </ActionTooltip>

          {/* Toggle Picture-in-Picture Floating Mode */}
          <ActionTooltip
            label={
              isManualFloating
                ? "Phóng to toàn màn hình"
                : "Thu nhỏ cuộc gọi để Chat (Discord PIP)"
            }
            side="bottom"
          >
            <button
              type="button"
              onClick={toggleManualFloating}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-x-1.5 transition-all duration-150 shadow-sm",
                isManualFloating
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                  : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 border border-white/5"
              )}
            >
              {isManualFloating ? (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-white" />
                  <span className="hidden sm:inline">Phóng to</span>
                </>
              ) : (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Thu nhỏ</span>
                </>
              )}
            </button>
          </ActionTooltip>

          {/* Leave Call Button */}
          <ActionTooltip label="Rời phòng họp" side="bottom">
            <button
              type="button"
              onClick={handleLeaveVoice}
              className="h-8 px-3.5 rounded-full text-xs font-semibold flex items-center gap-x-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all duration-150"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Rời phòng</span>
            </button>
          </ActionTooltip>
        </div>
      </div>

      {/* Meeting Notes Drawer Overlay */}
      <MeetingNotesDrawer
        channelId={channel.id}
        channelName={channel.name}
        userName={userName}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />

      {/* Meeting Attendance Modal */}
      <MeetingAttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        channelName={channel.name}
        participants={participantsList}
      />

      {/* Quick Invite Colleagues Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400">
                  <UserPlus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    Thêm Người Vào Phòng Họp
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Phòng: #{channel.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên hoặc email nhân sự..."
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Colleagues list sorted by department */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {server.members
                .filter(
                  (m) =>
                    m.id !== member.id &&
                    !useVoiceState
                      .getState()
                      .participants[channel.id]?.some(
                        (p) => p.id === m.id || p.name === m.profile.name
                      ) &&
                    (m.profile.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                     m.profile.email.toLowerCase().includes(inviteSearch.toLowerCase()))
                )
                .map((m) => {
                  const dept = guessMemberDepartment(m);
                  const isSameDept = dept.deptCode === deptCode;
                  return { member: m, dept, isSameDept };
                })
                .sort((a, b) => {
                  if (a.isSameDept && !b.isSameDept) return -1;
                  if (!a.isSameDept && b.isSameDept) return 1;
                  return a.member.profile.name.localeCompare(b.member.profile.name);
                })
                .map(({ member: m, dept, isSameDept }) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl transition border",
                      isSameDept
                        ? "bg-[#2b2d31]/80 hover:bg-[#2b2d31] border-emerald-500/20"
                        : "bg-[#2b2d31]/40 hover:bg-[#2b2d31] border-white/5 opacity-80"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={m.profile.imageUrl}
                        alt={m.profile.name}
                        className="h-7 w-7 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                          <span className="truncate">{m.profile.name}</span>
                          {isSameDept ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-bold shrink-0">
                              Cùng phòng
                            </span>
                          ) : (
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-white/10 px-1 rounded font-medium shrink-0">
                              Khác phòng
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                          <span>{dept.deptName}</span>
                          <span>•</span>
                          <span>{m.role === "ADMIN" ? "Quản trị viên" : "Nhân sự"}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playJoinVoice();
                        const newP = {
                          id: m.id,
                          name: m.profile.name,
                          imageUrl: m.profile.imageUrl,
                          micMuted: false,
                          deafened: false,
                          isSpeaking: false,
                        };
                        useVoiceState.getState().addParticipant(channel.id, newP);
                        if (socket) {
                          socket.emit("voice:join", {
                            serverId: channel.serverId,
                            channelId: channel.id,
                            member: newP,
                          });
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-white text-[11px] font-bold shadow transition shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer",
                        isSameDept
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-zinc-700 hover:bg-zinc-600"
                      )}
                    >
                      <Plus className="h-3 w-3" />
                      <span>Mời vào</span>
                    </button>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="relative flex-1 flex overflow-hidden w-full h-full bg-[#111214]">
        {/* Background Full Workspace Chat (rendered behind when isManualFloating is active) */}
        {isManualFloating && (
          <div className="flex-1 flex overflow-hidden w-full h-full bg-[#313338]">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <ChatMessages
                member={member}
                name={channel.name}
                chatId={channel.id}
                type="channel"
                apiUrl="/api/messages"
                socketUrl="/api/socket/messages"
                socketQuery={{
                  channelId: channel.id,
                  serverId: channel.serverId
                }}
                paramKey="channelId"
                paramValue={channel.id}
              />
              <ChatInput
                name={channel.name}
                type="channel"
                apiUrl="/api/socket/messages"
                query={{
                  channelId: channel.id,
                  serverId: channel.serverId
                }}
                currentMember={member}
              />
            </div>
            <ChatMemberSidebar members={server.members} />
          </div>
        )}

        {/* Side-by-side Text Chat Drawer: Only shown when full screen and user opens chat */}
        {!isManualFloating && isSideChatOpen && (
          <div className="w-80 md:w-96 border-l border-zinc-800/80 bg-[#313338] flex flex-col h-full shrink-0 z-30 ml-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="h-12 px-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-[#2b2d31]/70 select-none">
              <div className="flex items-center gap-x-2 text-xs font-bold text-zinc-200 truncate">
                <MessageSquare className="h-4 w-4 text-sky-400" />
                <span className="truncate">Trò chuyện: #{channel.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSideChatOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition"
                title="Đóng khung chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <ChatMessages
                member={member}
                name={channel.name}
                chatId={channel.id}
                type="channel"
                apiUrl="/api/messages"
                socketUrl="/api/socket/messages"
                socketQuery={{
                  channelId: channel.id,
                  serverId: channel.serverId
                }}
                paramKey="channelId"
                paramValue={channel.id}
              />
              <ChatInput
                name={channel.name}
                type="channel"
                apiUrl="/api/socket/messages"
                query={{
                  channelId: channel.id,
                  serverId: channel.serverId
                }}
                currentMember={member}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
