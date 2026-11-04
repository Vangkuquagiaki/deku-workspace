import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sounds } from "@/lib/sounds";

export type UserStatus = "online" | "idle" | "dnd" | "invisible";
export type ChatDensity = "cozy" | "compact";
export type VoiceMode = "voice-activity" | "push-to-talk";

interface UserPreferencesStore {
  soundEnabled: boolean;
  micMuted: boolean;
  deafened: boolean;
  status: UserStatus;
  chatDensity: ChatDensity;
  voiceMode: VoiceMode;
  inputVolume: number;
  outputVolume: number;
  messagePreviews: boolean;
  customStatus: string;
  customStatusEmoji: string;
  language: "vi" | "en";
  timezone: string;
  autoRecordMeeting: boolean;
  consentNotification: boolean;
  autoAiMinutes: boolean;
  autoSyncActionItems: boolean;
  whisperLanguage: "vi" | "en" | "auto";
  noiseSuppression: boolean;
  echoCancellation: boolean;

  setSoundEnabled: (enabled: boolean) => void;
  setStatus: (status: UserStatus) => void;
  setChatDensity: (density: ChatDensity) => void;
  setVoiceMode: (mode: VoiceMode) => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  setMessagePreviews: (enabled: boolean) => void;
  setCustomStatus: (status: string, emoji?: string) => void;
  setLanguage: (lang: "vi" | "en") => void;
  setTimezone: (tz: string) => void;
  setAutoRecordMeeting: (val: boolean) => void;
  setConsentNotification: (val: boolean) => void;
  setAutoAiMinutes: (val: boolean) => void;
  setAutoSyncActionItems: (val: boolean) => void;
  setWhisperLanguage: (lang: "vi" | "en" | "auto") => void;
  setNoiseSuppression: (val: boolean) => void;
  setEchoCancellation: (val: boolean) => void;
  setMicMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  toggleMic: () => void;
  toggleDeafen: () => void;
}

export const useUserPreferences = create<UserPreferencesStore>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      micMuted: false,
      deafened: false,
      status: "online",
      chatDensity: "cozy",
      voiceMode: "voice-activity",
      inputVolume: 85,
      outputVolume: 100,
      messagePreviews: true,
      customStatus: "Đang khám phá Discord",
      customStatusEmoji: "🎮",
      language: "vi",
      timezone: "Asia/Ho_Chi_Minh",
      autoRecordMeeting: false,
      consentNotification: true,
      autoAiMinutes: true,
      autoSyncActionItems: true,
      whisperLanguage: "vi",
      noiseSuppression: true,
      echoCancellation: true,

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setStatus: (status) => set({ status }),
      setChatDensity: (density) => set({ chatDensity: density }),
      setVoiceMode: (mode) => set({ voiceMode: mode }),
      setInputVolume: (volume) => set({ inputVolume: volume }),
      setOutputVolume: (volume) => set({ outputVolume: volume }),
      setMessagePreviews: (enabled) => set({ messagePreviews: enabled }),
      setCustomStatus: (status, emoji = "💬") =>
        set({ customStatus: status, customStatusEmoji: emoji }),
      setLanguage: (lang) => set({ language: lang }),
      setTimezone: (tz) => set({ timezone: tz }),
      setAutoRecordMeeting: (val) => set({ autoRecordMeeting: val }),
      setConsentNotification: (val) => set({ consentNotification: val }),
      setAutoAiMinutes: (val) => set({ autoAiMinutes: val }),
      setAutoSyncActionItems: (val) => set({ autoSyncActionItems: val }),
      setWhisperLanguage: (lang) => set({ whisperLanguage: lang }),
      setNoiseSuppression: (val) => set({ noiseSuppression: val }),
      setEchoCancellation: (val) => set({ echoCancellation: val }),

      setMicMuted: (muted) => {
        if (get().soundEnabled) {
          if (muted) sounds.playMute();
          else sounds.playUnmute();
        }
        set({
          micMuted: muted,
          // If turning on mic, undeafen if currently deafened
          deafened: !muted ? false : get().deafened
        });
      },

      setDeafened: (deafened) => {
        if (get().soundEnabled) {
          if (deafened) sounds.playMute();
          else sounds.playUnmute();
        }
        set({
          deafened,
          // When deafened is true, ALWAYS mute microphone as well
          micMuted: deafened ? true : get().micMuted
        });
      },

      toggleMic: () => {
        const nextState = !get().micMuted;
        if (get().soundEnabled) {
          if (nextState) {
            sounds.playMute();
          } else {
            sounds.playUnmute();
          }
        }
        set({
          micMuted: nextState,
          // When unmuting (bật mic), tự động bật lại tai nghe nếu đang bị tắt
          deafened: !nextState ? false : get().deafened
        });
      },

      toggleDeafen: () => {
        const nextState = !get().deafened;
        if (get().soundEnabled) {
          if (nextState) {
            sounds.playMute();
          } else {
            sounds.playUnmute();
          }
        }
        set({
          deafened: nextState,
          // Khi tắt tai nghe thì TẮT LUÔN CẢ MIC
          micMuted: nextState ? true : get().micMuted
        });
      }
    }),
    {
      name: "discord-user-preferences"
    }
  )
);
