"use client";

import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Reply, X, Lock } from "lucide-react";
import axios from "axios";
import qs from "query-string";

import { Member, Profile } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";

import {
  FormControl,
  Form,
  FormField,
  FormItem
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";
import { useSocket } from "@/components/providers/socket-provider";
import { sounds } from "@/lib/sounds";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useChatReply } from "@/hooks/use-chat-reply-store";
import { ChatSoundboard } from "@/components/chat/chat-soundboard";
import { useDepartmentPerspective } from "@/hooks/use-department-perspective";
import {
  getDepartmentCode,
  getDepartmentInfo,
  canAccessDepartment,
} from "@/lib/department-utils";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
  currentMember?: Member & { profile: Profile };
}

const formSchema = z.object({
  content: z.string().min(1)
});

export function ChatInput({
  apiUrl,
  query,
  name,
  type,
  currentMember
}: ChatInputProps) {
  const { onOpen } = useModal();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { replyingTo, clearReply } = useChatReply();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" }
  });

  const chatId = query.channelId || query.conversationId;

  const handleInputChange = (
    value: string,
    fieldOnChange: (val: string) => void
  ) => {
    fieldOnChange(value);

    if (!socket || !chatId) return;

    const now = Date.now();
    if (value.trim().length > 0) {
      if (now - lastTypingTimeRef.current > 2000) {
        lastTypingTimeRef.current = now;
        socket.emit("chat:typing", {
          chatId,
          memberId: currentMember?.id,
          name: currentMember?.profile?.name || "Someone"
        });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:stop-typing", {
          chatId,
          memberId: currentMember?.id
        });
      }, 2500);
    } else {
      lastTypingTimeRef.current = 0;
      socket.emit("chat:stop-typing", {
        chatId,
        memberId: currentMember?.id
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const trimmedContent = values.content.trim();
    if (!trimmedContent) return;

    // Reset input immediately for 0ms latency typing feel
    form.setValue("content", "");
    form.reset({ content: "" });

    // Handle reply quote prefix
    const finalContent = replyingTo
      ? `> Replying to @${replyingTo.name}: "${replyingTo.content.slice(0, 45)}..."\n${trimmedContent}`
      : trimmedContent;

    clearReply();

    // Stop typing indicator
    if (socket && chatId) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("chat:stop-typing", {
        chatId,
        memberId: currentMember?.id
      });
    }

    // Play subtle Discord message sent pop
    if (useUserPreferences.getState().soundEnabled) {
      sounds.playMessageSent();
    }

    const queryKey = query.channelId
      ? `chat:${query.channelId}`
      : `chat:${query.conversationId}`;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMessage = {
      id: tempId,
      content: finalContent,
      fileUrl: null,
      channelId: query.channelId,
      conversationId: query.conversationId,
      memberId: currentMember?.id || "temp-member",
      member: currentMember || {
        id: "temp-member",
        role: "GUEST",
        profile: {
          name: "You",
          imageUrl: ""
        }
      },
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true
    };

    // Optimistically update React Query cache immediately
    queryClient.setQueryData([queryKey], (oldData: any) => {
      if (!oldData || !oldData.pages || oldData.pages.length === 0) {
        return {
          pages: [
            {
              items: [optimisticMessage]
            }
          ]
        };
      }

      const newData = [...oldData.pages];
      newData[0] = {
        ...newData[0],
        items: [optimisticMessage, ...newData[0].items]
      };

      return {
        ...oldData,
        pages: newData
      };
    });

    // Send HTTP POST in the background without blocking the UI
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query
      });

      const response = await axios.post(url, { content: finalContent });

      if (response?.data) {
        const realMessage = response.data;
        queryClient.setQueryData([queryKey], (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;

          const alreadyAdded = oldData.pages.some((page: any) =>
            page.items.some((item: any) => item.id === realMessage.id)
          );

          const newData = oldData.pages.map((page: any, index: number) => {
            if (index !== 0) return page;

            const items = page.items
              .map((item: any) => {
                if (item.id === tempId) {
                  return alreadyAdded ? null : realMessage;
                }
                return item;
              })
              .filter(Boolean);

            return {
              ...page,
              items
            };
          });

          return {
            ...oldData,
            pages: newData
          };
        });
      }
    } catch (error) {
      console.error(error);
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newData = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: any) =>
            item.id === tempId ? { ...item, isFailed: true } : item
          )
        }));
        return { ...oldData, pages: newData };
      });
    }
  };

  const { perspective } = useDepartmentPerspective();
  const deptCode = getDepartmentCode({ name });
  const deptInfo = getDepartmentInfo(deptCode);
  const isAuthorized = canAccessDepartment(perspective, deptCode);
  const isExecutiveOnly =
    deptCode === "BDH" &&
    currentMember?.role !== "ADMIN" &&
    perspective !== "ALL" &&
    perspective !== "BDH";

  if (type === "channel" && !isAuthorized) {
    return (
      <div className="relative p-4 pb-6 select-none">
        <div className="p-3.5 rounded-2xl bg-[#2b2d31]/90 border border-amber-500/30 flex items-center justify-between text-xs shadow-lg backdrop-blur">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Chế độ Chỉ đọc (Read-only)</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                  {deptInfo.shortName}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Bạn đang ở góc nhìn <strong className="text-zinc-200">{perspective}</strong>. Chỉ nhân sự thuộc {deptInfo.name} hoặc Ban Giám Đốc mới có quyền đăng tin trong kênh này.
              </p>
            </div>
          </div>
          <span className="text-[11px] bg-zinc-800 text-zinc-400 border border-white/5 px-2.5 py-1 rounded-xl font-medium shrink-0 ml-3">
            Không có quyền gửi
          </span>
        </div>
      </div>
    );
  }

  if (type === "channel" && isExecutiveOnly) {
    return (
      <div className="relative p-4 pb-6 select-none">
        <div className="p-3.5 rounded-2xl bg-[#2b2d31]/90 border border-amber-500/30 flex items-center justify-between text-xs shadow-lg backdrop-blur">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Kênh Chỉ Thị & Nghị Quyết Ban Giám Đốc</span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Chỉ Ban Lãnh Đạo (C-Level / Admin) mới có quyền đăng chỉ thị tại kênh này. Nhân sự chỉ có quyền tiếp nhận.
              </p>
            </div>
          </div>
          <span className="text-[11px] bg-zinc-800 text-zinc-400 border border-white/5 px-2.5 py-1 rounded-xl font-medium shrink-0 ml-3">
            Chỉ đọc
          </span>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative p-4 pb-6">
                  {replyingTo && (
                    <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-300/80 dark:bg-[#28292c] rounded-t-lg border-b border-zinc-300 dark:border-zinc-700/80 text-xs mb-[-1px] select-none">
                      <div className="flex items-center gap-x-2 text-zinc-600 dark:text-zinc-300 truncate">
                        <Reply className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span>Replying to</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          @{replyingTo.name}
                        </span>
                        <span className="text-[11px] truncate opacity-75 max-w-[200px] md:max-w-md italic">
                          &quot;{replyingTo.content}&quot;
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearReply}
                        className="p-1 hover:bg-zinc-400/40 dark:hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen("messageFile", { apiUrl, query })
                      }
                      className="absolute left-4 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center z-10"
                    >
                      <Plus className="text-white dark:text-[#313338]" />
                    </button>
                    <Input
                      placeholder={`Message ${
                        type === "conversation" ? name : "#" + name
                      }`}
                      className={`px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 ${
                        replyingTo ? "rounded-t-none" : ""
                      }`}
                      value={field.value}
                      onChange={(e) =>
                        handleInputChange(e.target.value, field.onChange)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                    />
                    <div className="absolute right-4 z-10 flex items-center gap-x-2">
                      <ChatSoundboard
                        chatId={query.channelId || query.conversationId}
                        senderName={currentMember?.profile?.name}
                      />
                      <EmojiPicker
                        onChange={(emoji: string) =>
                          field.onChange(`${field.value} ${emoji}`)
                        }
                      />
                    </div>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
