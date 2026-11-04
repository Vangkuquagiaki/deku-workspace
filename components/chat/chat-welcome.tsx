import React from "react";
import { Hash } from "lucide-react";

interface ChatWelcomeProps {
  name: string;
  type: "channel" | "conversation";
}

export function ChatWelcome({ name, type }: ChatWelcomeProps) {
  return (
    <div className="space-y-2 px-4 mb-4">
      {type === "channel" && (
        <div className="h-[75px] w-[75px] rounded-full bg-zinc-500 dark:bg-zinc-700 flex items-center justify-center">
          <Hash className="h-12 w-12 text-white" />
        </div>
      )}
      <p className="text-xl md:text-3xl font-bold">
        {type === "channel" ? "Không gian #" : ""}
        {name}
      </p>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm">
        {type === "channel"
          ? `Đây là kênh trao đổi & tài liệu dự án #${name}. Mọi nội dung trao đổi được lưu trữ và bảo mật trong nội bộ doanh nghiệp.`
          : `Đây là kênh trao đổi công việc trực tiếp 1:1 với đồng nghiệp ${name}.`}
      </p>
    </div>
  );
}
