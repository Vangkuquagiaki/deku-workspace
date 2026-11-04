import { create } from "zustand";
import { Channel, ChannelType, Member, Profile, Server } from "@prisma/client";

export type ModalType =
  | "createServer"
  | "invite"
  | "editServer"
  | "members"
  | "createChannel"
  | "leaveServer"
  | "deleteServer"
  | "deleteChannel"
  | "editChannel"
  | "messageFile"
  | "deleteMessage"
  | "userSettings"
  | "pinnedMessages"
  | "userProfile"
  | "editProfile";

interface ModalData {
  server?: Server;
  channel?: Channel;
  channelType?: ChannelType;
  profile?: Profile;
  member?: Member & { profile: Profile };
  apiUrl?: string;
  query?: Record<string, any>;
  channelId?: string;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ isOpen: false, type: null })
}));
