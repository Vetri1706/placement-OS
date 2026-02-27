import { create } from "zustand"
import { calculateLevel, calculateStreak, XP_BY_DIFFICULTY } from "@/lib/problemUtils"
import { saveLastView } from "@/lib/viewPersist"
import type { Problem, ProblemProgress } from "@/types/problems"

export type View =
  | "dashboard"
  | "ide"
  | "problems"
  | "interview"
  | "library"
  | "settings"
  | "resume"
  | "roadmap"

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

  solvedProblemIds: string[]
  attemptedProblemIds: string[]
  xpTotal: number
  level: number
  lastSolvedDate: string | null

  hydrateProblemProgress: (progress: ProblemProgress) => void
  markProblemAttempted: (problemId: string) => void
  markProblemSolved: (problem: Pick<Problem, "id" | "difficulty">) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  setView: (v) => {
    saveLastView(v)
    set({ view: v })
  },

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

  solvedProblemIds: [],
  attemptedProblemIds: [],
  xpTotal: 0,
  level: 1,
  lastSolvedDate: null,

  hydrateProblemProgress: (progress) =>
    set({
      solvedProblemIds: progress.solvedProblemIds,
      attemptedProblemIds: progress.attemptedProblemIds,
      xpTotal: progress.xpTotal,
      level: progress.level,
      streak: progress.streak,
      lastSolvedDate: progress.lastSolvedDate,
      problemsSolved: progress.solvedProblemIds.length,
    }),

  markProblemAttempted: (problemId) =>
    set((state) => {
      if (state.solvedProblemIds.includes(problemId) || state.attemptedProblemIds.includes(problemId)) {
        return state
      }

      return {
        attemptedProblemIds: [...state.attemptedProblemIds, problemId],
      }
    }),

  markProblemSolved: (problem) =>
    set((state) => {
      const isAlreadySolved = state.solvedProblemIds.includes(problem.id)
      if (isAlreadySolved) {
        return state
      }

      const xpGained = XP_BY_DIFFICULTY[problem.difficulty]
      const nextXp = state.xpTotal + xpGained
      const nextLevel = calculateLevel(nextXp)

      const now = new Date()
      const streakDelta = calculateStreak(state.lastSolvedDate, now)
      const nextStreak = streakDelta === 0 ? state.streak : streakDelta === 1 ? state.streak + 1 : 1

      const solvedProblemIds = [...state.solvedProblemIds, problem.id]
      const attemptedProblemIds = state.attemptedProblemIds.includes(problem.id)
        ? state.attemptedProblemIds
        : [...state.attemptedProblemIds, problem.id]

      return {
        solvedProblemIds,
        attemptedProblemIds,
        xpTotal: nextXp,
        level: nextLevel,
        streak: nextStreak,
        lastSolvedDate: now.toISOString(),
        problemsSolved: solvedProblemIds.length,
      }
    }),
}))