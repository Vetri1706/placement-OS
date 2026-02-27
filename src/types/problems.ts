export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export type ProblemStatus = "not-started" | "attempted" | "solved";

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemTestCase {
  input: string;
  expected: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  points: number;
  description: string;
  fullDescription: string;
  constraints: string[];
  examples: ProblemExample[];
  hints: string[];
  editorial?: string;
  detailedExplanation?: string;
  approach?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  relatedTopics: string[];
  solveRate: number;
  estimatedMinutes: number;
  popularity: number;
  createdAt: string;
  starterCode: string;
  testCases: ProblemTestCase[];
}

export interface ProblemProgress {
  solvedProblemIds: string[];
  attemptedProblemIds: string[];
  xpTotal: number;
  level: number;
  streak: number;
  lastSolvedDate: string | null;
}

export const defaultProblemProgress: ProblemProgress = {
  solvedProblemIds: [],
  attemptedProblemIds: [],
  xpTotal: 0,
  level: 1,
  streak: 0,
  lastSolvedDate: null,
};
