"use client";

import React, { useEffect, useState, memo } from "react";
import { Member, MemberRole, Profile } from "@prisma/client";
import {
  Check,
  Copy,
  Edit,
  FileIcon,
  Pin,
  Reply,
  ShieldAlert,
  ShieldCheck,
  Trash
} from "lucide-react";
import { usePinnedMessages } from "@/hooks/use-pinned-messages";
import Image from "next/image";
import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";

import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useSocket } from "@/components/providers/socket-provider";
import { EmojiPicker } from "@/components/emoji-picker";
import { sounds } from "@/lib/sounds";
import { MessageContent } from "@/components/chat/message-content";
import { useUserPreferences } from "@/hooks/use-user-preferences";

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & { profile: Profile };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
  isOptimistic?: boolean;
  isFailed?: boolean;
  reactions?: { emoji: string; memberIds: string[] }[];
  onReply?: (message: { id: string; name: string; content: string }) => void;
}

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />
};

const formSchema = z.object({
  content: z.string().min(1)
});

export const ChatItem = memo(function ChatItem({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketUrl,
  socketQuery,
  isOptimistic,
  isFailed,
  reactions = [],
  onReply
}: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const { onOpen } = useModal();
  const { socket } = useSocket();
  const { chatDensity } = useUserPreferences();
  const { pinMessage, unpinMessage, isPinned } = usePinnedMessages();

  const chatId = socketQuery.channelId || socketQuery.conversationId || "";
  const isItemPinned = isPinned(chatId, id);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleCloseMenu = () => setContextMenuPos(null);
    if (contextMenuPos) {
      window.addEventListener("click", handleCloseMenu);
      window.addEventListener("scroll", handleCloseMenu);
    }
    return () => {
      window.removeEventListener("click", handleCloseMenu);
      window.removeEventListener("scroll", handleCloseMenu);
    };
  }, [contextMenuPos]);

  const params = useParams();
  const router = useRouter();

  const onCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onReactionClick = (emoji: string) => {
    if (!socket || isOptimistic || deleted) return;
    const chatId = socketQuery.channelId || socketQuery.conversationId;
    socket.emit("chat:reaction", {
      chatId,
      messageId: id,
      emoji,
      memberId: currentMember.id,
      name: (currentMember as any).profile?.name || "Member"
    });
    sounds.playPop();
  };

  const onMemberClick = () => {
    onOpen("userProfile", { member });
  };

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event: any) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content
    }
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery
      });

      await axios.patch(url, values);

      form.reset();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    form.reset({ content });
  }, [content, form]);

  const fileType = fileUrl?.split(".").pop();

  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && !isOptimistic && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && !isOptimistic && isOwner && !fileUrl;
  const isPDF = fileType === "pdf" && fileUrl;
  const isImage = !isPDF && fileUrl;

  return (
    <div
      id={`message-${id}`}
      data-message-id={id}
      onContextMenu={handleContextMenu}
      className={cn(
        "relative group flex items-center hover:bg-black/5 transition-colors duration-300 w-full",
        chatDensity === "compact" ? "py-1 px-4" : "p-4",
        isOptimistic && "opacity-70",
        isItemPinned && "border-l-2 border-indigo-500 pl-3.5"
      )}
    >
      <div className="group flex gap-x-2 items-center w-full">
        <div
          onClick={onMemberClick}
          className="cursor-pointer hover:drop-shadow-md transition shrink-0"
        >
          <UserAvatar
            src={member.profile.imageUrl}
            className={chatDensity === "compact" ? "h-7 w-7 md:h-7 md:w-7" : undefined}
          />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p
                onClick={onMemberClick}
                className={cn(
                  "font-semibold text-sm hover:underline cursor-pointer",
                  member.role === MemberRole.ADMIN && "text-rose-500 dark:text-rose-400 font-bold",
                  member.role === MemberRole.MODERATOR && "text-indigo-500 dark:text-indigo-400 font-bold"
                )}
              >
                {member.profile.name}
              </p>
              <ActionTooltip label={member.role}>
                {roleIconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
            {isOptimistic && (
              <span className="text-[10px] text-zinc-400 italic">
                (sending...)
              </span>
            )}
            {isFailed && (
              <span className="text-[10px] text-rose-500 italic">
                (failed to send)
              </span>
            )}
          </div>
          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
            >
              <Image
                src={fileUrl}
                alt={content}
                fill
                className="object-cover"
              />
            </a>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                PDF File
              </a>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <MessageContent
              content={content}
              deleted={deleted}
              isUpdated={isUpdated}
            />
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            placeholder="Edited message"
                            className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button disabled={isLoading} size="sm" variant="primary">
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}
          {/* Emoji Reactions List */}
          {reactions && reactions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {reactions.map((reaction) => {
                const hasReacted = reaction.memberIds.includes(
                  currentMember.id
                );
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    onClick={() => onReactionClick(reaction.emoji)}
                    className={cn(
                      "flex items-center gap-x-1 px-2 py-0.5 rounded-md text-xs border transition select-none",
                      hasReacted
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-[11px] font-medium">
                      {reaction.memberIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Quick Action Bar on Hover */}
      {!deleted && !isOptimistic && (
        <div className="hidden group-hover:flex items-center gap-x-1 absolute p-1 -top-3.5 right-4 bg-white dark:bg-[#313338] border border-zinc-200 dark:border-zinc-700 shadow-md rounded-md z-10 select-none">
          {/* Quick Reaction Emojis */}
          {["❤️", "👍", "😂", "🔥"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReactionClick(emoji)}
              className="hover:scale-125 transition px-1 py-0.5 text-xs select-none"
            >
              {emoji}
            </button>
          ))}

          {/* Emoji Picker Popover */}
          <div className="px-0.5">
            <EmojiPicker onChange={(emoji) => onReactionClick(emoji)} />
          </div>

          {/* Copy Text */}
          <ActionTooltip label={copied ? "Copied!" : "Copy Text"}>
            <button
              type="button"
              onClick={onCopy}
              className="p-1 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition rounded"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </ActionTooltip>

          {/* Pin Button */}
          {chatId && !deleted && (
            <ActionTooltip label={isItemPinned ? "Bỏ ghim" : "Ghim tin nhắn"}>
              <button
                type="button"
                onClick={() => {
                  if (isItemPinned) {
                    unpinMessage(chatId, id);
                  } else {
                    pinMessage(chatId, {
                      id,
                      chatId,
                      content,
                      fileUrl,
                      authorName: member.profile.name,
                      authorAvatar: member.profile.imageUrl,
                      createdAt: timestamp,
                      pinnedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    });
                  }
                  sounds.playPop();
                }}
                className={cn(
                  "p-1 transition rounded",
                  isItemPinned
                    ? "text-indigo-400 bg-indigo-500/10 hover:text-indigo-300"
                    : "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                )}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            </ActionTooltip>
          )}

          {/* Reply Button */}
          {onReply && (
            <ActionTooltip label="Reply">
              <button
                type="button"
                onClick={() =>
                  onReply({
                    id,
                    name: member.profile.name,
                    content
                  })
                }
                className="p-1 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition rounded"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            </ActionTooltip>
          )}

          {/* Edit Button */}
          {canEditMessage && (
            <ActionTooltip label="Edit">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition rounded"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </ActionTooltip>
          )}

          {/* Delete Button */}
          {canDeleteMessage && (
            <ActionTooltip label="Delete">
              <button
                type="button"
                onClick={() =>
                  onOpen("deleteMessage", {
                    apiUrl: `${socketUrl}/${id}`,
                    query: socketQuery
                  })
                }
                className="p-1 text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition rounded"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </ActionTooltip>
          )}
        </div>
      )}

      {/* Discord Right-Click Context Menu */}
      {contextMenuPos && (
        <div
          style={{ top: `${contextMenuPos.y}px`, left: `${contextMenuPos.x}px` }}
          className="fixed z-50 min-w-[190px] bg-[#111214] border border-zinc-800 rounded-xl p-1.5 shadow-2xl text-xs text-zinc-300 space-y-[2px] animate-in fade-in-0 zoom-in-95 duration-100 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {onReply && !deleted && (
            <button
              onClick={() => {
                onReply({ id, name: member.profile.name, content });
                setContextMenuPos(null);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white transition font-medium"
            >
              <span>Trả lời</span>
              <Reply className="h-3.5 w-3.5" />
            </button>
          )}

          {chatId && !deleted && (
            <button
              onClick={() => {
                if (isItemPinned) {
                  unpinMessage(chatId, id);
                } else {
                  pinMessage(chatId, {
                    id,
                    chatId,
                    content,
                    fileUrl,
                    authorName: member.profile.name,
                    authorAvatar: member.profile.imageUrl,
                    createdAt: timestamp,
                    pinnedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  });
                }
                sounds.playPop();
                setContextMenuPos(null);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white transition font-medium"
            >
              <span>{isItemPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}</span>
              <Pin className={cn("h-3.5 w-3.5", isItemPinned && "text-indigo-400 fill-indigo-400")} />
            </button>
          )}

          <button
            onClick={() => {
              onCopy();
              setContextMenuPos(null);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white transition font-medium"
          >
            <span>Sao chép văn bản</span>
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(id);
              sounds.playPop();
              setContextMenuPos(null);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white transition font-medium"
          >
            <span>Sao chép ID tin nhắn</span>
            <Check className="h-3.5 w-3.5" />
          </button>

          {canEditMessage && (
            <button
              onClick={() => {
                setIsEditing(true);
                setContextMenuPos(null);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white transition font-medium"
            >
              <span>Chỉnh sửa tin nhắn</span>
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}

          {canDeleteMessage && (
            <>
              <div className="h-[1px] bg-zinc-800 my-1" />
              <button
                onClick={() => {
                  setContextMenuPos(null);
                  onOpen("deleteMessage", {
                    apiUrl: `${socketUrl}/${id}`,
                    query: socketQuery
                  });
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-rose-400 hover:bg-rose-600 hover:text-white transition font-medium"
              >
                <span>Xóa tin nhắn</span>
                <Trash className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.content === next.content &&
    prev.deleted === next.deleted &&
    prev.isUpdated === next.isUpdated &&
    prev.fileUrl === next.fileUrl &&
    prev.timestamp === next.timestamp &&
    prev.isOptimistic === next.isOptimistic &&
    prev.isFailed === next.isFailed &&
    prev.reactions === next.reactions &&
    prev.member?.id === next.member?.id &&
    prev.currentMember?.id === next.currentMember?.id
  );
});
