import { motion } from "framer-motion";
import { LayoutDashboard, Code2, Mic, BookOpen, Settings, ListChecks, FileText, Map } from "lucide-react";
import { useAppStore, type View } from "@/store/useAppStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import studentIcon from "@/assets/student.svg";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" },
  { icon: Code2, label: "IDE", view: "ide" },
  { icon: ListChecks, label: "Problems", view: "problems" },
  { icon: Mic, label: "Interview", view: "interview" },
  { icon: BookOpen, label: "Library", view: "library" },
  { icon: FileText, label: "Resume", view: "resume" },
  { icon: Map, label: "Roadmap", view: "roadmap" },
  { icon: Settings, label: "Settings", view: "settings" },
] as const satisfies ReadonlyArray<{ icon: React.ComponentType<{ className?: string }>; label: string; view: View }>;

const SidebarNav = () => {
  const activeView = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  return (
    <motion.nav
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed left-4 inset-y-0 z-50 flex items-center"
    >
      <div className="glass-strong rounded-2xl p-3 flex flex-col gap-2 max-h-[80vh] overflow-visible">
        <div className="flex items-center justify-center mb-4 p-2">
          <img src={studentIcon} alt="" className="w-7 h-7" draggable={false} />
        </div>

        <TooltipProvider delayDuration={120}>
          <div className="flex flex-col gap-2 overflow-y-auto overflow-x-visible pr-1">
            {navItems.map((item) => {
              const isActive = activeView === item.view;
              return (
                <Tooltip key={item.view}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => setView(item.view)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative p-3 rounded-xl transition-colors duration-200 ${
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={item.label}
                      aria-label={item.label}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-xl glow-primary"
                          style={{ background: "hsl(200 100% 55% / 0.12)" }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon className="w-5 h-5 relative z-10" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </motion.nav>
  );
};

export default SidebarNav;
