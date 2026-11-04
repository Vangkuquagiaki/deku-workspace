import { create } from "zustand";

interface ReplyMessage {
  id: string;
  name: string;
  content: string;
}

interface ChatReplyStore {
  replyingTo: ReplyMessage | null;
  setReply: (message: ReplyMessage) => void;
  clearReply: () => void;
}

export const useChatReply = create<ChatReplyStore>((set) => ({
  replyingTo: null,
  setReply: (message) => set({ replyingTo: message }),
  clearReply: () => set({ replyingTo: null })
}));
