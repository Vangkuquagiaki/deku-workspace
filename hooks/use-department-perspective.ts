import { create } from "zustand";

export type DepartmentPerspective = "ALL" | "BDH" | "IT" | "SALES" | "HR" | "FIN";

interface PerspectiveStore {
  perspective: DepartmentPerspective;
  setPerspective: (p: DepartmentPerspective) => void;
}

const STORAGE_KEY = "discord_dept_perspective";

export const useDepartmentPerspective = create<PerspectiveStore>((set) => ({
  perspective: "ALL",
  setPerspective: (perspective) => {
    try {
      localStorage.setItem(STORAGE_KEY, perspective);
    } catch (e) {}
    set({ perspective });
  },
}));

