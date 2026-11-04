"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Share2,
  X,
  Sparkles,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sounds } from "@/lib/sounds";

export interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  completed: boolean;
}

export interface MeetingNotesData {
  topic: string;
  host: string;
  secretary: string;
  notes: string;
  actionItems: ActionItem[];
  date: string;
}

interface MeetingNotesDrawerProps {
  channelId: string;
  channelName: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingNotesDrawer({
  channelId,
  channelName,
  userName,
  isOpen,
  onClose
}: MeetingNotesDrawerProps) {
  const storageKey = `meeting_notes_${channelId}`;

  const [notesData, setNotesData] = useState<MeetingNotesData>({
    topic: `Biên bản cuộc họp: #${channelName}`,
    host: userName,
    secretary: userName,
    notes: "- Thảo luận về tiến độ công việc và kế hoạch triển khai.\n- Phân bổ tài nguyên và thống nhất mục tiêu sprint tiếp theo.",
    actionItems: [
      { id: "1", text: "Tổng hợp tài liệu dự án", assignee: userName, completed: false },
      { id: "2", text: "Gửi báo cáo cho ban quản lý", assignee: "Đồng nghiệp", completed: false }
    ],
    date: new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  });

  const [copied, setCopied] = useState(false);
  const [newActionText, setNewActionText] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  // Load saved notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotesData(JSON.parse(saved));
      }
    } catch (e) {
      // Ignored
    }
  }, [storageKey]);

  // Auto-save notes
  const saveNotes = (updated: MeetingNotesData) => {
    setNotesData(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      // Ignored
    }
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    sounds.playPop();
    const newItem: ActionItem = {
      id: Date.now().toString(),
      text: newActionText.trim(),
      assignee: newAssignee.trim() || userName,
      completed: false
    };

    saveNotes({
      ...notesData,
      actionItems: [...notesData.actionItems, newItem]
    });

    setNewActionText("");
    setNewAssignee("");
  };

  const toggleActionItem = (id: string) => {
    sounds.playPop();
    const updated = notesData.actionItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveNotes({ ...notesData, actionItems: updated });
  };

  const removeActionItem = (id: string) => {
    const updated = notesData.actionItems.filter((item) => item.id !== id);
    saveNotes({ ...notesData, actionItems: updated });
  };

  const handleCopyNotes = () => {
    const content = `
========================================
📋 BIÊN BẢN CUỘC HỌP NỘI BỘ DOANH NGHIỆP
========================================
Chủ đề: ${notesData.topic}
Thời gian: ${notesData.date}
Chủ tọa: ${notesData.host}
Thư ký: ${notesData.secretary}

--- NỘI DUNG THẢO LUẬN CHÍNH ---
${notesData.notes}

--- DANH MỤC GIAO VIỆC & NHIỆM VỤ (ACTION ITEMS) ---
${notesData.actionItems
  .map(
    (item, idx) =>
      `${idx + 1}. [${item.completed ? "X" : " "}] ${item.text} (Người phụ trách: @${item.assignee})`
  )
  .join("\n")}
========================================
Lưu trữ trên Hệ thống Họp Nội bộ Công ty
    `.trim();

    navigator.clipboard.writeText(content);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadNotes = () => {
    const content = `
BIÊN BẢN CUỘC HỌP NỘI BỘ DOANH NGHIỆP
Chủ đề: ${notesData.topic}
Thời gian: ${notesData.date}
Chủ tọa: ${notesData.host}
Thư ký: ${notesData.secretary}

NỘI DUNG CUỘC HỌP:
${notesData.notes}

NHIỆM VỤ TIẾP THEO (ACTION ITEMS):
${notesData.actionItems
  .map(
    (item, idx) =>
      `${idx + 1}. [${item.completed ? "X" : " "}] ${item.text} - Phụ trách: ${item.assignee}`
  )
  .join("\n")}
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bien-ban-hop-${channelName}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    sounds.playPop();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-[#2b2d31] border-l border-zinc-700/80 shadow-2xl flex flex-col z-50 text-zinc-200 animate-in slide-in-from-right duration-200 select-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#1e1f22]">
        <div className="flex items-center gap-x-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-sm text-white">Biên bản cuộc họp nội bộ</h3>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Topic Input */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Chủ đề cuộc họp
          </label>
          <input
            value={notesData.topic}
            onChange={(e) => saveNotes({ ...notesData, topic: e.target.value })}
            className="w-full bg-[#1e1f22] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Meeting Meta: Host & Date */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
              Chủ tọa cuộc họp
            </label>
            <input
              value={notesData.host}
              onChange={(e) => saveNotes({ ...notesData, host: e.target.value })}
              className="w-full bg-[#1e1f22] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
              Thư ký ghi chép
            </label>
            <input
              value={notesData.secretary}
              onChange={(e) => saveNotes({ ...notesData, secretary: e.target.value })}
              className="w-full bg-[#1e1f22] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Discussion Notes Section */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Nội dung thảo luận & Quyết định chính
          </label>
          <textarea
            rows={6}
            value={notesData.notes}
            onChange={(e) => saveNotes({ ...notesData, notes: e.target.value })}
            placeholder="Ghi lại các ý kiến, quyết định hoặc vấn đề được thảo luận trong buổi họp..."
            className="w-full bg-[#1e1f22] border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Action Items Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Nhiệm vụ tiếp theo ({notesData.actionItems.filter((i) => i.completed).length}/
              {notesData.actionItems.length})
            </label>
          </div>

          {/* Action items list */}
          <div className="space-y-1.5 mb-3">
            {notesData.actionItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-2 rounded-lg bg-[#1e1f22] border border-zinc-800/80 hover:border-zinc-700 transition"
              >
                <button
                  type="button"
                  onClick={() => toggleActionItem(item.id)}
                  className="flex items-center gap-x-2 text-left flex-1 min-w-0"
                >
                  {item.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                  <span
                    className={`text-xs truncate ${
                      item.completed ? "line-through text-zinc-500" : "text-zinc-200"
                    }`}
                  >
                    {item.text}
                  </span>
                </button>

                <div className="flex items-center gap-x-2 shrink-0 ml-2">
                  <span className="text-[10px] bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded border border-zinc-700/60 font-medium">
                    @{item.assignee}
                  </span>
                  <button
                    onClick={() => removeActionItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new action item form */}
          <form onSubmit={handleAddActionItem} className="flex flex-col gap-y-1.5">
            <input
              placeholder="Thêm nhiệm vụ mới..."
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              className="bg-[#1e1f22] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-x-1.5">
              <input
                placeholder="Người phụ trách (mặc định: bạn)"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="flex-1 bg-[#1e1f22] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Giao việc
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-zinc-800 bg-[#1e1f22] flex items-center gap-x-2">
        <Button
          size="sm"
          onClick={handleCopyNotes}
          className={`flex-1 text-xs h-8 font-medium ${
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
              Sao chép biên bản
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDownloadNotes}
          className="text-xs h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Xuất file
        </Button>
      </div>
    </div>
  );
}
