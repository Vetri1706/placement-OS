import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import SidebarNav from "@/components/SidebarNav";
import TopBar from "@/components/TopBar";
import DashboardView from "@/components/DashboardView";
import CodingEditorView from "@/components/CodingEditorView";
import ProblemsPage from "@/components/ProblemsPage";
import AIInterviewView from "@/components/AIInterviewView";
import ResourcesLibraryView from "@/components/ResourcesLibraryView";
import SettingsView from "@/components/SettingsView";
import ResumeAnalyzerView from "@/components/ResumeAnalyzerView";
import RoadmapView from "@/components/RoadmapView";
import { loadDashboardStats, loadProblemProgress, loadUser, saveDashboardStats, saveProblemProgress, saveUser } from "@/lib/persist";
import { useAppStore } from "@/store/useAppStore";
import ResumeAnalyzer from "@/features/resume/ResumeAnalyzer";

const views: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  ide: CodingEditorView,
  problems: ProblemsPage,
  interview: AIInterviewView,
  library: ResourcesLibraryView,
  resume: ResumeAnalyzerView,
  roadmap: RoadmapView,
  settings: SettingsView,
};

const Index = () => {
  const activeView = useAppStore((s) => s.view);
  const userName = useAppStore((s) => s.userName);
  const setUserName = useAppStore((s) => s.setUserName);
  const dailyProgress = useAppStore((s) => s.dailyProgress);
  const setDailyProgress = useAppStore((s) => s.setDailyProgress);
  const studyHours = useAppStore((s) => s.studyHours);
  const setStudyHours = useAppStore((s) => s.setStudyHours);
  const problemsSolved = useAppStore((s) => s.problemsSolved);
  const setProblemsSolved = useAppStore((s) => s.setProblemsSolved);
  const interviewSuccessRate = useAppStore((s) => s.interviewSuccessRate);
  const setInterviewSuccessRate = useAppStore((s) => s.setInterviewSuccessRate);
  const solvedProblemIds = useAppStore((s) => s.solvedProblemIds);
  const attemptedProblemIds = useAppStore((s) => s.attemptedProblemIds);
  const xpTotal = useAppStore((s) => s.xpTotal);
  const level = useAppStore((s) => s.level);
  const streak = useAppStore((s) => s.streak);
  const lastSolvedDate = useAppStore((s) => s.lastSolvedDate);
  const hydrateProblemProgress = useAppStore((s) => s.hydrateProblemProgress);

  useEffect(() => {
    loadUser().then((name) => {
      if (name) {
        setUserName(name);
      } else {
        // Fallback: sync from settings localStorage
        try {
          const settings = localStorage.getItem("ai-interview-coach/profile-settings");
          if (settings) {
            const parsed = JSON.parse(settings);
            if (parsed.name) setUserName(parsed.name);
          }
        } catch { /* ignore */ }
      }
    });

    loadDashboardStats().then((stats) => {
      if (typeof stats.dailyProgress === "number") setDailyProgress(stats.dailyProgress);
      if (typeof stats.studyHours === "number") setStudyHours(stats.studyHours);
      if (typeof stats.problemsSolved === "number") setProblemsSolved(stats.problemsSolved);
      if (typeof stats.interviewSuccessRate === "number") setInterviewSuccessRate(stats.interviewSuccessRate);
    });

    loadProblemProgress().then((progress) => {
      hydrateProblemProgress(progress);
    });
  }, [setDailyProgress, setInterviewSuccessRate, setProblemsSolved, setStudyHours, setUserName, hydrateProblemProgress]);

  useEffect(() => {
    saveUser(userName);
  }, [userName]);

  useEffect(() => {
    saveDashboardStats({
      dailyProgress,
      studyHours,
      problemsSolved,
      interviewSuccessRate,
    });
  }, [dailyProgress, studyHours, problemsSolved, interviewSuccessRate]);

  useEffect(() => {
    saveProblemProgress({
      solvedProblemIds,
      attemptedProblemIds,
      xpTotal,
      level,
      streak,
      lastSolvedDate,
    });
  }, [solvedProblemIds, attemptedProblemIds, xpTotal, level, streak, lastSolvedDate]);

  const ActiveComponent = views[activeView] || DashboardView;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <SidebarNav />
      <div className="ml-20 relative z-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="px-6 pb-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Index;
