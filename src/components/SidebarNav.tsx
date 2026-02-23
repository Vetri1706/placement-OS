import { motion } from "framer-motion";
import { LayoutDashboard, Code2, Mic, BookOpen, Settings, GraduationCap } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" },
  { icon: Code2, label: "IDE", view: "ide" },
  { icon: Mic, label: "Interview", view: "interview" },
  { icon: BookOpen, label: "Library", view: "library" },
  { icon: Settings, label: "Settings", view: "settings" },
];

interface SidebarNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const SidebarNav = ({ activeView, onViewChange }: SidebarNavProps) => {
  return (
    <motion.nav
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 glass-strong rounded-2xl p-3 flex flex-col gap-2"
    >
      <div className="flex items-center justify-center mb-4 p-2">
        <GraduationCap className="w-6 h-6 text-primary" />
      </div>

      {navItems.map((item) => {
        const isActive = activeView === item.view;
        return (
          <motion.button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-3 rounded-xl transition-colors duration-200 group ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
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
            <div className="absolute left-full ml-3 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity glass-strong text-foreground pointer-events-none">
              {item.label}
            </div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
};

export default SidebarNav;
