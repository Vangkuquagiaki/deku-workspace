"use client";

import React, { useState, useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import {
  Mic,
  MicOff,
  PhoneOff,
  Plus,
  UserPlus,
  Users,
  Video,
  X,
  Radio,
  Search,
  Check,
  Sparkles,
  Volume2
} from "lucide-react";
import { useVoiceState, VoiceParticipant } from "@/hooks/use-voice-state";
import { useUser } from "@clerk/nextjs";
import { useSocket } from "@/components/providers/socket-provider";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import {
  getDepartmentCode,
  guessMemberDepartment,
} from "@/lib/department-utils";

interface AvailableMember {
  id: string;
  name: string;
  imageUrl: string;
  role: string;
}

interface ActiveMeetingSidebarProps {
  serverId: string;
  currentUser: {
    id: string;
    name: string;
    imageUrl: string;
    role?: string;
  };
  channels: {
    id: string;
    name: string;
    type: string;
  }[];
  availableMembers: AvailableMember[];
}

export function ActiveMeetingSidebar({
  serverId,
  currentUser = { id: "", name: "", imageUrl: "" },
  channels = [],
  availableMembers = [],
}: ActiveMeetingSidebarProps) {
  const params = useParams();
  const pathname = usePathname() || "";
  const pathChannelId = pathname.includes("/channels/")
    ? pathname.split("/channels/")[1]?.split("/")[0]?.split("?")[0]
    : null;
  const currentChannelId = (params?.channelId as string) || pathChannelId || null;

  const { user } = useUser();
  const { socket } = useSocket();

  const {
    connectedChannelId,
    connectedServerId,
    connectedChannelName,
    participants,
    addParticipant,
    removeParticipant,
    setParticipantMute,
  } = useVoiceState();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine active channel:
  // Either user is connected to a voice channel in this server, OR user is viewing a voice channel in this server
  const activeVoiceChannel = useMemo(() => {
    const voiceChannels = (channels || []).filter(
      (c) => c && (c.type === "AUDIO" || c.type === "VIDEO")
    );

    // 1. If currently connected in this server
    if (connectedChannelId && connectedServerId === serverId) {
      return (
        voiceChannels.find((c) => c.id === connectedChannelId) || {
          id: connectedChannelId,
          name: connectedChannelName || "Phòng họp",
          type: "VIDEO",
        }
      );
    }

    // 2. If viewing a voice channel in this server
    if (currentChannelId) {
      const match = voiceChannels.find((c) => c.id === currentChannelId);
      if (match) return match;
    }

    // 3. Fallback: If connected anywhere
    if (connectedChannelId) {
      return {
        id: connectedChannelId,
        name: connectedChannelName || "Phòng họp",
        type: "VIDEO",
      };
    }

    return null;
  }, [channels, connectedChannelId, connectedServerId, serverId, currentChannelId, connectedChannelName]);

  const activeChannelId = activeVoiceChannel?.id;

  // Real-time participants from state
  const rawParticipants = activeChannelId
    ? participants[activeChannelId] || []
    : [];

  // Build complete participants list, ensuring current user is ALWAYS present when viewing/connected
  const activeParticipants = useMemo(() => {
    if (!activeChannelId) return [];

    const list: VoiceParticipant[] = [...rawParticipants];

    // Check if current user is in list
    const hasCurrentUser = list.some(
      (p) =>
        (currentUser.id && p.id === currentUser.id) ||
        (user?.id && p.id === user.id) ||
        (currentUser.name && p.name && p.name.trim() === currentUser.name.trim()) ||
        (user?.fullName && p.name && p.name.trim() === user.fullName.trim())
    );

    // If not yet in list, prepend current user so user always sees themselves on the left!
    if (!hasCurrentUser) {
      list.unshift({
        id: currentUser.id || user?.id || "local-user",
        name: currentUser.name || user?.fullName || "Bạn",
        imageUrl: currentUser.imageUrl || user?.imageUrl || "",
        micMuted: false,
        deafened: false,
        isSpeaking: false,
      });
    }

    return list;
  }, [activeChannelId, rawParticipants, currentUser, user]);

  const channelTitle = activeVoiceChannel?.name || "Phòng họp trực tuyến";
  const roomDeptCode = useMemo(() => getDepartmentCode({ name: channelTitle }), [channelTitle]);

  // Filter members who are NOT in the room yet
  const notJoinedMembers = useMemo(() => {
    return (availableMembers || []).filter(
      (m) =>
        !activeParticipants.some(
          (p) =>
            p.id === m.id ||
            (m.name && p.name && p.name.trim() === m.name.trim())
        )
    );
  }, [availableMembers, activeParticipants]);

  const sortedInviteMembers = useMemo(() => {
    return notJoinedMembers
      .filter((m) =>
        (m.name || "").toLowerCase().includes(searchMember.toLowerCase())
      )
      .map((m) => {
        const dept = guessMemberDepartment(m);
        const isSameDept = dept.deptCode === roomDeptCode;
        return { ...m, dept, isSameDept };
      })
      .sort((a, b) => {
        if (a.isSameDept && !b.isSameDept) return -1;
        if (!a.isSameDept && b.isSameDept) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [notJoinedMembers, searchMember, roomDeptCode]);

  // Wait for client mount to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // If not on or connected to a voice channel, don't show to keep sidebar clean
  if (!activeVoiceChannel || !activeChannelId) {
    return null;
  }

  const handleAddMember = (m: AvailableMember) => {
    sounds.playJoinVoice();
    const newParticipant: VoiceParticipant = {
      id: m.id,
      name: m.name,
      imageUrl: m.imageUrl,
      micMuted: false,
      deafened: false,
      isSpeaking: false,
    };

    addParticipant(activeChannelId, newParticipant);

    if (socket) {
      socket.emit("voice:join", {
        serverId,
        channelId: activeChannelId,
        member: newParticipant,
      });
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    sounds.playLeaveVoice();
    removeParticipant(activeChannelId, memberId);
    removeParticipant(activeChannelId, memberName);

    if (socket) {
      socket.emit("voice:leave", {
        serverId,
        channelId: activeChannelId,
        memberId,
      });
    }
  };

  const handleToggleMute = (p: VoiceParticipant) => {
    const nextMuted = !p.micMuted;
    setParticipantMute(activeChannelId, p.id, nextMuted);
    if (socket) {
      socket.emit("voice:state", {
        channelId: activeChannelId,
        memberId: p.id,
        micMuted: nextMuted,
      });
    }
  };

  return (
    <div className="mb-3 px-1 animate-in fade-in-50 duration-200">
      {/* Active Room Header Card */}
      <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-[#1e1f22] to-[#1e1f22] border border-emerald-500/40 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-white truncate">
              #{channelTitle}
            </span>
          </div>

          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
            {activeParticipants.length} trong phòng
          </span>
        </div>

        {/* Quick "+ Thêm người vào họp" Button */}
        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="w-full h-7 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>+ Thêm người vào họp</span>
        </button>

        {/* Real-time Participants List */}
        <div className="space-y-1.5 pt-1 border-t border-zinc-800/80 max-h-60 overflow-y-auto pr-0.5">
          {activeParticipants.map((p) => {
            const isLocal = Boolean(
              p.id === currentUser.id ||
              p.id === user?.id ||
              (currentUser.name && p.name && p.name.includes(currentUser.name)) ||
              (user?.fullName && p.name && p.name.includes(user.fullName))
            );

            return (
              <div
                key={p.id}
                className="group/item flex items-center justify-between px-2 py-1.5 rounded-xl bg-black/40 hover:bg-zinc-800/70 transition text-xs border border-white/[0.05]"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={p.imageUrl}
                      className={cn(
                        "h-6 w-6 transition-all duration-200",
                        p.isSpeaking && !p.micMuted
                          ? "ring-2 ring-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.85)] animate-pulse scale-105"
                          : !p.micMuted
                          ? "ring-1 ring-zinc-700/60"
                          : "ring-1 ring-rose-500/40 opacity-70"
                      )}
                    />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black transition-colors duration-150",
                        p.isSpeaking && !p.micMuted
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]"
                          : !p.micMuted
                          ? "bg-zinc-600"
                          : "bg-rose-500"
                      )}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-white truncate flex items-center gap-1">
                      <span className="truncate">{p.name}</span>
                      {isLocal && (
                        <span className="text-[9px] text-emerald-400 font-bold shrink-0">
                          (Bạn)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {/* Mic toggle */}
                  <button
                    type="button"
                    disabled={!isLocal && currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR"}
                    onClick={() => {
                      if (isLocal || currentUser.role === "ADMIN" || currentUser.role === "MODERATOR") {
                        handleToggleMute(p);
                      }
                    }}
                    title={
                      !isLocal && currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR"
                        ? p.micMuted
                          ? "Thành viên đang tắt mic"
                          : "Thành viên đang bật mic"
                        : p.micMuted
                        ? "Bật Mic"
                        : p.isSpeaking
                        ? "Đang nói (Nhấn để tắt mic)"
                        : "Mic đang bật (Không nói)"
                    }
                    className={cn(
                      "p-1 rounded transition",
                      isLocal || currentUser.role === "ADMIN" || currentUser.role === "MODERATOR"
                        ? "cursor-pointer"
                        : "cursor-default opacity-70",
                      p.micMuted
                        ? "text-rose-400 hover:bg-rose-950/40"
                        : p.isSpeaking
                        ? "text-emerald-400 animate-pulse hover:bg-emerald-950/40 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
                    )}
                  >
                    {p.micMuted ? (
                      <MicOff className="h-3 w-3" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                  </button>

                  {/* Remove / Kick Button: Chỉ Chủ tọa / Quản trị viên mới có quyền mời rời phòng */}
                  {!isLocal && (currentUser.role === "ADMIN" || currentUser.role === "MODERATOR") && (
                    <ActionTooltip label="Mời rời phòng họp (Quyền Chủ tọa)" side="right">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(p.id, p.name)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </ActionTooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Colleagues Modal */}
      {isInviteModalOpen && (
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
                    Kênh: #{channelTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
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
                placeholder="Tìm tên nhân sự..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* List of Available Members to Invite */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {sortedInviteMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  {notJoinedMembers.length === 0
                    ? "Tất cả nhân sự đã có mặt trong phòng họp!"
                    : "Không tìm thấy nhân sự phù hợp."}
                </div>
              ) : (
                sortedInviteMembers.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl transition border",
                      m.isSameDept
                        ? "bg-[#2b2d31]/80 hover:bg-[#2b2d31] border-emerald-500/20"
                        : "bg-[#2b2d31]/40 hover:bg-[#2b2d31] border-white/5 opacity-80"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar src={m.imageUrl} className="h-7 w-7 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                          <span className="truncate">{m.name}</span>
                          {m.isSameDept ? (
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
                          <span>{m.dept.deptName}</span>
                          <span>•</span>
                          <span>
                            {m.role === "ADMIN"
                              ? "Quản trị viên"
                              : m.role === "MODERATOR"
                              ? "Điều hành viên"
                              : "Thành viên"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddMember(m)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-white text-[11px] font-bold shadow transition shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer",
                        m.isSameDept
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-zinc-700 hover:bg-zinc-600"
                      )}
                    >
                      <Plus className="h-3 w-3" />
                      <span>Mời vào</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
