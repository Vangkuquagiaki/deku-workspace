"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LarkBaseView, MainTab } from "@/components/lark/lark-base-view";
import { Loader2 } from "lucide-react";

function ServerBaseContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverId = (params?.serverId as string) || "";
  const tab = (searchParams?.get("tab") as MainTab) || "today";

  return <LarkBaseView serverId={serverId} initialTab={tab} />;
}

export default function ServerBasePage() {
  return (
    <div className="h-full w-full overflow-hidden bg-[#111214]">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-[#111214] text-zinc-400 gap-2">
            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
            <span className="text-xs">Đang tải không gian làm việc Lark Base...</span>
          </div>
        }
      >
        <ServerBaseContent />
      </Suspense>
    </div>
  );
}
