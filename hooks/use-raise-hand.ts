import { create } from "zustand";

interface RaiseHandStore {
  raisedHands: Record<string, boolean>;
  setRaisedHand: (memberId: string, isRaised: boolean) => void;
  clearRaisedHands: () => void;
}

export const useRaiseHand = create<RaiseHandStore>((set) => ({
  raisedHands: {},
  setRaisedHand: (memberId, isRaised) =>
    set((state) => ({
      raisedHands: { ...state.raisedHands, [memberId]: isRaised }
    })),
  clearRaisedHands: () => set({ raisedHands: {} })
}));
