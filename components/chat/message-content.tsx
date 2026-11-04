"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MessageContentProps {
  content: string;
  deleted: boolean;
  isUpdated: boolean;
}

export function MessageContent({
  content,
  deleted,
  isUpdated
}: MessageContentProps) {
  if (deleted) {
    return (
      <p className="italic text-zinc-500 dark:text-zinc-400 text-xs mt-1">
        {content}
      </p>
    );
  }

  // Check for multiline code block: ```code```
  if (content.startsWith("```") && content.endsWith("```") && content.length > 6) {
    const code = content.slice(3, -3).replace(/^\n+|\n+$/g, "");
    return (
      <div className="mt-1">
        <pre className="p-3 rounded-md bg-[#1e1f22] text-[#dbdee1] font-mono text-xs overflow-x-auto border border-[#2b2d31]">
          <code>{code}</code>
        </pre>
        {isUpdated && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 inline-block">
            (edited)
          </span>
        )}
      </div>
    );
  }

  // Split and format inline elements (links, bold, italic, inline code)
  const renderFormattedText = (text: string) => {
    // Regex matches:
    // 1. URLs
    // 2. `inline code`
    // 3. **bold**
    // 4. *italic*
    const parts = text.split(
      /((?:https?:\/\/[^\s]+)|(?:\`[^\`]+\`)|(?:\*\*[^*]+\*\*)|(?:\*[^*]+\*))/g
    );

    return parts.map((part, index) => {
      if (!part) return null;

      // Link
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 dark:text-sky-400 hover:underline break-all"
          >
            {part}
          </a>
        );
      }

      // Inline code `code`
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-[#202225] font-mono text-xs text-indigo-600 dark:text-indigo-300 mx-0.5"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold **bold**
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={index} className="font-bold text-zinc-900 dark:text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic *italic*
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
      {renderFormattedText(content)}
      {isUpdated && (
        <span className="text-[10px] mx-1.5 text-zinc-500 dark:text-zinc-400 font-normal">
          (edited)
        </span>
      )}
    </p>
  );
}
