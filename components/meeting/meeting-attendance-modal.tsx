"use client";

import React, { useState } from "react";
import {
  Users,
  CheckCircle2,
  Download,
  Copy,
  Check,
  X,
  Clock,
  ShieldCheck,
  Hand
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { sounds } from "@/lib/sounds";

export interface ParticipantRecord {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
  joinedAt: string;
  role?: string;
  isHandRaised?: boolean;
}

interface MeetingAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  participants: ParticipantRecord[];
}

export function MeetingAttendanceModal({
  isOpen,
  onClose,
  channelName,
  participants
}: MeetingAttendanceModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLog = () => {
    const header = `=== DANH SÁCH ĐIỂM DANH CUỘC HỌP NỘI BỘ ===\nPhòng họp: #${channelName}\nThời gian xuất: ${new Date().toLocaleString("vi-VN")}\nTổng số nhân sự: ${participants.length}\n------------------------------------------\n`;
    const rows = participants
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.name} | @${p.email || "nhansu@congty.internal"} | Vào lúc: ${p.joinedAt} | Vai trò: ${p.role || "Thành viên"}`
      )
      .join("\n");

    navigator.clipboard.writeText(header + rows);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const header = `DANH SÁCH ĐIỂM DANH CUỘC HỌP NỘI BỘ\nPhòng họp: #${channelName}\nThời gian: ${new Date().toLocaleString("vi-VN")}\nTổng số nhân sự tham dự: ${participants.length}\n\n`;
    const rows = participants
      .map(
        (p, idx) =>
          `${idx + 1}. [Đã tham gia] ${p.name} (${p.email || "nhansu@congty.internal"}) - Giờ vào: ${p.joinedAt} - ${p.role || "Thành viên"}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Diem-danh-${channelName}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    sounds.playPop();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2b2d31] text-zinc-200 p-0 overflow-hidden max-w-lg border border-zinc-800 shadow-2xl rounded-2xl select-none">
        <DialogHeader className="p-5 border-b border-zinc-800/80 bg-[#1e1f22]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2.5">
              <Users className="w-5 h-5 text-indigo-400" />
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Danh sách Điểm danh Cuộc họp
                </DialogTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Phòng họp: #{channelName} • {participants.length} nhân sự đã tham gia
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đang ghi nhận
            </span>
          </div>
        </DialogHeader>

        {/* Participants Table */}
        <div className="p-4 max-h-80 overflow-y-auto space-y-2">
          {participants.map((person, idx) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e1f22] border border-zinc-800/70 hover:border-zinc-700 transition"
            >
              <div className="flex items-center gap-x-3 min-w-0">
                <span className="text-xs font-mono text-zinc-500 w-4 text-center">
                  {idx + 1}
                </span>
                <UserAvatar src={person.imageUrl} className="w-8 h-8 rounded-full" />
                <div className="truncate">
                  <div className="flex items-center gap-x-1.5">
                    <p className="font-semibold text-xs text-white truncate">
                      {person.name}
                    </p>
                    {person.isHandRaised && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/70 border border-amber-700/50 px-1 py-0.2 rounded font-medium flex items-center">
                        ✋ Đang giơ tay
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {person.email || `@${person.name.toLowerCase().replace(/\s+/g, "")}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-x-3 shrink-0 text-right">
                <div className="flex items-center gap-x-1 text-[11px] text-zinc-400">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>{person.joinedAt}</span>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-medium border border-zinc-700">
                  {person.role || "Thành viên"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#1e1f22] flex items-center justify-between gap-x-2">
          <Button
            size="sm"
            onClick={handleCopyLog}
            className={`text-xs h-8 font-medium ${
              copied
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Đã sao chép
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Sao chép điểm danh
              </>
            )}
          </Button>

          <div className="flex items-center gap-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportTxt}
              className="text-xs h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Xuất tệp báo cáo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-xs h-8 text-zinc-400 hover:text-zinc-200"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
