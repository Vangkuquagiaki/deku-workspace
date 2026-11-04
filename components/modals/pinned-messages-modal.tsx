"use client";

import React from "react";
import { Pin, MessageSquare, ExternalLink } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";

export function PinnedMessagesModal() {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "pinnedMessages";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-[#313338] text-black dark:text-zinc-200 p-0 overflow-hidden max-w-md">
        <DialogHeader className="pt-6 px-6 pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-x-2 text-zinc-800 dark:text-zinc-100">
            <Pin className="h-5 w-5 text-indigo-500" />
            Pinned Messages
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Quick reference for important announcements and pinned content in this channel.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Information box */}
          <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-[#2b2d31] border border-zinc-200 dark:border-zinc-700/60 flex items-start gap-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-500 shrink-0 mt-0.5">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Welcome to the Discord Channel!
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Remember to follow server community guidelines. Be respectful, keep text channels on-topic, and enjoy your time together.
              </p>
              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                Pinned by Admin
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-[#2b2d31] border border-zinc-200 dark:border-zinc-700/60 flex items-start gap-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500 shrink-0 mt-0.5">
              <Pin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Live Voice & Video Meetings
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Switch to Voice Channels or Video Channels in the sidebar anytime for real-time audio and screen sharing powered by LiveKit!
              </p>
              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                Pinned by Moderator
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
