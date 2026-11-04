"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sounds } from "@/lib/sounds";

interface MeetingPinDialogProps {
  channelId: string;
  channelName: string;
  isAdmin: boolean;
  onUnlocked: () => void;
}

export function MeetingPinDialog({
  channelId,
  channelName,
  isAdmin,
  onUnlocked
}: MeetingPinDialogProps) {
  const pinKey = `meeting_pin_${channelId}`;
  const sessionKey = `meeting_unlocked_${channelId}`;

  const [enteredPin, setEnteredPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [configuredPin, setConfiguredPin] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");

  // Check if PIN is configured in localStorage
  useEffect(() => {
    try {
      // Default sample PIN for confidential-sounding rooms
      const isConfidential =
        channelName.toLowerCase().includes("lanh-dao") ||
        channelName.toLowerCase().includes("giam-doc") ||
        channelName.toLowerCase().includes("ke-toan") ||
        channelName.toLowerCase().includes("kin") ||
        channelName.toLowerCase().includes("bao-mat");

      const savedPin = localStorage.getItem(pinKey);
      if (savedPin) {
        setConfiguredPin(savedPin);
      } else if (isConfidential) {
        // Pre-configure a default confidential PIN "8888" for demonstration if none exists
        localStorage.setItem(pinKey, "8888");
        setConfiguredPin("8888");
      } else {
        setConfiguredPin(null);
      }

      // Check if already unlocked in this session
      const isAlreadyUnlocked = sessionStorage.getItem(sessionKey);
      if (isAlreadyUnlocked === "true" || (!savedPin && !isConfidential)) {
        onUnlocked();
      }
    } catch (e) {
      // Ignored
    }
  }, [channelId, channelName, pinKey, sessionKey, onUnlocked]);

  // Keypad press handler
  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 6) {
      sounds.playPop();
      const updated = enteredPin + num;
      setEnteredPin(updated);
      setErrorMsg("");

      // If reached length of configured PIN, auto-verify
      if (configuredPin && updated.length === configuredPin.length) {
        verifyPin(updated);
      }
    }
  };

  const handleBackspace = () => {
    sounds.playPop();
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const verifyPin = (pinToTest: string) => {
    if (pinToTest === configuredPin) {
      sounds.playPop();
      try {
        sessionStorage.setItem(sessionKey, "true");
      } catch (e) {
        // Ignored
      }
      onUnlocked();
    } else {
      setErrorMsg("Mã PIN không chính xác. Vui lòng thử lại!");
      setEnteredPin("");
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim() || newPinInput.length < 4) {
      setErrorMsg("Mã PIN mới cần ít nhất 4 ký tự.");
      return;
    }

    localStorage.setItem(pinKey, newPinInput.trim());
    setConfiguredPin(newPinInput.trim());
    setIsSettingPin(false);
    setNewPinInput("");
    setErrorMsg("");
    sounds.playPop();
  };

  const handleRemovePin = () => {
    localStorage.removeItem(pinKey);
    setConfiguredPin(null);
    setIsSettingPin(false);
    try {
      sessionStorage.setItem(sessionKey, "true");
    } catch (e) {
      // Ignored
    }
    sounds.playPop();
    onUnlocked();
  };

  // If no PIN configured, do not block
  if (!configuredPin) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-[#111214]/95 backdrop-blur-md flex items-center justify-center z-40 p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#2b2d31] border border-zinc-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative">
        {/* Lock Icon Banner */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4 text-indigo-400">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Phòng họp Bảo mật Nội bộ
        </h3>
        <p className="text-xs text-zinc-400 mb-6">
          Cuộc họp <span className="font-semibold text-indigo-400">#{channelName}</span> được bảo vệ bằng mã PIN bảo mật.
        </p>

        {/* PIN display dots */}
        <div className="flex items-center justify-center gap-x-3 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  isFilled
                    ? "bg-indigo-500 border-indigo-400 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-semibold mb-4 animate-shake">
            {errorMsg}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-2xl bg-[#1e1f22] hover:bg-[#35373c] text-white font-bold text-lg border border-zinc-700/60 active:scale-95 transition"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEnteredPin("")}
            className="h-12 rounded-2xl bg-[#1e1f22] hover:bg-[#35373c] text-zinc-400 hover:text-zinc-200 text-xs font-semibold border border-zinc-700/60 active:scale-95 transition"
          >
            Xóa
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="h-12 rounded-2xl bg-[#1e1f22] hover:bg-[#35373c] text-white font-bold text-lg border border-zinc-700/60 active:scale-95 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-[#1e1f22] hover:bg-[#35373c] text-zinc-400 hover:text-zinc-200 text-xs font-semibold border border-zinc-700/60 active:scale-95 transition"
          >
            ⌫
          </button>
        </div>

        {/* Admin PIN configuration toggle */}
        {isAdmin && (
          <div className="pt-4 border-t border-zinc-800 text-left">
            {!isSettingPin ? (
              <button
                type="button"
                onClick={() => setIsSettingPin(true)}
                className="w-full text-center text-[11px] text-zinc-400 hover:text-indigo-400 font-medium transition"
              >
                ⚙️ Quản trị viên: Đổi hoặc gỡ mã PIN phòng này
              </button>
            ) : (
              <div className="space-y-3 bg-[#1e1f22] p-3 rounded-xl border border-zinc-700">
                <p className="text-xs font-bold text-white">Đổi mã PIN phòng họp</p>
                <form onSubmit={handleSaveNewPin} className="space-y-2">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Mã PIN mới (4-6 số)"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="w-full bg-[#2b2d31] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-x-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1 h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Lưu PIN
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleRemovePin}
                      className="h-7 text-xs"
                    >
                      Gỡ PIN
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
