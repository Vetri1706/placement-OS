import { create } from "zustand";

type View =
  | "dashboard"
  | "ide"
  | "interview"
  | "library"
  | "settings";

interface AppState {
  view: View;
  setView: (v: View) => void;

  userName: string;
  setUserName: (name: string) => void;

  streak: number;
  setStreak: (n: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  setView: (v) => set({ view: v }),

  userName: "Alex",
  setUserName: (name) => set({ userName: name }),

  streak: 12,
  setStreak: (n) => set({ streak: n }),
}));