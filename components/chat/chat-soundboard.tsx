"use client";

import React, { useState } from "react";
import { Volume2, Sparkles } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useSocket } from "@/components/providers/socket-provider";
import { sounds } from "@/lib/sounds";
import { ActionTooltip } from "@/components/action-tooltip";

interface ChatSoundboardProps {
  chatId: string;
  senderName?: string;
}

const SOUNDS_LIST = [
  {
    id: "airhorn",
    title: "Airhorn",
    emoji: "🎺",
    color: "from-amber-500/20 to-orange-500/20 hover:border-amber-500/80 text-amber-300"
  },
  {
    id: "quack",
    title: "Quack",
    emoji: "🦆",
    color: "from-yellow-500/20 to-lime-500/20 hover:border-yellow-500/80 text-yellow-300"
  },
  {
    id: "badumtss",
    title: "Ba Dum Tss",
    emoji: "🥁",
    color: "from-indigo-500/20 to-purple-500/20 hover:border-indigo-500/80 text-indigo-300"
  },
  {
    id: "cricket",
    title: "Cricket",
    emoji: "🦗",
    color: "from-emerald-500/20 to-green-500/20 hover:border-emerald-500/80 text-emerald-300"
  },
  {
    id: "applause",
    title: "Applause",
    emoji: "👏",
    color: "from-pink-500/20 to-rose-500/20 hover:border-pink-500/80 text-pink-300"
  },
  {
    id: "gg",
    title: "GG Fanfare",
    emoji: "🎮",
    color: "from-sky-500/20 to-blue-500/20 hover:border-sky-500/80 text-sky-300"
  }
];

export function ChatSoundboard({ chatId, senderName }: ChatSoundboardProps) {
  const { socket } = useSocket();
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const onPlaySound = (soundId: string) => {
    setActiveSound(soundId);
    sounds.playSoundboard(soundId);

    if (socket && chatId) {
      socket.emit("chat:soundboard", {
        chatId,
        soundId,
        senderName: senderName || "Member"
      });
    }

    setTimeout(() => {
      setActiveSound(null);
    }, 600);
  };

  return (
    <Popover>
      <ActionTooltip label="Bảng âm thanh (Soundboard)" side="top">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-[24px] w-[24px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition flex items-center justify-center rounded-full hover:bg-zinc-700/20 dark:hover:bg-zinc-700/40"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </PopoverTrigger>
      </ActionTooltip>
      <PopoverContent
        side="top"
        sideOffset={16}
        className="bg-[#2b2d31] border border-zinc-800 shadow-2xl rounded-2xl w-72 p-3 text-zinc-200 select-none"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-700/60">
          <div className="flex items-center gap-x-1.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h4 className="font-bold text-xs text-white">Âm thanh tương tác cuộc họp</h4>
          </div>
          <span className="text-[10px] text-zinc-400">Thời gian thực</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {SOUNDS_LIST.map((sound) => {
            const isPlaying = activeSound === sound.id;
            return (
              <button
                key={sound.id}
                type="button"
                onClick={() => onPlaySound(sound.id)}
                className={`flex items-center gap-x-2 p-2 rounded-xl border border-zinc-700/50 bg-gradient-to-br transition-all duration-150 active:scale-95 text-left ${
                  sound.color
                } ${isPlaying ? "ring-2 ring-indigo-400 scale-95" : ""}`}
              >
                <span className="text-xl shrink-0">{sound.emoji}</span>
                <span className="font-semibold text-xs truncate">
                  {sound.title}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
