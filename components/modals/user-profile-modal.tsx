"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Edit,
  Mail,
  MessageSquare,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Building2,
  Award,
  Briefcase,
  Lock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { MemberRole } from "@prisma/client";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/action-tooltip";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useFriends } from "@/hooks/use-friends";
import { sounds } from "@/lib/sounds";

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: (
    <ShieldCheck className="h-3.5 w-3.5 mr-1 text-indigo-400" />
  ),
  [MemberRole.ADMIN]: (
    <ShieldAlert className="h-3.5 w-3.5 mr-1 text-rose-400" />
  )
};

const roleBadgeColor = {
  [MemberRole.GUEST]: "bg-zinc-700/60 text-zinc-300 border-zinc-600",
  [MemberRole.MODERATOR]: "bg-indigo-950/60 text-indigo-400 border-indigo-700/60",
  [MemberRole.ADMIN]: "bg-rose-950/60 text-rose-400 border-rose-700/60"
};

export function UserProfileModal() {
  const { isOpen, onClose, type, data, onOpen } = useModal();
  const { customStatus, customStatusEmoji } = useUserPreferences();
  const { friends, incoming, outgoing, sendFriendRequest, handleRequest } =
    useFriends();
  const [copiedId, setCopiedId] = useState(false);
  const router = useRouter();
  const params = useParams();

  const isModalOpen = isOpen && type === "userProfile";
  const member = data?.member;
  const profile = member?.profile || data?.profile;

  const isFriend = profile ? friends.some((f) => f.friend.id === profile.id) : false;
  const isOutgoingPending = profile
    ? outgoing.some((o) => o.receiver?.id === profile.id)
    : false;
  const isIncomingPending = profile
    ? incoming.some((i) => i.sender?.id === profile.id)
    : false;
  const isSelf = (data as any)?.currentProfileId === profile?.id;

  const [corporateData, setCorporateData] = useState<any>(null);

  React.useEffect(() => {
    if (isModalOpen && profile?.id) {
      fetch(`/api/profile/${profile.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((d) => setCorporateData(d))
        .catch(() => {});
    }
  }, [isModalOpen, profile?.id]);

  if (!profile) return null;


  const onCopyId = () => {
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const onSendMessage = () => {
    onClose();
    if (member?.id && params?.serverId) {
      router.push(`/servers/${params.serverId}/conversations/${member.id}`);
    }
  };

  const memberJoinedAt = member?.createdAt
    ? format(new Date(member.createdAt), "d MMMM, yyyy")
    : null;

  const profileCreatedAt = profile.createdAt
    ? format(new Date(profile.createdAt), "d MMMM, yyyy")
    : "Recently joined";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111214] text-zinc-200 p-0 overflow-hidden max-w-sm border border-zinc-800 shadow-2xl rounded-2xl select-none">
        <DialogHeader className="sr-only">
          <DialogTitle>User Profile - {profile.name}</DialogTitle>
        </DialogHeader>

        {/* Discord Colorful Banner */}
        <div className="h-28 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
          <div className="absolute top-2 right-2 flex items-center gap-x-1.5">
            <span className="p-1 rounded-full bg-black/30 backdrop-blur-sm text-white/90">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="px-5 pb-5 relative">
          {/* Avatar floating over banner */}
          <div className="relative -mt-14 mb-3 inline-block">
            <UserAvatar
              src={profile.imageUrl}
              className="h-24 w-24 border-[6px] border-[#111214] shadow-xl"
            />
            {/* Online Status Dot */}
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-[3.5px] border-[#111214]" />
          </div>

          {/* User Name & Badges */}
          <div className="bg-[#1e1f22] p-4 rounded-xl border border-zinc-800/80 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-white leading-tight">
                  {profile.name}
                </h3>
                {/* Badges container */}
                <div className="flex items-center gap-x-1 bg-[#111214] px-2 py-0.5 rounded-full border border-zinc-800">
                  <ActionTooltip label="Nhân sự nội bộ chính thức">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  </ActionTooltip>
                  {member?.role === MemberRole.ADMIN && (
                    <ActionTooltip label="Quản trị viên khối / Ban điều hành">
                      <Shield className="h-3.5 w-3.5 text-rose-400" />
                    </ActionTooltip>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                @{profile.email.split("@")[0]}
              </p>
            </div>

            {/* Custom Status Banner */}
            {customStatus && (
              <div className="bg-[#111214] px-3 py-2 rounded-lg border border-zinc-800 flex items-center gap-x-2 text-xs text-zinc-200">
                <span className="text-base shrink-0">{customStatusEmoji || "💬"}</span>
                <span className="font-medium truncate">{customStatus}</span>
              </div>
            )}

            <div className="h-[1px] bg-zinc-800 w-full" />

            {/* About Me Section */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Giới thiệu & Công việc
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed">
                💼 Nhân sự nội bộ doanh nghiệp. Sẵn sàng trao đổi công việc, họp dự án trực tuyến và phối hợp phòng ban.
              </p>
            </div>

            {/* Roles Section (if in server) */}
            {member && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Vai trò phòng ban
                </p>
                <div className="flex flex-wrap gap-1">
                  <span
                    className={`inline-flex items-center text-xs px-2 py-0.5 rounded-md border font-medium ${
                      roleBadgeColor[member.role]
                    }`}
                  >
                    {roleIconMap[member.role]}
                    {member.role === "ADMIN" ? "Quản trị viên" : member.role === "MODERATOR" ? "Điều phối viên" : "Thành viên"}
                  </span>
                </div>
              </div>
            )}

            {/* Corporate Profile Section */}
            {corporateData?.employee && (
              <div className="p-3 rounded-xl bg-[#1e1f22] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {corporateData.employee.jobTitle || "Nhân viên doanh nghiệp"}
                    </span>
                  </div>
                  {corporateData.employee.employeeCode && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      {corporateData.employee.employeeCode}
                    </span>
                  )}
                </div>

                {corporateData.orgUnits?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {corporateData.orgUnits.map((u: any) => (
                      <span
                        key={u.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#2b2d31] text-zinc-300 border border-white/5 flex items-center gap-1"
                      >
                        <Building2 className="h-2.5 w-2.5 text-indigo-400" />
                        {u.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Commendations */}
                {corporateData.commendations?.length > 0 && (
                  <div className="pt-1 border-t border-white/5 space-y-1">
                    {corporateData.commendations.map((c: any) => (
                      <div key={c.id} className="text-[11px] text-amber-300 flex items-center gap-1">
                        <Award className="h-3 w-3 text-amber-400 shrink-0" />
                        <span>{c.title}: {c.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3-tier Protected Fields */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
                  <div className="text-[10px]">
                    <span className="text-zinc-500 block">Thâm niên:</span>
                    {corporateData.employee.tenure !== undefined ? (
                      <span className="text-zinc-200 font-bold">{corporateData.employee.tenure} tháng</span>
                    ) : (
                      <span className="text-zinc-600 italic flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> Bảo mật</span>
                    )}
                  </div>
                  <div className="text-[10px]">
                    <span className="text-zinc-500 block">Công tháng này:</span>
                    {corporateData.employee.worked_days !== undefined ? (
                      <span className="text-emerald-400 font-bold">{corporateData.employee.worked_days} ngày</span>
                    ) : (
                      <span className="text-zinc-600 italic flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> Bảo mật</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Member Since Section */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Thời gian công tác
              </p>

              <div className="flex items-center gap-x-2 text-xs text-zinc-300">
                <Calendar className="h-4 w-4 text-zinc-500 shrink-0" />
                <span>Gia nhập hệ thống: {profileCreatedAt}</span>
              </div>
              {memberJoinedAt && (
                <div className="flex items-center gap-x-2 text-xs text-zinc-300 mt-1">
                  <Calendar className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Tham gia phòng ban: {memberJoinedAt}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-1 flex flex-col gap-y-2">
              <div className="flex items-center gap-x-2">
                {member && (
                  <Button
                    onClick={onSendMessage}
                    size="sm"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Send Message
                  </Button>
                )}

                {/* Add Friend / Friend Status Button */}
                {isSelf ? null : isFriend ? (
                  <Button
                    size="sm"
                    disabled
                    variant="secondary"
                    className="h-9 px-3 bg-emerald-950/40 text-emerald-400 border border-emerald-800 text-xs font-medium cursor-default"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                    Bạn bè
                  </Button>
                ) : isOutgoingPending ? (
                  <Button
                    size="sm"
                    disabled
                    variant="secondary"
                    className="h-9 px-3 bg-zinc-800/80 text-zinc-400 border border-zinc-700 text-xs font-medium cursor-default"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Đã gửi lời mời
                  </Button>
                ) : isIncomingPending ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      const req = incoming.find((i) => i.sender?.id === profile.id);
                      if (req) {
                        handleRequest.mutate({ friendshipId: req.friendshipId, action: "accept" });
                        sounds.playPop();
                      }
                    }}
                    className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Chấp nhận
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      sendFriendRequest.mutate({ targetUserId: profile.id });
                      sounds.playPop();
                    }}
                    disabled={sendFriendRequest.isLoading}
                    className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Kết bạn
                  </Button>
                )}

                <ActionTooltip label={copiedId ? "Copied!" : "Copy User ID"}>
                  <Button
                    onClick={onCopyId}
                    size="sm"
                    variant="secondary"
                    className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                  >
                    {copiedId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </ActionTooltip>
                <ActionTooltip label="Edit Profile">
                  <Button
                    onClick={() => {
                      onClose();
                      onOpen("editProfile", { profile });
                    }}
                    size="sm"
                    variant="secondary"
                    className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </ActionTooltip>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
