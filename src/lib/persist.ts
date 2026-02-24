export interface PersistedStats {
  dailyProgress: number
  studyHours: number
  problemsSolved: number
  interviewSuccessRate: number
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