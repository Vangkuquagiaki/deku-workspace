"use client";

import React from "react";

interface ChatTypingIndicatorProps {
  typingUsers: { memberId: string; name: string }[];
}

export function ChatTypingIndicator({ typingUsers }: ChatTypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  let text = "";
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].name} is typing...`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
  } else {
    text = "Several people are typing...";
  }

  return (
    <div className="flex items-center gap-x-2 px-4 py-1 text-xs text-zinc-500 dark:text-zinc-400 select-none animate-fadeIn">
      {/* 3 Jumping Dots Animation */}
      <span className="flex items-center gap-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
      </span>
      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
        {text}
      </span>
    </div>
  );
}
