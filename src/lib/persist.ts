export interface PersistedStats {
  dailyProgress: number
  studyHours: number
  problemsSolved: number
  interviewSuccessRate: number
}

export interface PersistedProblemProgress {
  solvedProblemIds: string[]
  attemptedProblemIds: string[]
  xpTotal: number
  level: number
  streak: number
  lastSolvedDate: string | null
}

export async function saveUser(name: string) {
  await window.appStore.set("userName", name)
}

export async function loadUser() {
  return await window.appStore.get("userName")
}

export async function saveDashboardStats(stats: PersistedStats) {
  await window.appStore.set("dailyProgress", stats.dailyProgress)
  await window.appStore.set("studyHours", stats.studyHours)
  await window.appStore.set("problemsSolved", stats.problemsSolved)
  await window.appStore.set("interviewSuccessRate", stats.interviewSuccessRate)
}

export async function loadDashboardStats() {
  const dailyProgress = await window.appStore.get("dailyProgress")
  const studyHours = await window.appStore.get("studyHours")
  const problemsSolved = await window.appStore.get("problemsSolved")
  const interviewSuccessRate = await window.appStore.get("interviewSuccessRate")

  return {
    dailyProgress,
    studyHours,
    problemsSolved,
    interviewSuccessRate,
  }
}

export async function saveProblemProgress(progress: PersistedProblemProgress) {
  await window.appStore.set("problemProgress", progress)
}

export async function loadProblemProgress(): Promise<PersistedProblemProgress> {
  const stored = await window.appStore.get("problemProgress")

  return {
    solvedProblemIds: Array.isArray(stored?.solvedProblemIds) ? stored.solvedProblemIds : [],
    attemptedProblemIds: Array.isArray(stored?.attemptedProblemIds) ? stored.attemptedProblemIds : [],
    xpTotal: typeof stored?.xpTotal === "number" ? stored.xpTotal : 0,
    level: typeof stored?.level === "number" ? stored.level : 1,
    streak: typeof stored?.streak === "number" ? stored.streak : 0,
    lastSolvedDate: typeof stored?.lastSolvedDate === "string" ? stored.lastSolvedDate : null,
  }
}