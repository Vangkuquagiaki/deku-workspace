import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PinnedMessage {
  id: string;
  chatId: string;
  content: string;
  fileUrl: string | null;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  pinnedAt: string;
}

interface PinnedMessagesStore {
  pinnedMessages: Record<string, PinnedMessage[]>;
  pinMessage: (chatId: string, message: PinnedMessage) => void;
  unpinMessage: (chatId: string, messageId: string) => void;
  isPinned: (chatId: string, messageId: string) => boolean;
}

export const usePinnedMessages = create<PinnedMessagesStore>()(
  persist(
    (set, get) => ({
      pinnedMessages: {},
      pinMessage: (chatId, message) => {
        const current = get().pinnedMessages[chatId] || [];
        if (current.some((m) => m.id === message.id)) return;
        set({
          pinnedMessages: {
            ...get().pinnedMessages,
            [chatId]: [message, ...current]
          }
        });
      },
      unpinMessage: (chatId, messageId) => {
        const current = get().pinnedMessages[chatId] || [];
        set({
          pinnedMessages: {
            ...get().pinnedMessages,
            [chatId]: current.filter((m) => m.id !== messageId)
          }
        });
      },
      isPinned: (chatId, messageId) => {
        const current = get().pinnedMessages[chatId] || [];
        return current.some((m) => m.id === messageId);
      }
    }),
    {
      name: "discord-pinned-messages"
    }
  )
);
