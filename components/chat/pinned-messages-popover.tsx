"use client";

import React, { useState } from "react";
import { Pin, Trash2, ExternalLink, MessageSquare } from "lucide-react";
import Image from "next/image";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { usePinnedMessages } from "@/hooks/use-pinned-messages";
import { sounds } from "@/lib/sounds";

interface PinnedMessagesPopoverProps {
  chatId: string;
}

export function PinnedMessagesPopover({ chatId }: PinnedMessagesPopoverProps) {
  const [open, setOpen] = useState(false);
  const { pinnedMessages, unpinMessage } = usePinnedMessages();
  const list = pinnedMessages[chatId] || [];

  const handleJumpToMessage = (messageId: string) => {
    setOpen(false);
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-indigo-500/20", "dark:bg-indigo-500/30");
      setTimeout(() => {
        element.classList.remove("bg-indigo-500/20", "dark:bg-indigo-500/30");
      }, 2000);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ActionTooltip side="bottom" label="Tin nhắn đã ghim">
        <PopoverTrigger asChild>
          <button className="relative hover:opacity-75 transition p-1.5 rounded-md hover:bg-zinc-700/10 dark:hover:bg-zinc-700/40 text-zinc-500 dark:text-zinc-400">
            <Pin className="h-5 w-5" />
            {list.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {list.length > 9 ? "9+" : list.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
      </ActionTooltip>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 md:w-96 p-0 bg-white dark:bg-[#2b2d31] border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-lg overflow-hidden"
      >
        <div className="p-3 bg-zinc-100 dark:bg-[#1e1f22] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <Pin className="h-4 w-4 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-200">
              Tin nhắn đã ghim ({list.length})
            </h4>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
          {list.length === 0 ? (
            <div className="py-8 text-center px-4">
              <MessageSquare className="h-8 w-8 text-zinc-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Chưa có tin nhắn nào được ghim
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Nhấp chuột phải vào tin nhắn bất kỳ và chọn &quot;Ghim tin nhắn&quot; để lưu tại đây.
              </p>
            </div>
          ) : (
            list.map((msg) => (
              <div
                key={msg.id}
                className="p-3 hover:bg-zinc-50 dark:hover:bg-[#313338] transition group flex flex-col gap-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-2 min-w-0">
                    <UserAvatar
                      src={msg.authorAvatar}
                      className="h-6 w-6 shrink-0"
                    />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {msg.authorName}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {msg.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleJumpToMessage(msg.id)}
                      className="p-1 text-zinc-400 hover:text-indigo-400 rounded transition"
                      title="Nhảy tới tin nhắn"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        unpinMessage(chatId, msg.id);
                        sounds.playPop();
                      }}
                      className="p-1 text-zinc-400 hover:text-rose-400 rounded transition"
                      title="Bỏ ghim"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 select-text pl-8">
                  {msg.content}
                </p>

                {msg.fileUrl && !msg.fileUrl.endsWith(".pdf") && (
                  <div className="relative h-20 w-32 ml-8 mt-1 rounded overflow-hidden border border-zinc-700">
                    <Image
                      fill
                      src={msg.fileUrl}
                      alt="Pinned image"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
