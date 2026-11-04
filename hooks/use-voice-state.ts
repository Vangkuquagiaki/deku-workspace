import { create } from "zustand";
import { sounds } from "@/lib/sounds";

export interface VoiceParticipant {
  id: string;
  name: string;
  imageUrl: string;
  micMuted?: boolean;
  deafened?: boolean;
  isSpeaking?: boolean;
}

interface VoiceStore {
  connectedChannelId: string | null;
  connectedServerId: string | null;
  connectedChannelName: string | null;
  currentMember: VoiceParticipant | null;
  isVideo: boolean;
  isSideChatOpen: boolean;
  isManualFloating: boolean;
  participants: Record<string, VoiceParticipant[]>;

  connectVoice: (
    serverId: string,
    channelId: string,
    channelName: string,
    member: VoiceParticipant,
    isVideo?: boolean
  ) => void;
  disconnectVoice: (memberId?: string) => void;
  setSideChatOpen: (open: boolean) => void;
  toggleSideChat: () => void;
  setManualFloating: (floating: boolean) => void;
  toggleManualFloating: () => void;
  addParticipant: (channelId: string, member: VoiceParticipant) => void;
  removeParticipant: (channelId: string, identifier: string) => void;
  setParticipantMute: (
    channelId: string,
    memberId: string,
    micMuted: boolean
  ) => void;
  setParticipantDeafen: (
    channelId: string,
    memberId: string,
    deafened: boolean
  ) => void;
  setParticipantSpeaking: (
    channelId: string,
    memberId: string,
    isSpeaking: boolean
  ) => void;
}

const isSameMember = (
  p: VoiceParticipant,
  target: { id?: string | null; name?: string | null }
) => {
  if (target.id && p.id === target.id) return true;
  if (target.name && p.name && p.name.trim() === target.name.trim()) return true;
  return false;
};

export const useVoiceState = create<VoiceStore>((set, get) => ({
  connectedChannelId: null,
  connectedServerId: null,
  connectedChannelName: null,
  currentMember: null,
  isVideo: false,
  isSideChatOpen: false,
  isManualFloating: false,
  participants: {},

  connectVoice: (serverId, channelId, channelName, member, isVideo = false) => {
    sounds.playJoinVoice();
    const existing = get().participants;
    const updated: Record<string, VoiceParticipant[]> = {};

    // Strict rule: A user can only be in ONE voice/video room at any given time.
    // Purge this user from ALL existing channels in the server.
    for (const [chId, list] of Object.entries(existing)) {
      const filtered = list.filter((m) => !isSameMember(m, member));
      if (chId === channelId) {
        updated[chId] = [...filtered, member];
      } else if (filtered.length > 0) {
        updated[chId] = filtered;
      }
    }

    if (!updated[channelId]) {
      updated[channelId] = [member];
    }

    set({
      connectedChannelId: channelId,
      connectedServerId: serverId,
      connectedChannelName: channelName,
      currentMember: member,
      isVideo: !!isVideo,
      isManualFloating: false,
      participants: updated,
    });
  },

  disconnectVoice: (memberId?: string) => {
    sounds.playLeaveVoice();
    const { currentMember, participants } = get();
    const target = {
      id: memberId || currentMember?.id,
      name: currentMember?.name,
    };

    const updated: Record<string, VoiceParticipant[]> = {};
    for (const [chId, list] of Object.entries(participants)) {
      const filtered = list.filter((m) => !isSameMember(m, target));
      if (filtered.length > 0) {
        updated[chId] = filtered;
      }
    }

    set({
      connectedChannelId: null,
      connectedServerId: null,
      connectedChannelName: null,
      currentMember: null,
      isVideo: false,
      isSideChatOpen: false,
      isManualFloating: false,
      participants: updated,
    });
  },

  setSideChatOpen: (open: boolean) => set({ isSideChatOpen: open }),
  toggleSideChat: () => set((state) => ({ isSideChatOpen: !state.isSideChatOpen })),
  setManualFloating: (floating: boolean) => set({ isManualFloating: floating }),
  toggleManualFloating: () => set((state) => ({ isManualFloating: !state.isManualFloating })),

  addParticipant: (channelId, member) => {
    const existing = get().participants;
    const updated: Record<string, VoiceParticipant[]> = {};

    // Strict rule: When adding a participant to channelId,
    // remove them from all other channels so they never appear duplicated.
    for (const [chId, list] of Object.entries(existing)) {
      const filtered = list.filter((m) => !isSameMember(m, member));
      if (chId === channelId) {
        updated[chId] = [...filtered, member];
      } else if (filtered.length > 0) {
        updated[chId] = filtered;
      }
    }

    if (!updated[channelId]) {
      updated[channelId] = [member];
    }

    set({
      participants: updated,
    });
  },

  removeParticipant: (channelId, identifier) => {
    if (!identifier) return;
    const existing = get().participants;
    const updated: Record<string, VoiceParticipant[]> = {};
    const target = { id: identifier, name: identifier };

    for (const [chId, list] of Object.entries(existing)) {
      if (chId === channelId || !channelId) {
        const filtered = list.filter((m) => !isSameMember(m, target));
        if (filtered.length > 0) {
          updated[chId] = filtered;
        }
      } else if (list.length > 0) {
        updated[chId] = list;
      }
    }

    set({
      participants: updated,
    });
  },

  setParticipantMute: (channelId, memberId, micMuted) => {
    const current = get().participants[channelId] || [];
    set({
      participants: {
        ...get().participants,
        [channelId]: current.map((m) =>
          isSameMember(m, { id: memberId, name: memberId })
            ? { ...m, micMuted }
            : m
        ),
      },
    });
  },

  setParticipantDeafen: (channelId, memberId, deafened) => {
    const current = get().participants[channelId] || [];
    set({
      participants: {
        ...get().participants,
        [channelId]: current.map((m) =>
          isSameMember(m, { id: memberId, name: memberId })
            ? { ...m, deafened, micMuted: deafened ? true : m.micMuted }
            : m
        ),
      },
    });
  },

  setParticipantSpeaking: (channelId, memberId, isSpeaking) => {
    const current = get().participants[channelId] || [];
    set({
      participants: {
        ...get().participants,
        [channelId]: current.map((m) =>
          isSameMember(m, { id: memberId, name: memberId })
            ? { ...m, isSpeaking }
            : m
        ),
      },
    });
  },
}));
