import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Code2,
  LayoutDashboard,
  Library,
  Map,
  Settings,
  UserCircle2,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { loadLastView, type LastView } from "@/lib/viewPersist";
import { useAppStore, type View } from "@/store/useAppStore";

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const VIEW_LABEL: Record<View, string> = {
  dashboard: "Dashboard",
  ide: "Coding IDE",
  problems: "Problems",
  interview: "AI Interview",
  library: "Resources",
  resume: "Resume",
  roadmap: "Roadmap",
  settings: "Settings",
};

const LandingPage = () => {
  const navigate = useNavigate();
  const userName = useAppStore((s) => s.userName);
  const setView = useAppStore((s) => s.setView);

  const last = useMemo<LastView>(() => loadLastView(), []);
  const lastView = (last?.view && VIEW_LABEL[last.view]) ? last.view : null;

  const openApp = (view?: View) => {
    if (view) {
      setView(view);
    }

    navigate("/app");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[hsl(var(--primary)/0.18)] blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -16, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-24 h-[26rem] w-[26rem] rounded-full bg-[hsl(var(--secondary)/0.18)] blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 md:px-10 md:pt-12">
        <motion.section initial="hidden" animate="visible" variants={sectionVariants}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">AI Student Assistant</h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Start where you left off, or jump into a module.</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="mb-8 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(28_90%_54%)] p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                <UserCircle2 className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Welcome{userName ? `, ${userName}` : ""}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Offline-first workspace</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--card))] p-6 shadow-[0_30px_70px_hsl(var(--glass-shadow))]">
              <h2 className="text-lg font-semibold">Continue</h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {lastView ? `Resume from ${VIEW_LABEL[lastView]}.` : "Open the app and pick a module."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  onClick={() => openApp(lastView ?? undefined)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-[0_14px_36px_hsl(var(--glow-primary)/0.3)]"
                >
                  {lastView ? `Continue (${VIEW_LABEL[lastView]})` : "Open App"} <ArrowRight className="h-4 w-4" />
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => openApp("dashboard")}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] px-5 py-3 text-sm font-medium text-[hsl(var(--foreground))] backdrop-blur-xl"
                >
                  Go to Dashboard
                </motion.button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => openApp("interview")}
                  className="group rounded-2xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--muted)/0.45)] p-4 text-left transition-colors hover:bg-[hsl(var(--muted)/0.6)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--glass-bg))]">
                      <BrainCircuit className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Start Mock Interview</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Voice + AI follow-ups</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openApp("ide")}
                  className="group rounded-2xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--muted)/0.45)] p-4 text-left transition-colors hover:bg-[hsl(var(--muted)/0.6)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--glass-bg))]">
                      <Code2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Practice Coding</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Monaco editor + runner</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openApp("problems")}
                  className="group rounded-2xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--muted)/0.45)] p-4 text-left transition-colors hover:bg-[hsl(var(--muted)/0.6)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--glass-bg))]">
                      <Library className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Solve Problems</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Track attempts and XP</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openApp("library")}
                  className="group rounded-2xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--muted)/0.45)] p-4 text-left transition-colors hover:bg-[hsl(var(--muted)/0.6)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--glass-bg))]">
                      <BookOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Browse Resources</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Curated + AI explain</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--card))] p-6 shadow-[0_30px_70px_hsl(var(--glass-shadow))]">
              <h2 className="text-lg font-semibold">Quick Navigation</h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Jump directly into a view.</p>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => openApp("dashboard")}
                  className="flex items-center justify-between rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] px-4 py-3 text-left text-sm text-[hsl(var(--foreground))]"
                >
                  <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</span>
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </button>
                <button
                  type="button"
                  onClick={() => openApp("resume")}
                  className="flex items-center justify-between rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] px-4 py-3 text-left text-sm text-[hsl(var(--foreground))]"
                >
                  <span className="inline-flex items-center gap-2"><UserCircle2 className="h-4 w-4" /> Resume</span>
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </button>
                <button
                  type="button"
                  onClick={() => openApp("roadmap")}
                  className="flex items-center justify-between rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] px-4 py-3 text-left text-sm text-[hsl(var(--foreground))]"
                >
                  <span className="inline-flex items-center gap-2"><Map className="h-4 w-4" /> Roadmap</span>
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </button>
                <button
                  type="button"
                  onClick={() => openApp("settings")}
                  className="flex items-center justify-between rounded-xl border border-[hsl(var(--glass-border-subtle))] bg-[hsl(var(--glass-bg))] px-4 py-3 text-left text-sm text-[hsl(var(--foreground))]"
                >
                  <span className="inline-flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</span>
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default LandingPage;

