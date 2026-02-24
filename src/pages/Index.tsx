import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import SidebarNav from "@/components/SidebarNav";
import TopBar from "@/components/TopBar";
import DashboardView from "@/components/DashboardView";
import CodingEditorView from "@/components/CodingEditorView";
import AIInterviewView from "@/components/AIInterviewView";
import ResourcesLibraryView from "@/components/ResourcesLibraryView";
import StatsView from "@/components/StatsView";
import { loadDashboardStats, loadUser, saveDashboardStats, saveUser } from "@/lib/persist";
import { useAppStore } from "@/store/useAppStore";


const views: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  ide: CodingEditorView,
  interview: AIInterviewView,
  library: ResourcesLibraryView,
  settings: StatsView,
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

  useEffect(() => {
    loadUser().then((name) => {
      if (name) setUserName(name);
    });

    loadDashboardStats().then((stats) => {
      if (typeof stats.dailyProgress === "number") setDailyProgress(stats.dailyProgress);
      if (typeof stats.studyHours === "number") setStudyHours(stats.studyHours);
      if (typeof stats.problemsSolved === "number") setProblemsSolved(stats.problemsSolved);
      if (typeof stats.interviewSuccessRate === "number") setInterviewSuccessRate(stats.interviewSuccessRate);
    });
  }, [setDailyProgress, setInterviewSuccessRate, setProblemsSolved, setStudyHours, setUserName]);

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

  const ActiveComponent = views[activeView] || DashboardView;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <SidebarNav />
      <div className="ml-20 relative z-10">
        <TopBar />
        <main className="px-6 pb-6">
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
