import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useInView,
} from "framer-motion";
import {
  Code2,
  Brain,
  FileSearch,
  BarChart3,
  BookOpen,
  Wifi,
  WifiOff,
  Download,
  Moon,
  Sun,
  Github,
  CheckCircle2,
  Zap,
  Shield,
  Trophy,
  ArrowRight,
  Star,
  Terminal,
  Monitor,
  Apple,
  Layers,
  Clock,
  TrendingUp,
  ChevronRight,
  PlayCircle,
  Cpu,
  HardDrive,
  MemoryStick,
  ExternalLink,
  Activity,
  Target,
} from "lucide-react";

// ─────────────────────────────────────────────
// Helpers / constants
// ─────────────────────────────────────────────

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT, delay: i * 0.08 },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut", delay: i * 0.07 },
  }),
};

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const handler = () => setY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return y;
}

function useTheme() {
  const [dark, setDark] = useState(true);
  const toggle = useCallback(() => setDark((d) => !d), []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle };
}

// ─────────────────────────────────────────────
// Blob background
// ─────────────────────────────────────────────

function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[
        { top: "-20%", left: "-10%", color: "#10b981", size: "70vw" },
        { top: "30%", right: "-15%", color: "#6366f1", size: "60vw" },
        { bottom: "-10%", left: "20%", color: "#f43f5e", size: "50vw" },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen"
          style={{
            top: b.top,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle, ${b.color}22 0%, transparent 70%)`,
          }}
          animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
          transition={{
            duration: 14 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 3,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Noise overlay
// ─────────────────────────────────────────────

function Noise() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px",
      }}
      aria-hidden
    />
  );
}

// ─────────────────────────────────────────────
// Glass card primitive
// ─────────────────────────────────────────────

interface GlassProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}

function Glass({ children, className = "", hover = false, style }: GlassProps) {
  return (
    <motion.div
      className={`rounded-2xl border bg-white/5 backdrop-blur-xl dark:bg-white/5 light:bg-black/5
        border-white/10 dark:border-white/10 light:border-black/10 ${
          hover
            ? "transition-shadow hover:shadow-[0_0_32px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 cursor-default"
            : ""
        } ${className}`}
      style={style}
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Download", href: "#download" },
  { label: "Docs", href: "#docs" },
];

function Navbar({ dark, toggleTheme }: { dark: boolean; toggleTheme: () => void }) {
  const scrollY = useScrollY();
  const solid = scrollY > 60;

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-white/10 backdrop-blur-2xl bg-[var(--nav-bg-solid)]"
          : "bg-transparent"
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group" onClick={(e) => scrollTo(e, "#top")}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Layers className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold tracking-tight text-[var(--text)] text-[15px]">
            Placement<span className="text-emerald-400">OS</span>
          </span>
        </a>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => scrollTo(e, l.href)}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/8 transition-all"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 transition-all"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a
            href="#download"
            onClick={(e) => scrollTo(e, "#download")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-400/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={3} />
            Download App
          </a>
        </div>
      </div>
    </motion.header>
  );
}

// ─────────────────────────────────────────────
// Hero floating stat cards
// ─────────────────────────────────────────────

function FloatCard({
  icon,
  label,
  value,
  accent,
  delay = 0,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`glass-card absolute z-10 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl
        border border-white/10 bg-white/8 backdrop-blur-xl shadow-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
      whileHover={{ scale: 1.04 }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5 + delay, repeat: Infinity, ease: "easeInOut" }}
        className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}
      >
        {icon}
      </motion.div>
      <div>
        <div className="text-xs text-[var(--muted)] font-semibold leading-none mb-0.5">{label}</div>
        <div className="text-sm font-extrabold text-[var(--text)] leading-none">{value}</div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Mock app UI (hero right panel)
// ─────────────────────────────────────────────

function AppMockup() {
  return (
    <motion.div
      className="relative w-full max-w-sm mx-auto"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.3 }}
    >
      {/* Main panel */}
      <div className="rounded-2xl border border-white/10 bg-[var(--mockup-bg)] backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8">
          <span className="w-3 h-3 rounded-full bg-red-400/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <span className="ml-auto text-[10px] text-[var(--muted)] font-mono">placement-os v1.0</span>
        </div>

        {/* Sidebar + content */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-12 border-r border-white/8 flex flex-col items-center py-4 gap-3">
            {[Code2, Brain, FileSearch, BarChart3, BookOpen].map((Icon, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  i === 0 ? "bg-emerald-500/20 text-emerald-400" : "text-[var(--muted)] hover:bg-white/8"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 space-y-2">
            {/* Problem header */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                  Medium
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/8 text-[var(--muted)]">
                  DP
                </span>
              </div>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            {/* Code skeleton */}
            <div className="rounded-xl bg-black/30 p-2.5 font-mono text-[9px] space-y-1.5">
              <span className="text-purple-400">def</span>
              <span className="text-white ml-1">climbStairs</span>
              <span className="text-white/40">(n: int) -&gt; int:</span>
              {["    dp = [0] * (n+1)", "    dp[0], dp[1] = 1, 1", "    for i in range(2,n+1):", "        dp[i]=dp[i-1]+dp[i-2]"].map(
                (line, i) => (
                  <div key={i} className="text-cyan-300/80">
                    {line}
                  </div>
                )
              )}
              <motion.div
                className="w-1 h-3 bg-emerald-400 inline-block"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>

            {/* AI hint bar */}
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
              <Brain className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[9px] text-emerald-300 font-semibold">
                AI: Consider memoization for O(n) space
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat cards */}
      <FloatCard
        icon={<Trophy className="w-4 h-4 text-yellow-300" />}
        label="Interview Success"
        value="93%"
        accent="bg-yellow-500/20"
        delay={0.8}
        className="-top-5 -left-10"
      />
      <FloatCard
        icon={<WifiOff className="w-4 h-4 text-emerald-300" />}
        label="Works Offline"
        value="Always Ready"
        accent="bg-emerald-500/20"
        delay={1.0}
        className="-bottom-5 -left-8"
      />
      <FloatCard
        icon={<Zap className="w-4 h-4 text-cyan-300" />}
        label="AI Latency"
        value="~110 ms"
        accent="bg-cyan-500/20"
        delay={1.2}
        className="top-8 -right-10"
      />
      <FloatCard
        icon={<TrendingUp className="w-4 h-4 text-pink-300" />}
        label="Coding Streak"
        value="14 days 🔥"
        accent="bg-pink-500/20"
        delay={1.4}
        className="bottom-16 -right-8"
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────

function HeroSection() {
  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center pt-24 pb-20 px-4 overflow-hidden"
    >
      <GradientBlobs />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10 relative">
        {/* Left */}
        <div>
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Offline-ready • Local AI Powered • No Subscription
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-tight text-[var(--text)] leading-[0.95] mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Your AI
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
              Placement
            </span>
            <br />
            Operating System
          </motion.h1>

          <motion.p
            className="text-[var(--muted)] text-lg leading-relaxed max-w-lg mb-8"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            The all-in-one desktop platform that combines a coding IDE, AI mock
            interviews, resume analysis, and progress tracking — running entirely
            on your machine, even offline.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <button
              onClick={() => scrollTo("#download")}
              className="group flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4" strokeWidth={3} />
              Download for Desktop
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollTo("#features")}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 bg-white/6 backdrop-blur-sm text-[var(--text)] font-bold text-sm hover:border-white/30 hover:bg-white/10 transition-all"
            >
              <PlayCircle className="w-4 h-4 text-[var(--muted)]" />
              Learn More
            </button>
          </motion.div>

          {/* Pill tags */}
          <motion.div
            className="flex flex-wrap gap-2 mt-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            {[
              { icon: <Monitor className="w-3 h-3" />, label: "Windows" },
              { icon: <Apple className="w-3 h-3" />, label: "macOS" },
              { icon: <Terminal className="w-3 h-3" />, label: "Linux" },
              { icon: <WifiOff className="w-3 h-3" />, label: "Offline Mode" },
            ].map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/12 bg-white/5 text-[var(--muted)] text-xs font-semibold"
              >
                {p.icon}
                {p.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right */}
        <div className="relative flex justify-center lg:justify-end">
          <AppMockup />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
          <div className="w-1 h-2.5 rounded-full bg-white/40" />
        </div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Features
// ─────────────────────────────────────────────

const FEATURES = [
  {
    icon: Code2,
    title: "Coding IDE",
    desc: "Monaco-based editor with syntax highlighting, multi-language support, and integrated test runner for over 100+ placement problems.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    preview: "code",
  },
  {
    icon: Brain,
    title: "AI Interview Simulator",
    desc: "Conduct full mock interviews with an AI that asks adapted follow-up questions, rates your answers, and gives detailed feedback.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    preview: "interview",
  },
  {
    icon: FileSearch,
    title: "Resume Analyzer",
    desc: "Upload your PDF resume. Local AI extracts insights, scores ATS-compatibility, and suggests targeted improvements.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    preview: "resume",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    desc: "Rich dashboard visualizing your topic mastery, daily streaks, submissions history, and predicted readiness score.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    preview: "analytics",
  },
  {
    icon: BookOpen,
    title: "Resource Library",
    desc: "Curated collection of guides, cheat sheets, and video links — organized by topic, filterable, and available offline.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    preview: "library",
  },
  {
    icon: WifiOff,
    title: "Offline Mode",
    desc: "Every feature works without internet once set up. Local Ollama model handles all AI — no API keys, no billing, no data sent.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    preview: "offline",
  },
];

function FeaturePreview({ type, color }: { type: string; color: string }) {
  if (type === "code") {
    return (
      <div className="rounded-xl bg-black/30 p-3 font-mono text-[10px] space-y-1 mt-3">
        {["function twoSum(nums, target) {", "  const map = new Map();", "  for (let i=0; ...", "  // O(n) solution"].map((l, i) => (
          <div key={i} className={`${i === 0 ? "text-purple-300" : i === 3 ? "text-white/30" : "text-cyan-200/70"}`}>
            {l}
          </div>
        ))}
      </div>
    );
  }
  if (type === "interview") {
    return (
      <div className="rounded-xl bg-black/20 p-3 space-y-2 mt-3">
        <div className="flex gap-2">
          <Brain className={`w-3.5 h-3.5 ${color} shrink-0 mt-0.5`} />
          <p className="text-[10px] text-[var(--muted)]">Explain the difference between BFS and DFS...</p>
        </div>
        <div className="flex gap-2 pl-2">
          <div className="w-1 h-6 rounded-full bg-white/10 shrink-0 mt-0.5" />
          <p className="text-[10px] text-[var(--text)]/70">BFS uses a queue and explores level by...</p>
        </div>
      </div>
    );
  }
  if (type === "analytics") {
    return (
      <div className="mt-3 space-y-1.5">
        {[
          { label: "Arrays & Strings", pct: 82 },
          { label: "Dynamic Programming", pct: 55 },
          { label: "Graphs", pct: 38 },
        ].map(({ label, pct }) => (
          <div key={label}>
            <div className="flex justify-between text-[9px] text-[var(--muted)] mb-0.5">
              <span>{label}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <motion.div
                className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
                style={{ width: "0%" }}
                whileInView={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: EASE_OUT }}
                viewport={{ once: true }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  // generic skeleton for others
  return (
    <div className="mt-3 space-y-2">
      {[100, 75, 55].map((w, i) => (
        <div key={i} className="h-2 rounded-full bg-white/8" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="py-28 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/12 text-[var(--muted)] text-xs font-bold mb-4">
            <Star className="w-3 h-3 text-yellow-400" />
            Everything you need
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text)] mb-4">
            Built for placement. Not just{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              practice.
            </span>
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            Six powerful modules, one desktop app. No browser tabs, no monthly fees,
            no latency from faraway servers.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className={`rounded-2xl border ${f.border} bg-white/[0.04] backdrop-blur-xl p-5 
                hover:bg-white/[0.07] hover:shadow-2xl transition-all cursor-default group`}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
            >
              <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-[var(--text)] text-base mb-2">{f.title}</h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">{f.desc}</p>
              <FeaturePreview type={f.preview} color={f.color} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Screenshots / product panels
// ─────────────────────────────────────────────

const PANELS = [
  {
    title: "Smart Coding IDE",
    desc: "Monaco editor with AI hints, test runner, and submission history side by side.",
    gradient: "from-emerald-900/60 to-cyan-900/40",
    accent: "text-emerald-400",
    content: "ide",
  },
  {
    title: "AI Interview Mode",
    desc: "Voice or text — the AI adapts questions based on your previous answers.",
    gradient: "from-violet-900/60 to-indigo-900/40",
    accent: "text-violet-400",
    content: "interview-full",
  },
  {
    title: "Resume Intelligence",
    desc: "Upload PDF → get ATS score, keyword gaps, and improvement suggestions instantly.",
    gradient: "from-orange-900/60 to-pink-900/40",
    accent: "text-orange-400",
    content: "resume-full",
  },
];

function PanelContent({ type }: { type: string }) {
  if (type === "ide") {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="flex gap-1.5 mb-3">
          {["two-sum.py", "binary-search.py"].map((f, i) => (
            <span key={f} className={`px-3 py-1 rounded-t-lg text-xs font-semibold ${i === 0 ? "bg-white/10 text-white" : "text-white/40"}`}>{f}</span>
          ))}
        </div>
        <div className="flex-1 rounded-xl bg-black/40 font-mono text-xs p-3 space-y-1 overflow-hidden">
          {[
            "class Solution:",
            "    def twoSum(self, nums, target):",
            "        seen = {}",
            "        for i, n in enumerate(nums):",
            "            diff = target - n",
            "            if diff in seen:",
            "                return [seen[diff], i]",
            "            seen[n] = i",
          ].map((l, i) => (
            <div key={i} className={`${i === 0 ? "text-purple-400" : i < 2 ? "text-blue-300" : "text-cyan-200/80"}`}>{l}</div>
          ))}
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓ 3/3 tests passed</span>
            <span className="px-2 py-0.5 rounded bg-white/8 text-white/50 text-[10px]">Runtime: 84ms</span>
          </div>
        </div>
      </div>
    );
  }
  if (type === "interview-full") {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-violet-500/30 flex items-center justify-center">
            <Brain className="w-3 h-3 text-violet-300" />
          </div>
          <span className="text-xs font-bold text-violet-300">AI Interviewer</span>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold animate-pulse">● REC</span>
        </div>
        {[
          { ai: true, text: "Explain how you would design a URL shortener at scale." },
          { ai: false, text: "I'd start with a hash function to generate 6-character keys using Base62..." },
          { ai: true, text: "Good. How would you handle hash collisions and what's your estimated QPS?" },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.ai ? "" : "justify-end"}`}>
            <div className={`max-w-[85%] text-xs rounded-xl px-3 py-2 leading-relaxed ${m.ai ? "bg-violet-500/15 text-violet-100 border border-violet-500/20" : "bg-white/8 text-white/80"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-[var(--text)]">resume_john_doe.pdf</span>
        <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">ATS Score: 78/100</span>
      </div>
      {[
        { label: "Keywords Match", score: 78, color: "bg-orange-400" },
        { label: "Formatting", score: 92, color: "bg-emerald-400" },
        { label: "Impact Statements", score: 61, color: "bg-yellow-400" },
        { label: "Action Verbs", score: 85, color: "bg-cyan-400" },
      ].map(({ label, score, color }) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-[var(--muted)] mb-1"><span>{label}</span><span>{score}%</span></div>
          <div className="h-2 rounded-full bg-white/10">
            <motion.div className={`h-full rounded-full ${color}`} style={{ width: 0 }} whileInView={{ width: `${score}%` }} transition={{ duration: 0.8, ease: EASE_OUT }} viewport={{ once: true }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenshotsSection() {
  return (
    <section className="py-28 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text)] mb-4">
            See it in action
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
            Real UI. No marketing demos. What you see is what you get on your machine.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {PANELS.map((p, i) => (
            <motion.div
              key={p.title}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${p.gradient} backdrop-blur-xl overflow-hidden`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Title bar */}
              <div className="flex gap-1.5 px-4 py-3 border-b border-white/8">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <PanelContent type={p.content} />
              <div className="px-4 py-3 border-t border-white/8">
                <div className={`text-sm font-bold ${p.accent} mb-0.5`}>{p.title}</div>
                <p className="text-xs text-[var(--muted)]">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// How It Works
// ─────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    icon: Download,
    title: "Install the App",
    desc: "Download the installer for your OS. Run it — no terminal commands required.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    num: "02",
    icon: Code2,
    title: "Practice Coding",
    desc: "Solve curated problems in the built-in IDE. Get AI hints when you're stuck.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    num: "03",
    icon: Brain,
    title: "Mock Interviews",
    desc: "Run AI-powered interview sessions. Voice or text. Get scored feedback instantly.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Track & Improve",
    desc: "Monitor your progress dashboard daily. Target weak areas. Land that offer.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
];

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="py-28 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/12 text-[var(--muted)] text-xs font-bold mb-4">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Simple 4-step setup
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text)] mb-4">
            How it works
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
            From install to interview-ready in under 10 minutes.
          </p>
        </motion.div>

        {/* Desktop: horizontal with connecting line */}
        <div ref={ref} className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-white/8 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-orange-500 origin-left"
              style={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.3 }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                className={`rounded-2xl border ${s.border} bg-white/[0.04] backdrop-blur-xl p-5 hover:bg-white/[0.07] transition-all`}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.3 + i * 0.12 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <span className={`text-3xl font-black ${s.color} opacity-20`}>{s.num}</span>
                </div>
                <h3 className={`font-bold text-base ${s.color} mb-2`}>{s.title}</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight className={`w-4 h-4 ${s.color} mt-3 lg:hidden`} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Why Choose
// ─────────────────────────────────────────────

const REASONS = [
  {
    icon: Layers,
    title: "All-in-One Platform",
    desc: "IDE, interviews, resume, analytics, and resources — no juggling between apps.",
  },
  {
    icon: WifiOff,
    title: "Truly Offline",
    desc: "AI runs locally via Ollama. Practice during flights, power outages, or restricted networks.",
  },
  {
    icon: Brain,
    title: "AI-Powered Feedback",
    desc: "Detailed, contextual feedback for every interview answer — not generic templates.",
  },
  {
    icon: Target,
    title: "Built for Placements",
    desc: "Topics, problems, and interview patterns aligned to actual campus placement processes.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    desc: "Nothing leaves your machine by default. Your code, resumes, and sessions stay local.",
  },
  {
    icon: Zap,
    title: "Zero Subscriptions",
    desc: "Download once, use forever. No SaaS fees, no rate limits, no credit card required.",
  },
];

function WhyChooseSection() {
  return (
    <section className="py-28 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text)] mb-4">
            Why Placement OS?
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
            Designed around how real placements work — not how generic prep websites think they do.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REASONS.map((r, i) => (
            <motion.div
              key={r.title}
              className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-white/15 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.07 }}
              whileHover={{ y: -3 }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                <r.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text)] text-sm mb-1">{r.title}</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// System Requirements
// ─────────────────────────────────────────────

const REQS = [
  {
    icon: Monitor,
    title: "Operating System",
    items: ["Windows 10/11 (64-bit)", "macOS 12+ (Intel/Apple Silicon)", "Ubuntu 20.04+ / Fedora / Arch"],
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    icon: MemoryStick,
    title: "RAM",
    items: ["8 GB minimum", "16 GB recommended for best AI performance", "32 GB+ for larger models"],
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: HardDrive,
    title: "Disk Space",
    items: ["App: ~200 MB", "Ollama runtime: ~500 MB", "AI model (qwen2.5-coder:7b): ~4.7 GB"],
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Cpu,
    title: "Additional",
    items: ["Ollama (free, open source)", "GPU optional — CPU-only mode works", "Microphone for voice interview mode"],
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

function RequirementsSection() {
  return (
    <section id="requirements" className="py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text)] mb-4">
            System requirements
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
            Local AI means your hardware does the heavy lifting. Here's what you need.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {REQS.map((req, i) => (
            <motion.div
              key={req.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
            >
              <div className={`w-10 h-10 rounded-xl ${req.bg} flex items-center justify-center mb-4`}>
                <req.icon className={`w-5 h-5 ${req.color}`} />
              </div>
              <h3 className={`font-bold text-sm ${req.color} mb-3`}>{req.title}</h3>
              <ul className="space-y-2">
                {req.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[var(--muted)] text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Download
// ─────────────────────────────────────────────

const DL_PLATFORMS = [
  {
    icon: Monitor,
    label: "Windows",
    sub: ".exe installer",
    size: "~82 MB",
    href: "https://github.com/YOUR_ORG/YOUR_REPO/releases/latest",
    primary: true,
    color: "from-sky-500 to-blue-600",
    shadow: "shadow-sky-500/30",
  },
  {
    icon: Terminal,
    label: "Linux",
    sub: ".AppImage",
    size: "~78 MB",
    href: "https://github.com/YOUR_ORG/YOUR_REPO/releases/latest",
    primary: true,
    color: "from-orange-500 to-red-500",
    shadow: "shadow-orange-500/30",
  },
  {
    icon: Apple,
    label: "macOS",
    sub: ".dmg",
    size: "~85 MB",
    href: "https://github.com/YOUR_ORG/YOUR_REPO/releases/latest",
    primary: true,
    color: "from-zinc-400 to-zinc-600",
    shadow: "shadow-zinc-500/20",
  },
];

function DownloadSection() {
  return (
    <section id="download" className="py-28 px-4 relative overflow-hidden">
      {/* glow pulse behind CTA */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(16,185,129,0.12), transparent)",
        }}
        aria-hidden
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-6">
            <Download className="w-3 h-3" />
            Free forever. No signup.
          </span>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight text-[var(--text)] mb-4">
            Ready to get placed?
          </h2>
          <p className="text-[var(--muted)] text-lg mb-3">
            Download Placement OS and start your AI-powered prep today. Completely free.
          </p>
          <p className="text-[var(--muted)] text-sm mb-10">
            Version 1.0.0 &nbsp;·&nbsp;
            <a href="https://github.com/YOUR_ORG/YOUR_REPO/releases" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
              Release notes <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {DL_PLATFORMS.map((p, i) => (
              <motion.a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className={`flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 
                  hover:border-white/25 hover:bg-white/10 transition-all group hover:shadow-xl hover:${p.shadow}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <p.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-extrabold text-[var(--text)] text-base">{p.label}</div>
                  <div className="text-[var(--muted)] text-xs mt-0.5">{p.sub} &nbsp;·&nbsp; {p.size}</div>
                </div>
                <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r ${p.color} text-white text-sm font-bold w-full justify-center`}>
                  <Download className="w-3.5 h-3.5" strokeWidth={3} />
                  Download
                </div>
              </motion.a>
            ))}
          </div>

          <p className="text-xs text-[var(--muted)]">
            Requires <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Ollama</a> for local AI features (free, open source). Setup wizard guides you through everything.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/8 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-extrabold text-[var(--text)] text-sm tracking-tight">
              Placement<span className="text-emerald-400">OS</span>
            </div>
            <div className="text-xs text-[var(--muted)]">Local-first AI placement prep</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-[var(--muted)] font-semibold">
          <a href="https://github.com/YOUR_ORG/YOUR_REPO" target="_blank" rel="noreferrer" className="hover:text-[var(--text)] flex items-center gap-1.5 transition-colors">
            <Github className="w-4 h-4" /> GitHub
          </a>
          <a href="#docs" className="hover:text-[var(--text)] transition-colors">Docs</a>
          <a href="mailto:contact@placementos.app" className="hover:text-[var(--text)] transition-colors">Contact</a>
        </div>

        <div className="text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} Placement OS. MIT License.
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────

export default function GetStartedPage() {
  const { dark, toggle } = useTheme();

  return (
    <>
      {/* CSS custom properties for theming */}
      <style>{`
        :root { color-scheme: dark; }
        [data-theme="dark"] {
          --bg: #050d1a;
          --bg-2: #070f1f;
          --text: #f0f6ff;
          --muted: rgba(240,246,255,0.45);
          --nav-bg-solid: rgba(5,13,26,0.85);
          --mockup-bg: rgba(7,15,31,0.9);
          --card: rgba(255,255,255,0.04);
        }
        [data-theme="light"] {
          --bg: #f0f4f8;
          --bg-2: #e8edf4;
          --text: #0d1117;
          --muted: rgba(13,17,23,0.55);
          --nav-bg-solid: rgba(240,244,248,0.88);
          --mockup-bg: rgba(230,236,244,0.95);
          --card: rgba(255,255,255,0.7);
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        [data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }
      `}</style>

      <Noise />
      <Navbar dark={dark} toggleTheme={toggle} />

      <main className="min-h-screen" style={{ background: "var(--bg)" }}>
        <HeroSection />
        <FeaturesSection />
        <ScreenshotsSection />
        <HowItWorksSection />
        <WhyChooseSection />
        <RequirementsSection />
        <DownloadSection />
      </main>

      <Footer />
    </>
  );
}
