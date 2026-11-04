"use client";

import React, { useState, memo } from "react";
import { Smile } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useTheme } from "next-themes";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

interface EmojiPickerProps {
  onChange: (value: string) => void;
}

export const EmojiPicker = memo(function EmojiPicker({ onChange }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition focus:outline-none"
        >
          <Smile className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-transparent border-none shadow-none drop-shadow-none mb-16 p-0"
        sideOffset={40}
        side="right"
      >
        {isOpen && (
          <Picker
            theme={resolvedTheme}
            data={data}
            onEmojiSelect={(emoji: any) => {
              onChange(emoji.native);
              setIsOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
});
