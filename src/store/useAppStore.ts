import { create } from "zustand"

export type View =
  | "dashboard"
  | "ide"
  | "interview"
  | "library"
  | "settings"

interface AppState {
  view: View
  setView: (v: View) => void

  userName: string
  setUserName: (name: string) => void

  streak: number
  setStreak: (n: number) => void

  dailyProgress: number
  setDailyProgress: (n: number) => void

  studyHours: number
  setStudyHours: (n: number) => void

  problemsSolved: number
  setProblemsSolved: (n: number) => void

  interviewSuccessRate: number
  setInterviewSuccessRate: (n: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  setView: (v) => set({ view: v }),

  userName: "Alex",
  setUserName: (name) => set({ userName: name }),

  streak: 12,
  setStreak: (n) => set({ streak: n }),

  dailyProgress: 33,
  setDailyProgress: (n) => set({ dailyProgress: n }),

  studyHours: 86,
  setStudyHours: (n) => set({ studyHours: n }),

  problemsSolved: 247,
  setProblemsSolved: (n) => set({ problemsSolved: n }),

  interviewSuccessRate: 74,
  setInterviewSuccessRate: (n) => set({ interviewSuccessRate: n }),
}))