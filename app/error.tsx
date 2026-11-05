"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // If it is a Next.js redirect thrown inside server components, rethrow or forward
    if (error?.message === "NEXT_REDIRECT" || error?.digest?.startsWith("NEXT_REDIRECT")) {
      window.location.href = "/base";
      return;
    }
    console.error("[RUNTIME_ERROR]", error);
  }, [error]);

  if (error?.message === "NEXT_REDIRECT" || error?.digest?.startsWith("NEXT_REDIRECT")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#313338] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-[#2b2d31] border border-zinc-700/60 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Đang tải dữ liệu không gian làm việc
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hệ thống đang đồng bộ phiên làm việc bảo mật. Vui lòng thử lại hoặc chuyển đến trang tổng quan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl gap-2 h-11"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-200 rounded-xl gap-2 h-11"
          >
            <Link href="/base">
              <Home className="w-4 h-4" />
              Lark Base
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

