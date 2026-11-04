"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ResizableServerLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 240;
const MAX_WIDTH = 460;
const STORAGE_KEY = "discord_sidebar_width";

export function ResizableServerLayout({
  children,
  sidebar,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
}: ResizableServerLayoutProps) {
  const [width, setWidth] = useState<number>(defaultWidth);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(defaultWidth);

  // Read saved width from localStorage upon mounting
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          setWidth(parsed);
        }
      }
    } catch (e) {
      // localStorage may fail in private mode
    }
  }, [minWidth, maxWidth]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width]
  );

  const handleDoubleClick = useCallback(() => {
    setWidth(defaultWidth);
    try {
      localStorage.setItem(STORAGE_KEY, defaultWidth.toString());
    } catch (e) {}
  }, [defaultWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartXRef.current;
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startWidthRef.current + deltaX)
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem(STORAGE_KEY, width.toString());
      } catch (e) {}
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, width, minWidth, maxWidth]);

  return (
    <div className={cn("h-full relative", isDragging && "select-none cursor-col-resize")}>
      {/* Sidebar container */}
      <div
        style={{
          width: mounted ? `${width}px` : `${defaultWidth}px`,
          left: "72px",
        }}
        className={cn(
          "hidden md:flex h-full z-30 flex-col fixed inset-y-0 transition-none border-r border-zinc-200 dark:border-zinc-800/80 bg-[#f2f3f5] dark:bg-[#2b2d31]"
        )}
      >
        <div className="h-full w-full overflow-hidden relative flex flex-col min-h-0">
          {sidebar}

          {/* Draggable Divider Handle */}
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="Kéo để chỉnh độ rộng thanh điều hướng (Nhấp đúp để đặt lại)"
            className={cn(
              "absolute top-0 right-0 bottom-0 w-2 -mr-1 cursor-col-resize z-50 group flex items-center justify-center transition-all",
              isDragging
                ? "bg-indigo-500/80 w-2.5 shadow-lg shadow-indigo-500/30"
                : "hover:bg-indigo-500/40 active:bg-indigo-600"
            )}
          >
            {/* Visual handle dots / pill */}
            <div
              className={cn(
                "h-8 w-1 rounded-full transition-all",
                isDragging
                  ? "bg-white h-12 shadow-sm"
                  : "bg-transparent group-hover:bg-indigo-400 group-hover:h-10"
              )}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        style={{
          marginLeft: mounted ? `${width}px` : `${defaultWidth}px`,
        }}
        className="h-full relative overflow-hidden transition-none"
      >
        {children}
      </main>

      {/* Full-screen drag overlay to prevent pointer events on iframes/content during resize */}
      {isDragging && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize select-none" />
      )}
    </div>
  );
}

