"use client";

import React, { Suspense, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function ServerBaseContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams?.get("tab") || "today";
    const serverId = (params?.serverId as string) || "";
    const targetUrl = serverId ? `/base?tab=${tab}&serverId=${serverId}` : `/base?tab=${tab}`;
    router.replace(targetUrl);
  }, [params, searchParams, router]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#111214] text-zinc-400 gap-2">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
      <span className="text-xs">Đang chuyển tiếp tới không gian Lark Base Doanh Nghiệp...</span>
    </div>
  );
}

export default function ServerBasePage() {
  return (
    <div className="h-full w-full overflow-hidden bg-[#111214]">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-[#111214] text-zinc-400 gap-2">
            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
            <span className="text-xs">Đang tải không gian làm việc...</span>
          </div>
        }
      >
        <ServerBaseContent />
      </Suspense>
    </div>
  );
}
