"use client";

import React, { useState } from "react";
import { Search, X, MessageSquare, ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

interface ChatSearchInputProps {
  chatId: string;
}

export function ChatSearchInput({ chatId }: ChatSearchInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<{ id: string; content: string; name: string }[]>([]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setMatches([]);
      return;
    }

    // Search through current rendered message DOM elements in the chat
    const messageElements = document.querySelectorAll("[data-message-id]");
    const found: { id: string; content: string; name: string }[] = [];

    messageElements.forEach((el) => {
      const id = el.getAttribute("data-message-id") || "";
      const content = el.querySelector("[data-message-content]")?.textContent || "";
      const name = el.querySelector("[data-message-name]")?.textContent || "";

      if (
        content.toLowerCase().includes(text.toLowerCase()) ||
        name.toLowerCase().includes(text.toLowerCase())
      ) {
        found.push({ id, content, name });
      }
    });

    setMatches(found.slice(0, 8));
  };

  const handleJump = (id: string) => {
    setOpen(false);
    const element = document.getElementById(`message-${id}`);
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
      <PopoverTrigger asChild>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={query}
            onChange={(e) => {
              handleSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="w-32 md:w-44 focus:w-56 transition-all duration-200 h-7 bg-zinc-200 dark:bg-[#1e1f22] text-xs px-2.5 pr-6 rounded-md text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent dark:border-zinc-800"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                setMatches([]);
              }}
              className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute right-2 pointer-events-none" />
          )}
        </div>
      </PopoverTrigger>

      {query.trim().length > 0 && (
        <PopoverContent
          align="end"
          side="bottom"
          className="w-72 md:w-84 p-0 bg-white dark:bg-[#2b2d31] border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-lg overflow-hidden"
        >
          <div className="p-2.5 bg-zinc-100 dark:bg-[#1e1f22] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <span>Kết quả tìm kiếm ({matches.length})</span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
            {matches.length === 0 ? (
              <div className="py-6 text-center px-3">
                <p className="text-xs text-zinc-400">
                  Không tìm thấy tin nhắn phù hợp với &quot;{query}&quot;
                </p>
              </div>
            ) : (
              matches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleJump(item.id)}
                  className="p-2.5 hover:bg-zinc-50 dark:hover:bg-[#313338] transition cursor-pointer flex items-start justify-between gap-x-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                      {item.content}
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
