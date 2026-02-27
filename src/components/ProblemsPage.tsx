import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Clock3, Trophy, CheckCircle2, CircleDashed, CircleDotDashed } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockProblems } from "@/data/mockProblems";
import { getProgressPercent } from "@/lib/problemUtils";
import { useAppStore } from "@/store/useAppStore";
import type { Problem, ProblemDifficulty, ProblemStatus } from "@/types/problems";

const difficultyOptions: Array<ProblemDifficulty | "All"> = ["All", "Easy", "Medium", "Hard"];

type SortOption = "Most Popular" | "Newest" | "Points";

function getDifficultyBadgeClasses(difficulty: ProblemDifficulty) {
  if (difficulty === "Easy") return "bg-accent/20 text-accent border-accent/40";
  if (difficulty === "Medium") return "bg-primary/20 text-primary border-primary/40";
  return "bg-destructive/20 text-destructive border-destructive/40";
}

function getStatus(problemId: string, solvedProblemIds: string[], attemptedProblemIds: string[]): ProblemStatus {
  if (solvedProblemIds.includes(problemId)) return "solved";
  if (attemptedProblemIds.includes(problemId)) return "attempted";
  return "not-started";
}

function getStatusBadge(status: ProblemStatus) {
  if (status === "solved") {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-accent font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" /> Solved
      </span>
    );
  }

  if (status === "attempted") {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
        <CircleDotDashed className="h-3.5 w-3.5" /> Attempted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-foreground/70">
      <CircleDashed className="h-3.5 w-3.5" /> Not Started
    </span>
  );
}

const ProblemsPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<ProblemDifficulty | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Most Popular");

  const solvedProblemIds = useAppStore((s) => s.solvedProblemIds);
  const attemptedProblemIds = useAppStore((s) => s.attemptedProblemIds);
  const xpTotal = useAppStore((s) => s.xpTotal);
  const level = useAppStore((s) => s.level);
  const streak = useAppStore((s) => s.streak);

  const filteredProblems = useMemo(() => {
    let items = [...mockProblems];

    if (difficulty !== "All") {
      items = items.filter((problem) => problem.difficulty === difficulty);
    }

    if (query.trim()) {
      const normalized = query.toLowerCase();
      items = items.filter((problem) => {
        const inTitle = problem.title.toLowerCase().includes(normalized);
        const inTags = problem.tags.some((tag) => tag.toLowerCase().includes(normalized));
        return inTitle || inTags;
      });
    }

    if (sortBy === "Most Popular") {
      items.sort((a, b) => b.popularity - a.popularity);
    } else if (sortBy === "Newest") {
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else {
      items.sort((a, b) => b.points - a.points);
    }

    return items;
  }, [difficulty, query, sortBy]);

  const solvedCount = solvedProblemIds.length;
  const totalProblems = mockProblems.length;
  const solvedProgress = Math.round((solvedCount / totalProblems) * 100);
  const levelProgress = getProgressPercent({ xpTotal, level });

  const goToProblem = (problem: Problem) => {
    navigate(`/problem/${problem.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <GlassCard className="p-5" hover={false}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">Coding Challenges</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sharpen your placement prep with curated coding problems.</p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 lg:max-w-3xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search problems or tags"
                className="glass w-full rounded-lg bg-transparent py-2 pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary/50"
              />
            </label>

            <div className="glass flex items-center rounded-lg p-1">
              {difficultyOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setDifficulty(option)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                    difficulty === option ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="glass rounded-lg bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option>Most Popular</option>
              <option>Newest</option>
              <option>Points</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <GlassCard className="p-4 xl:col-span-1" hover={false}>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Solved</span>
                <span className="font-semibold">{solvedCount}/{totalProblems}</span>
              </div>
              <Progress value={solvedProgress} className="h-2 bg-muted/60" />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>XP</span>
                <span className="font-semibold">{xpTotal}</span>
              </div>
              <Progress value={levelProgress} className="h-2 bg-muted/60" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="glass rounded-lg p-2 text-center">
                <p className="text-foreground/70 text-sm">Level</p>
                <p className="mt-1 text-lg font-semibold text-primary">{level}</p>
              </div>
              <div className="glass rounded-lg p-2 text-center">
                <p className="text-foreground/70 text-sm">Streak</p>
                <p className="mt-1 text-lg font-semibold text-gradient-warm">{streak}d</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-3">
          {filteredProblems.map((problem, index) => {
            const status = getStatus(problem.id, solvedProblemIds, attemptedProblemIds);

            return (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.02 }}
                whileHover={{ y: -2 }}
              >
                <GlassCard className="h-full p-4" hover={false}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{problem.title}</h3>
                      <p className="mt-1 text-sm text-foreground/70">{problem.description}</p>
                    </div>
                    <Badge variant="outline" className={getDifficultyBadgeClasses(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-muted/40 px-2 py-1 text-sm text-foreground/70">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="inline-flex items-center gap-1 text-primary">
                      <Trophy className="h-3.5 w-3.5" /> +{problem.points} XP
                    </div>
                    <div className="inline-flex items-center gap-1 text-foreground/70">
                      <Clock3 className="h-3.5 w-3.5" /> {problem.estimatedMinutes} min
                    </div>
                    <div className="text-right">{getStatusBadge(status)}</div>
                  </div>

                  <Button className="w-full" onClick={() => goToProblem(problem)}>
                    Solve Problem
                  </Button>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ProblemsPage;
