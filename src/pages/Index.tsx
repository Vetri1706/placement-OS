import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import SidebarNav from "@/components/SidebarNav";
import TopBar from "@/components/TopBar";
import DashboardView from "@/components/DashboardView";
import CodingEditorView from "@/components/CodingEditorView";
import AIInterviewView from "@/components/AIInterviewView";
import ResourcesLibraryView from "@/components/ResourcesLibraryView";
import StatsView from "@/components/StatsView";


const views: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  ide: CodingEditorView,
  interview: AIInterviewView,
  library: ResourcesLibraryView,
  settings: StatsView,
};

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const ActiveComponent = views[activeView] || DashboardView;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <SidebarNav activeView={activeView} onViewChange={setActiveView} />
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
