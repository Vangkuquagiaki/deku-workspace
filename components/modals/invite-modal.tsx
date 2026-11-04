"use client";

import React, { useState } from "react";
import { Check, Copy, RefreshCw, Share2, Users, UserPlus } from "lucide-react";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useModal } from "@/hooks/use-modal-store";
import { useOrigin } from "@/hooks/use-origin";
import { useFriends } from "@/hooks/use-friends";
import { sounds } from "@/lib/sounds";

export function InviteModal() {
  const { isOpen, onOpen, onClose, type, data } = useModal();
  const origin = useOrigin();
  const { friends } = useFriends();

  const isModalOpen = isOpen && type === "invite";
  const { server } = data;

  const [copied, setCopied] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const inviteUrl = `${origin}/invite/${server?.inviteCode}`;

  const onCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    sounds.playPop();

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tham gia Không gian ${server?.name} (Nội bộ Doanh nghiệp)`,
          text: `Bạn được cấp quyền tham gia không gian phòng ban / dự án "${server?.name}". Nhấn vào liên kết nội bộ để tham gia:`,
          url: inviteUrl
        });
      } catch (err) {
        // Ignored or cancelled
      }
    } else {
      onCopy();
    }
  };

  const onInviteFriend = (friendId: string) => {
    navigator.clipboard.writeText(
      `Mời bạn tham gia không gian phòng ban "${server?.name}" (Nội bộ): ${inviteUrl}`
    );
    setInvitedFriends((prev) => ({ ...prev, [friendId]: true }));
    sounds.playPop();
  };

  const onNew = async () => {
    try {
      setIsLoading(true);

      const response = await axios.patch(
        `/api/servers/${server?.id}/invite-code`
      );

      onOpen("invite", { server: response.data });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#313338] text-zinc-200 p-0 overflow-hidden border border-zinc-700/80 shadow-2xl max-w-md">
        <DialogHeader className="pt-6 px-6 pb-2">
          <div className="flex items-center gap-x-3 mb-1">
            {server?.imageUrl ? (
              <img
                src={server.imageUrl}
                alt={server?.name}
                className="w-10 h-10 rounded-2xl object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white">
                {server?.name?.charAt(0)}
              </div>
            )}
            <div>
              <DialogTitle className="text-lg font-bold text-white text-left">
                Mời nhân sự vào {server?.name}
              </DialogTitle>
              <p className="text-xs text-zinc-400 text-left">
                Chia sẻ liên kết nội bộ bảo mật để nhân viên tham gia phòng ban / phòng họp này
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-4">
          <div>
            <Label className="uppercase text-[11px] font-bold text-zinc-400">
              Liên kết truy cập nội bộ (Private Invite Link)
            </Label>
            <div className="flex items-center mt-2 gap-x-2">
              <Input
                readOnly
                disabled={isLoading}
                value={inviteUrl}
                className="bg-[#1e1f22] border-0 focus-visible:ring-0 text-zinc-200 focus-visible:ring-offset-0 text-xs font-mono select-all h-10"
              />
              <Button
                disabled={isLoading}
                onClick={onCopy}
                className={copied ? "bg-emerald-600 hover:bg-emerald-700 text-white min-w-[90px]" : "bg-indigo-600 hover:bg-indigo-700 text-white min-w-[90px]"}
                size="sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Sao chép
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              disabled={isLoading}
              onClick={onNew}
              variant="link"
              size="sm"
              className="text-xs text-zinc-400 hover:text-zinc-200 p-0 h-auto font-normal"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Tạo liên kết mới
            </Button>

            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <Button
                onClick={onShare}
                variant="ghost"
                size="sm"
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 h-8"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Chia sẻ liên kết
              </Button>
            )}
          </div>

          {/* Quick Invite Friends Section */}
          {friends.length > 0 && (
            <div className="pt-2 border-t border-zinc-700/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Mời đồng nghiệp trong danh bạ nội bộ
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {friends.map(({ friendshipId, friend }) => {
                  const isSent = invitedFriends[friend.id];
                  return (
                    <div
                      key={friendshipId}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] transition"
                    >
                      <div className="flex items-center gap-x-2.5 min-w-0">
                        <UserAvatar
                          src={friend.imageUrl}
                          className="h-8 w-8 shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">
                            {friend.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            @{friend.email.split("@")[0]}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onInviteFriend(friend.id)}
                        disabled={isSent}
                        className={
                          isSent
                            ? "bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 h-7 text-xs px-2.5"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-2.5"
                        }
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Đã chép lời mời
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            Mời
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
