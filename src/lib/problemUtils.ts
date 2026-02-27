import type { ProblemDifficulty, ProblemProgress } from "@/types/problems";

export const XP_BY_DIFFICULTY: Record<ProblemDifficulty, number> = {
  Easy: 50,
  Medium: 100,
  Hard: 200,
};

export const XP_PER_LEVEL = 300;

export function calculateLevel(xp: number) {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export function calculateStreak(lastSolvedDate: string | null, now = new Date()): number {
  if (!lastSolvedDate) return 1;

  const previous = new Date(lastSolvedDate);
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const previousDay = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  const deltaDays = Math.round((currentDay.getTime() - previousDay.getTime()) / msPerDay);

  if (deltaDays === 0) return 0;
  if (deltaDays === 1) return 1;
  return -1;
}

export function getProgressPercent(progress: Pick<ProblemProgress, "xpTotal" | "level">) {
  const xpForCurrentLevel = (progress.level - 1) * XP_PER_LEVEL;
  const xpIntoLevel = progress.xpTotal - xpForCurrentLevel;
  return Math.max(0, Math.min(100, (xpIntoLevel / XP_PER_LEVEL) * 100));
}
