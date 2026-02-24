import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { Target, Mic, FileText, Play, BookOpen, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const DashboardView = () => {
  const userName = useAppStore((s) => s.userName);
  const dailyProgress = useAppStore((s) => s.dailyProgress);
  const studyHours = useAppStore((s) => s.studyHours);
  const problemsSolved = useAppStore((s) => s.problemsSolved);
  const interviewSuccessRate = useAppStore((s) => s.interviewSuccessRate);

  const goals = [
    { label: "Complete React Module", done: true },
    { label: "Practice 2 Algorithm Problems", done: false },
    { label: "Mock Interview Session", done: false },
  ];
  const progress = Math.max(0, Math.min(100, dailyProgress));

  const resources = [
    { title: "React Hooks Deep Dive", type: "video", tag: "#React" },
    { title: "System Design Patterns", type: "pdf", tag: "#Architecture" },
    { title: "Dynamic Programming Guide", type: "pdf", tag: "#Algorithms" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-12 gap-4 auto-rows-min">
      {/* Hero Widget */}
      <GlassCard className="col-span-7 p-6" delay={0}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm mb-1">Good morning</p>
            <h2 className="text-2xl font-bold mb-4">Welcome back, <span className="text-gradient-primary">{userName}</span></h2>
            <p className="text-muted-foreground text-sm mb-4">You have {goals.filter(g => !g.done).length} tasks remaining today</p>
            <div className="space-y-2">
              {goals.map((goal, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${goal.done ? "border-accent bg-accent/20" : "border-muted-foreground"}`}>
                    {goal.done && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <span className={`text-sm ${goal.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{goal.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(225 15% 18%)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke="hsl(170 80% 50%)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 264} 264`}
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${(progress / 100) * 264} 264` }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{progress}%</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick Action - AI Interview */}
      <GlassCard className="col-span-5 p-6 flex flex-col justify-between" delay={0.1}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Interview</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Practice with our AI interviewer and get instant feedback</p>
        </div>
        {/* Waveform */}
        <div className="flex items-end gap-1 h-8 mb-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-primary/60"
              animate={{ height: [4, Math.random() * 24 + 4, 4] }}
              transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
            />
          ))}
        </div>
        <button className="neon-button text-primary-foreground font-semibold py-2.5 px-5 rounded-lg text-sm w-full">
          Start AI Interview
        </button>
      </GlassCard>

      {/* Stats Row */}
      {[
        { icon: Target, label: "Problems Solved", value: `${problemsSolved}`, change: "Total solved" },
        { icon: TrendingUp, label: "Study Hours", value: `${studyHours}h`, change: "Total study time" },
        { icon: BookOpen, label: "Interview Success Rate", value: `${interviewSuccessRate}%`, change: "Recent mock interviews" },
      ].map((stat, i) => (
        <GlassCard key={i} className="col-span-4 p-5" delay={0.2 + i * 0.05}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: "hsl(200 100% 55% / 0.1)" }}>
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
          <p className="text-xs text-accent mt-3">{stat.change}</p>
        </GlassCard>
      ))}

      {/* Recent Resources */}
      <GlassCard className="col-span-12 p-6" delay={0.4} hover={false}>
        <h3 className="text-lg font-semibold mb-4">Recent Resources</h3>
        <div className="grid grid-cols-3 gap-3">
          {resources.map((res, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="glass rounded-lg p-4 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                {res.type === "video" ? <Play className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-secondary" />}
                <span className="text-sm font-medium">{res.title}</span>
              </div>
              <span className="text-xs text-primary/70">{res.tag}</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default DashboardView;
