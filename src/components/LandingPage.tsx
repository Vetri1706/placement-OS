import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Gauge,
  Layers,
  Sparkles,
  UserCircle2,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

type Feature = {
  title: string;
  description: string;
  icon: typeof BarChart3;
};

const features: Feature[] = [
  {
    title: "Dashboard & Analytics",
    description: "Visualize your preparation streaks, strengths, and performance trends in one place.",
    icon: BarChart3,
  },
  {
    title: "Coding IDE",
    description: "Practice coding problems in a focused, interview-like environment with instant AI hints.",
    icon: Code2,
  },
  {
    title: "AI Interview Simulator",
    description: "Run realistic mock interviews with adaptive AI follow-ups tailored to your level.",
    icon: BrainCircuit,
  },
  {
    title: "Resource Library",
    description: "Access curated notes, concepts, and question banks mapped to placement tracks.",
    icon: BookOpen,
  },
  {
    title: "Progress Tracking",
    description: "Track milestones, identify weak areas, and stay accountable with smart goals.",
    icon: Gauge,
  },
  {
    title: "Offline Mode",
    description: "Continue learning and practicing even without internet, anytime and anywhere.",
    icon: WifiOff,
  },
];

const steps = [
  { title: "Choose a learning track", icon: Layers },
  { title: "Practice coding problems", icon: Code2 },
  { title: "Take AI mock interviews", icon: BrainCircuit },
  { title: "Get feedback and track progress", icon: CheckCircle2 },
];

const whyPoints = [
  "All-in-one platform",
  "Works offline",
  "AI-powered feedback",
  "Built for students and placements",
  "No need for multiple tools",
];

const sectionVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const floatingCardVariants = {
  rest: { y: 0, opacity: 0.92 },
  hover: { y: -6, opacity: 1 },
};

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLaunch = () => {
    navigate("/app");
  };

  const handleLearnMore = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[hsl(var(--primary)/0.2)] blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -16, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-24 h-[26rem] w-[26rem] rounded-full bg-[hsl(var(--secondary)/0.24)] blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 md:px-10 md:pt-12">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="mx-auto"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">AI Student Assistant</h1>
            <ThemeToggle />
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(28_90%_54%)] p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                <UserCircle2 className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Placement-Ready Workspace</p>
              <p className="text-xs text-[hsl(var(--accent))]">Available for focused prep</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--card))] p-3 shadow-[0_30px_70px_hsl(var(--glass-shadow))]">
            <div className="rounded-2xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--muted)/0.45)]">
              <div className="flex items-center justify-between border-b border-[hsl(var(--glass-border-subtle))] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  <span className="rounded-md bg-[hsl(var(--glass-bg))] px-3 py-1 text-[10px] text-[hsl(var(--muted-foreground))]">AI Student Assistant</span>
                  <span className="rounded-md bg-[hsl(var(--glass-bg))] px-3 py-1 text-[10px] text-[hsl(var(--muted-foreground))]">Premium Layout</span>
                </div>
              </div>

              <div className="relative grid min-h-[26rem] gap-6 overflow-hidden rounded-b-2xl bg-[linear-gradient(130deg,hsl(var(--background)),hsl(var(--muted)/0.85),hsl(var(--primary)/0.18))] p-6 lg:grid-cols-[1fr_22rem] lg:p-8">
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-[hsl(var(--secondary)/0.4)] blur-3xl"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.48, 0.72, 0.48] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute right-24 top-10 h-64 w-64 rounded-full bg-[hsl(var(--primary)/0.24)] blur-3xl"
                  animate={{ x: [0, -12, 0], y: [0, 14, 0] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] px-3 py-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))] backdrop-blur-xl">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    AI Placement Experience Platform
                  </span>
                  <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-tight text-[hsl(var(--foreground))] md:text-6xl">
                    Your All-in-One
                    <br />
                    AI Placement Preparation Platform
                  </h2>
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))] md:text-base">
                    Practice coding, run realistic AI interviews, track progress, and learn with curated resources in one seamless desktop app.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <motion.button
                      type="button"
                      onClick={handleLaunch}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_14px_36px_hsl(var(--glow-primary)/0.3)]"
                    >
                      Launch App <ArrowRight className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleLearnMore}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] px-5 py-3 text-sm font-medium text-[hsl(var(--foreground))] backdrop-blur-xl"
                    >
                      Learn More
                    </motion.button>
                  </div>
                </div>

                <div className="relative z-10 grid content-start gap-3">
                  {["Upgrade Plan", "Interview Success", "AI Response"].map((label, index) => (
                    <motion.div
                      key={label}
                      initial="rest"
                      whileHover="hover"
                      variants={floatingCardVariants}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] p-3 backdrop-blur-2xl"
                    >
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                      {index === 0 && (
                        <>
                          <p className="mt-2 text-xl font-semibold text-[hsl(var(--foreground))]">Pro</p>
                          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--foreground)/0.12)]">
                            <motion.div className="h-full rounded-full bg-[hsl(var(--accent))]" initial={{ width: 0 }} whileInView={{ width: "78%" }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                          </div>
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <p className="mt-2 text-xl font-semibold text-[hsl(var(--foreground))]">93%</p>
                          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Mock rounds completed with confidence boost</p>
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <p className="mt-2 text-xl font-semibold text-[hsl(var(--foreground))]">110ms</p>
                          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Average AI feedback latency</p>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          className="mt-16"
        >
          <h2 className="text-2xl font-semibold md:text-3xl">Feature Showcase</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Explore the core capabilities designed for smarter placement prep.
          </p>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.button
                  type="button"
                  key={feature.title}
                  onClick={() => void 0}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.985 }}
                  className="group glass relative h-full rounded-2xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] p-4 text-left transition-all"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent opacity-0 transition-opacity group-hover:opacity-100 group-hover:[border-color:hsl(var(--primary)/0.45)]" />
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {feature.description}
                  </p>

                  <div className="mt-4 rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--muted)/0.35)] p-3">
                    <div className="mb-2 h-2 w-20 rounded-full bg-[hsl(var(--primary)/0.35)]" />
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-[hsl(var(--foreground)/0.08)]" />
                      <div className="h-2 w-4/5 rounded-full bg-[hsl(var(--foreground)/0.08)]" />
                      <div className="h-2 w-2/3 rounded-full bg-[hsl(var(--foreground)/0.08)]" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={sectionVariants}
          className="mt-16"
        >
          <h2 className="text-2xl font-semibold md:text-3xl">How It Works</h2>
          <div className="relative mt-7 grid gap-4 md:grid-cols-4">
            <div className="pointer-events-none absolute left-6 right-6 top-8 hidden h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary)/0.4)] to-transparent md:block" />
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="glass relative rounded-2xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--secondary)/0.16)] text-[hsl(var(--secondary))]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">0{index + 1}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{step.title}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={sectionVariants}
          className="mt-16"
        >
          <div className="glass rounded-3xl border border-[hsl(var(--glass-border-subtle))] px-6 py-8 md:px-8">
            <h2 className="text-2xl font-semibold md:text-3xl">Why This App</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {whyPoints.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--muted)/0.35)] px-4 py-3"
                >
                  <p className="text-sm font-medium">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={sectionVariants}
          className="mt-16"
        >
          <div className="glass rounded-3xl border border-[hsl(var(--glass-border-subtle))] bg-gradient-to-br from-[hsl(var(--muted)/0.5)] to-[hsl(var(--glass-bg))] px-6 py-12 text-center md:px-8">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Start preparing smarter today.</h2>
            <motion.button
              type="button"
              onClick={handleLaunch}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-6 py-3.5 text-sm font-medium text-[hsl(var(--secondary-foreground))] shadow-lg shadow-[hsl(var(--secondary)/0.3)] transition-colors hover:bg-[hsl(var(--secondary)/0.9)]"
            >
              Enter Application <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.section>

        <footer className="mt-14 border-t border-[hsl(var(--glass-border-subtle))] py-6 text-center">
          <p className="text-sm font-medium">AI Student Assistant</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            A modern desktop companion for focused placement preparation.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default LandingPage;
