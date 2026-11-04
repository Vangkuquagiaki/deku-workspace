"use client";

import React, { useState } from "react";
import { Member, Profile } from "@prisma/client";
import { Maximize2, MessageSquare, PhoneOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import qs from "query-string";

import { MediaRoom } from "@/components/media-room";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { ActionTooltip } from "@/components/action-tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DmConversationViewProps {
  currentMember: Member & { profile: Profile };
  otherMember: Member & { profile: Profile };
  conversationId: string;
  isVideoCall: boolean;
}

export function DmConversationView({
  currentMember,
  otherMember,
  conversationId,
  isVideoCall
}: DmConversationViewProps) {
  const [isSplit, setIsSplit] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleEndCall = () => {
    const url = qs.stringifyUrl(
      {
        url: pathname || "",
        query: {
          video: undefined
        }
      },
      { skipNull: true }
    );
    router.push(url);
  };

  // If not in a call, just render normal 1-on-1 chat
  if (!isVideoCall) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatMessages
          member={currentMember}
          name={otherMember.profile.name}
          chatId={conversationId}
          type="conversation"
          apiUrl="/api/direct-messages"
          paramKey="conversationId"
          paramValue={conversationId}
          socketUrl="/api/socket/direct-messages"
          socketQuery={{
            conversationId
          }}
        />
        <ChatInput
          name={otherMember.profile.name}
          type="conversation"
          apiUrl="/api/socket/direct-messages"
          query={{
            conversationId
          }}
          currentMember={currentMember}
        />
      </div>
    );
  }

  // If in a call: provide Split / Maximize toggle controls!
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#313338] relative">
      {/* Call Header Controls */}
      <div className="h-10 px-4 bg-zinc-200/50 dark:bg-[#232428] border-b border-zinc-300 dark:border-zinc-800/80 flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cuộc gọi trực tiếp với @{otherMember.profile.name}</span>
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleEndCall}
            className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-x-1.5 shadow"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>Rời cuộc gọi</span>
          </Button>

          <ActionTooltip
            label={
              isSplit
                ? "Phóng to toàn màn hình (Hide Chat)"
                : "Thu nhỏ cuộc gọi để Chat (Show Chat)"
            }
            side="bottom"
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsSplit(!isSplit)}
              className="h-7 text-xs bg-zinc-300/80 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-medium flex items-center gap-x-1.5"
            >
              {isSplit ? (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Phóng to Call</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Thu nhỏ để Chat</span>
                </>
              )}
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* Persistent MediaRoom Stage */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div
          className={cn(
            "w-full transition-all duration-200 relative bg-[#111214] overflow-hidden",
            !isSplit ? "flex-1 h-full" : "h-64 md:h-72 shrink-0 border-b border-zinc-800"
          )}
        >
          <MediaRoom
            chatId={conversationId}
            video
            audio
            onDisconnected={handleEndCall}
          />
        </div>

        {/* Text Chat Area: Visible when isSplit is true */}
        {isSplit && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ChatMessages
              member={currentMember}
              name={otherMember.profile.name}
              chatId={conversationId}
              type="conversation"
              apiUrl="/api/direct-messages"
              paramKey="conversationId"
              paramValue={conversationId}
              socketUrl="/api/socket/direct-messages"
              socketQuery={{
                conversationId
              }}
            />
            <ChatInput
              name={otherMember.profile.name}
              type="conversation"
              apiUrl="/api/socket/direct-messages"
              query={{
                conversationId
              }}
              currentMember={currentMember}
            />
          </div>
        )}
      </div>
    </div>
  );
}
