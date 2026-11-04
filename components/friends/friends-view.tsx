"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  MessageSquare,
  Phone,
  Video,
  X,
  Check,
  Search,
  Clock,
  Sparkles,
  UserX,
  Mail,
  UserCheck,
  Inbox,
  HelpCircle,
  MessageSquarePlus,
  Building2,
  Calendar,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Send,
  Radio
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Profile } from "@prisma/client";

import { useFriends } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionTooltip } from "@/components/action-tooltip";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { MeetingSchedulerView } from "@/components/meeting/meeting-scheduler-view";

type TabType = "online" | "all" | "pending" | "add_friend" | "calendar";

interface FriendsViewProps {
  currentProfile: Profile;
  suggestedProfiles?: Profile[];
}

export function FriendsView({
  currentProfile,
  suggestedProfiles = []
}: FriendsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatFriendId = searchParams?.get("chat");

  const [activeTab, setActiveTab] = useState<TabType>("online");
  const [addFriendInput, setAddFriendInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync tab from URL query
  React.useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "calendar" || tabParam === "meetings") {
      setActiveTab("calendar");
    }
  }, [searchParams]);

  // Quick direct message state
  const [dmMessages, setDmMessages] = useState<
    { id: string; senderId: string; text: string; time: string }[]
  >([]);
  const [dmInputText, setDmInputText] = useState("");

  const {
    friends,
    incoming,
    outgoing,
    sendFriendRequest,
    handleRequest,
    removeFriend
  } = useFriends();

  // Find active coworker if chat param exists
  const activeChatFriend = activeChatFriendId
    ? friends.find((f) => f.friend.id === activeChatFriendId)?.friend ||
      suggestedProfiles.find((p) => p.id === activeChatFriendId)
    : null;

  const handleSendDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInputText.trim()) return;

    sounds.playPop();
    const newMsg = {
      id: Date.now().toString(),
      senderId: currentProfile.id,
      text: dmInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setDmMessages((prev) => [...prev, newMsg]);
    setDmInputText("");
  };

  const handleSendRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addFriendInput.trim()) return;

    try {
      setFeedbackMsg(null);
      await sendFriendRequest.mutateAsync({
        targetEmail: addFriendInput.includes("@")
          ? addFriendInput.trim()
          : undefined,
        targetName: !addFriendInput.includes("@")
          ? addFriendInput.trim()
          : undefined
      });
      sounds.playPop();
      setFeedbackMsg({
        type: "success",
        text: `Đã gửi lời mời tham gia kết nối nội bộ tới ${addFriendInput}.`
      });
      setAddFriendInput("");
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text:
          err?.response?.data ||
          "Không thể gửi lời mời. Vui lòng kiểm tra lại email hoặc tên tài khoản nhân sự."
      });
    }
  };

  const handleSendToSuggested = async (targetUserId: string, name: string) => {
    try {
      await sendFriendRequest.mutateAsync({ targetUserId });
      sounds.playPop();
      setFeedbackMsg({
        type: "success",
        text: `Đã gửi lời mời kết nối tới đồng nghiệp ${name}!`
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.response?.data || "Gửi lời mời thất bại."
      });
    }
  };

  const filteredFriends = friends.filter(
    ({ friend }) =>
      friend.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // If viewing a Direct Message with a coworker
  if (activeChatFriend) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#313338] text-[#dbdee1] overflow-hidden">
        {/* DM Chat Header */}
        <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between bg-[#313338] shadow-sm shrink-0">
          <div className="flex items-center gap-x-3">
            <button
              onClick={() => {
                sounds.playPop();
                router.push("/channels/@me");
              }}
              className="p-1 hover:bg-[#35373c] rounded text-zinc-400 hover:text-white transition mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="relative">
              <UserAvatar src={activeChatFriend.imageUrl} className="h-8 w-8" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#313338]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight flex items-center gap-x-1.5">
                {activeChatFriend.name}
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-normal">
                  Đồng nghiệp
                </span>
              </p>
              <p className="text-[10px] text-zinc-400 leading-tight">
                @{activeChatFriend.email.split("@")[0]} • Đang làm việc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-x-2 text-zinc-400">
            <ActionTooltip label="Bắt đầu cuộc gọi thoại nội bộ">
              <button
                onClick={() => sounds.playPop()}
                className="p-2 hover:bg-[#35373c] hover:text-white rounded-md transition"
              >
                <Phone className="w-4 h-4" />
              </button>
            </ActionTooltip>
            <ActionTooltip label="Bắt đầu cuộc họp video 1-1">
              <button
                onClick={() => sounds.playPop()}
                className="p-2 hover:bg-[#35373c] hover:text-white rounded-md transition"
              >
                <Video className="w-4 h-4" />
              </button>
            </ActionTooltip>
          </div>
        </div>

        {/* DM Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end space-y-4">
          {/* Welcome Banner */}
          <div className="mb-auto pt-8">
            <UserAvatar src={activeChatFriend.imageUrl} className="h-16 w-16 mb-3" />
            <h2 className="text-xl font-bold text-white">{activeChatFriend.name}</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Đây là kênh trao đổi công việc trực tiếp riêng tư giữa bạn và{" "}
              <strong className="text-zinc-200">{activeChatFriend.name}</strong>. Mọi tài liệu và nội dung đều được bảo mật nội bộ công ty.
            </p>
          </div>

          {/* Messages list */}
          <div className="space-y-3">
            {dmMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-x-3 group">
                <UserAvatar
                  src={
                    msg.senderId === currentProfile.id
                      ? currentProfile.imageUrl
                      : activeChatFriend.imageUrl
                  }
                  className="h-9 w-9 shrink-0"
                />
                <div>
                  <div className="flex items-baseline gap-x-2">
                    <span className="font-semibold text-xs text-white">
                      {msg.senderId === currentProfile.id
                        ? currentProfile.name
                        : activeChatFriend.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">{msg.time}</span>
                  </div>
                  <p className="text-xs text-zinc-200 mt-0.5">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DM Chat Input */}
        <div className="p-4 pt-0">
          <form
            onSubmit={handleSendDm}
            className="bg-[#383a40] rounded-lg px-4 py-2.5 flex items-center gap-x-2 focus-within:ring-1 focus-within:ring-[#5865f2] transition"
          >
            <Input
              value={dmInputText}
              onChange={(e) => setDmInputText(e.target.value)}
              placeholder={`Gửi tin nhắn công việc cho @${activeChatFriend.name}...`}
              className="bg-transparent border-0 text-white placeholder:text-zinc-500 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
            />
            <button
              type="submit"
              disabled={!dmInputText.trim()}
              className="text-[#5865f2] hover:text-[#4752c4] disabled:opacity-40 transition p-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full bg-[#313338] text-[#dbdee1] overflow-hidden">
      {/* Middle Column: Internal Team Directory & Communication */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-[#1f2023]/60">
        {/* Header Bar with Tabs & Action Tools */}
        <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between bg-[#313338] shadow-sm shrink-0">
          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-2 text-zinc-400 font-semibold pr-3 border-r border-zinc-700/60">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">
                Nhân sự nội bộ
              </span>
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center gap-x-1.5 text-xs font-medium">
              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTab("online");
                  setFeedbackMsg(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-md transition font-semibold",
                  activeTab === "online"
                    ? "bg-zinc-700/60 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                )}
              >
                Đang làm việc
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTab("all");
                  setFeedbackMsg(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-md transition font-semibold",
                  activeTab === "all"
                    ? "bg-zinc-700/60 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                )}
              >
                Toàn bộ nhân sự ({friends.length})
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTab("pending");
                  setFeedbackMsg(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-md transition font-semibold flex items-center gap-x-1.5",
                  activeTab === "pending"
                    ? "bg-zinc-700/60 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                )}
              >
                Chờ duyệt
                {incoming.length > 0 && (
                  <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {incoming.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTab("calendar");
                  setFeedbackMsg(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-md transition text-xs font-semibold flex items-center gap-x-1.5",
                  activeTab === "calendar"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                )}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Lịch họp & Sự kiện
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTab("add_friend");
                  setFeedbackMsg(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-md transition text-xs font-semibold",
                  activeTab === "add_friend"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                )}
              >
                Thêm đồng nghiệp
              </button>
            </div>
          </div>

          {/* Right Header Action Icons */}
          <div className="flex items-center gap-x-3 text-zinc-400">
            <ActionTooltip label="Hộp thư công ty">
              <button
                onClick={() => sounds.playPop()}
                className="hover:text-white transition"
              >
                <Inbox className="w-4 h-4" />
              </button>
            </ActionTooltip>

            <ActionTooltip label="Hỗ trợ kỹ thuật nội bộ">
              <button
                onClick={() => sounds.playPop()}
                className="hover:text-white transition"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </ActionTooltip>
          </div>
        </div>

        {/* Tab Content Area */}
        {activeTab === "calendar" ? (
          <MeetingSchedulerView currentUserName={currentProfile.name} />
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {/* ADD EMPLOYEE TAB */}
            {activeTab === "add_friend" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-white text-base font-bold uppercase tracking-wide flex items-center gap-x-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  Mời nhân sự mới vào không gian làm việc
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Nhập địa chỉ email công ty hoặc tên nhân sự để gửi lời mời kết nối trực tiếp trong tổ chức.
                </p>
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendRequest}
                className="bg-[#1e1f22] p-3 rounded-lg border border-zinc-800 flex items-center gap-x-2 focus-within:border-[#5865f2] transition"
              >
                <Input
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="Nhập email nhân viên (ví dụ: nhanvien@company.com)..."
                  className="bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 text-xs placeholder:text-zinc-500"
                />
                <Button
                  type="submit"
                  disabled={!addFriendInput.trim() || sendFriendRequest.isLoading}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold px-4 h-9 shrink-0 disabled:opacity-50"
                >
                  Gửi lời mời kết nối
                </Button>
              </form>

              {/* Feedback Message */}
              {feedbackMsg && (
                <div
                  className={cn(
                    "p-3 rounded-lg text-xs font-medium animate-in fade-in duration-200",
                    feedbackMsg.type === "success"
                      ? "bg-emerald-950/40 border border-emerald-800 text-emerald-400"
                      : "bg-rose-950/40 border border-rose-800 text-rose-400"
                  )}
                >
                  {feedbackMsg.text}
                </div>
              )}

              {/* Suggested Coworkers Section */}
              {suggestedProfiles.length > 0 && (
                <div className="pt-4 border-t border-zinc-700/60 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    Cán bộ nhân viên cùng phòng ban
                  </h3>
                  <div className="space-y-2">
                    {suggestedProfiles.map((p) => {
                      const isAlreadyFriend = friends.some(
                        (f) => f.friend.id === p.id
                      );
                      const isPendingOut = outgoing.some(
                        (o) => o.receiver?.id === p.id
                      );

                      if (p.id === currentProfile.id) return null;

                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] transition border border-zinc-700/40"
                        >
                          <div className="flex items-center gap-x-3">
                            <UserAvatar src={p.imageUrl} className="h-9 w-9" />
                            <div>
                              <p className="text-xs font-semibold text-white">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                {p.email}
                              </p>
                            </div>
                          </div>

                          {isAlreadyFriend ? (
                            <span className="text-xs text-emerald-400 flex items-center font-medium">
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Đã kết nối
                            </span>
                          ) : isPendingOut ? (
                            <span className="text-xs text-zinc-400 flex items-center font-medium">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              Đã gửi lời mời
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSendToSuggested(p.id, p.name)}
                              disabled={sendFriendRequest.isLoading}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8 px-3"
                            >
                              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                              Kết nối
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PENDING TAB */}
          {activeTab === "pending" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-white text-xs font-bold uppercase tracking-wide">
                  Lời mời kết nối đang chờ duyệt ({incoming.length})
                </h2>
                {incoming.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    Hiện không có yêu cầu kết nối nào đang chờ xử lý.
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {incoming.map(({ friendshipId, sender }) => (
                      <div
                        key={friendshipId}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] transition border border-zinc-700/40"
                      >
                        <div className="flex items-center gap-x-3">
                          <UserAvatar
                            src={sender?.imageUrl}
                            className="h-9 w-9"
                          />
                          <div>
                            <p className="text-xs font-semibold text-white">
                              {sender?.name}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              {sender?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              handleRequest.mutate({
                                friendshipId,
                                action: "accept"
                              });
                              sounds.playPop();
                            }}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Đồng ý
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              handleRequest.mutate({
                                friendshipId,
                                action: "decline"
                              });
                              sounds.playPop();
                            }}
                            className="h-8 bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-medium px-3 border border-zinc-700"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              {outgoing.length > 0 && (
                <div className="pt-4 border-t border-zinc-700/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Lời mời đã gửi đi ({outgoing.length})
                  </h3>
                  <div className="space-y-2">
                    {outgoing.map(({ friendshipId, receiver }) => (
                      <div
                        key={friendshipId}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#2b2d31]/60 border border-zinc-800"
                      >
                        <div className="flex items-center gap-x-3">
                          <UserAvatar
                            src={receiver?.imageUrl}
                            className="h-8 w-8"
                          />
                          <div>
                            <p className="text-xs font-medium text-zinc-200">
                              {receiver?.name}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              Đang chờ đồng nghiệp xác nhận
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            handleRequest.mutate({
                              friendshipId,
                              action: "decline"
                            });
                            sounds.playPop();
                          }}
                          className="text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 h-7"
                        >
                          Hủy yêu cầu
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL & ONLINE TABS */}
          {(activeTab === "all" || activeTab === "online") && (
            <div className="space-y-4">
              {/* Filter Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Tìm kiếm đồng nghiệp theo tên hoặc email..."
                  className="pl-9 bg-[#1e1f22] border-0 text-white placeholder:text-zinc-500 text-xs h-9 focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pt-2">
                {activeTab === "online" ? "Đang trực tuyến" : "Danh bạ nhân sự"} —{" "}
                {filteredFriends.length} thành viên
              </p>

              {filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 border border-zinc-700">
                    <Users className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-medium text-zinc-300">
                    {activeTab === "online"
                      ? "Hiện chưa có nhân sự nào khác đang online."
                      : "Chưa có đồng nghiệp nào trong danh bạ cá nhân của bạn."}
                  </p>
                  <Button
                    onClick={() => {
                      sounds.playPop();
                      setActiveTab("add_friend");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Thêm đồng nghiệp
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredFriends.map(({ friendshipId, friend }) => (
                    <div
                      key={friendshipId}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#35373c]/70 transition group border-t border-transparent hover:border-zinc-700/40"
                    >
                      <div className="flex items-center gap-x-3 min-w-0">
                        <div className="relative">
                          <UserAvatar
                            src={friend.imageUrl}
                            className="h-9 w-9"
                          />
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#313338]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-white">
                            {friend.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {friend.email}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-x-1.5">
                        <ActionTooltip label="Trao đổi công việc 1-1">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => {
                              sounds.playPop();
                              router.push(`/channels/@me?chat=${friend.id}`);
                            }}
                            className="h-8 w-8 bg-[#2b2d31] hover:bg-[#1e1f22] text-zinc-300 hover:text-white rounded-md"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>

                        <ActionTooltip label="Bắt đầu cuộc gọi video">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => {
                              sounds.playPop();
                              router.push(`/channels/@me?chat=${friend.id}`);
                            }}
                            className="h-8 w-8 bg-[#2b2d31] hover:bg-[#1e1f22] text-zinc-300 hover:text-white rounded-md"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>

                        <ActionTooltip label="Hủy kết nối">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(
                                  `Bạn có chắc muốn hủy kết nối với đồng nghiệp ${friend.name}?`
                                )
                              ) {
                                removeFriend.mutate(friendshipId);
                                sounds.playPop();
                              }
                            }}
                            className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-md"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Right Column: "Hoạt động & Phòng họp công ty" (Company Meeting & Activity Hub) */}
      <div className="hidden xl:flex flex-col w-80 h-full border-l border-[#1f2023] p-4 select-none shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-x-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Hoạt động công ty
          </h3>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
            Trực tiếp
          </span>
        </div>

        {/* Security & Confidentiality Card */}
        <div className="bg-[#2b2d31]/80 rounded-xl p-4 border border-zinc-800 text-left space-y-2.5 shadow-md">
          <div className="flex items-center gap-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Không gian nội bộ bảo mật
              </h4>
              <p className="text-[10px] text-zinc-400">
                Chỉ dành riêng cho nhân sự công ty
              </p>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Tất cả các phiên họp thoại, phòng họp trực tuyến và tài liệu chia sẻ đều được giới hạn bảo mật trong tổ chức.
          </p>
        </div>

        {/* Quick Conference Room launcher */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-zinc-900 rounded-xl p-4 border border-indigo-500/30 space-y-3">
          <div className="flex items-center gap-x-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white">
              Phòng họp ban lãnh đạo
            </h4>
          </div>
          <p className="text-[10px] text-zinc-300">
            Khởi tạo cuộc họp nhanh có hỗ trợ chia sẻ màn hình, âm thanh chuẩn HD và phụ đề.
          </p>
          <Button
            size="sm"
            onClick={() => {
              sounds.playPop();
              router.push("/servers");
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8"
          >
            Vào phòng họp công ty
          </Button>
        </div>

        {/* Coworker Directory Preview */}
        <div className="pt-2 border-t border-zinc-800/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Nhân sự trong tổ chức
          </p>
          <div className="space-y-1.5">
            {suggestedProfiles.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#2b2d31]/50 hover:bg-[#2b2d31] transition"
              >
                <div className="flex items-center gap-x-2.5 truncate min-w-0">
                  <UserAvatar src={p.imageUrl} className="h-7 w-7" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {p.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    sendFriendRequest.mutate({ targetUserId: p.id });
                    sounds.playPop();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-6 text-[10px] px-2 shrink-0"
                >
                  Kết nối
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
