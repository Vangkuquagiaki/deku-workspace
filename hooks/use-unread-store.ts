import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UnreadStore {
  unreadChannels: Record<string, number>;
  addUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  hasUnread: (channelId: string) => boolean;
  getUnreadCount: (channelId: string) => number;
}

export const useUnreadStore = create<UnreadStore>()(
  persist(
    (set, get) => ({
      unreadChannels: {},
      addUnread: (channelId: string) => {
        set((state) => ({
          unreadChannels: {
            ...state.unreadChannels,
            [channelId]: (state.unreadChannels[channelId] || 0) + 1
          }
        }));
      },
      clearUnread: (channelId: string) => {
        set((state) => {
          if (!state.unreadChannels[channelId]) return state;
          const next = { ...state.unreadChannels };
          delete next[channelId];
          return { unreadChannels: next };
        });
      },
      hasUnread: (channelId: string) => {
        return Boolean(get().unreadChannels[channelId]);
      },
      getUnreadCount: (channelId: string) => {
        return get().unreadChannels[channelId] || 0;
      }
    }),
    {
      name: "discord-unread-storage"
    }
  )
);
