/**
 * StartupOrchestrator.tsx
 *
 * Full-screen startup health-check gate that runs before the main app loads.
 * Shows an animated checklist, auto-fixes where possible, and only opens the
 * app once critical dependencies are satisfied (or the user explicitly skips).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Package,
  Mic,
  HardDrive,
  Volume2,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Play,
  RefreshCw,
  ChevronRight,
  Layers,
  ExternalLink,
  Zap,
  WifiOff,
  Copy,
  Check as CheckMark,
  Terminal,
} from "lucide-react";
import {
  runSystemCheck,
  isCriticalReady,
  formatDiskFree,
  type FullSystemStatus,
} from "@/services/systemCheck";
import type { PullProgressEvent } from "@/types/electron";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CheckState = "pending" | "checking" | "ok" | "warning" | "error" | "fixing";

interface CheckItem {
  id: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  state: CheckState;
  detail?: string;
  /** Terminal command to display with a copy button (used in action/hint areas) */
  actionCmd?: string;
  critical: boolean;
}

interface ActionError {
  text: string;
  /** If set, renders a copyable command box below the error text */
  cmd?: string;
}
interface PullProgress {
  status: string;
  completed: number | null;
  total: number | null;
  pct: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy-to-clipboard helpers
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <button
      onClick={copy}
      title={copied ? "Copied!" : "Copy"}
      className={`shrink-0 p-1 rounded hover:bg-white/10 transition-colors ${className}`}
    >
      {copied
        ? <CheckMark className="w-3 h-3 text-emerald-400" />
        : <Copy className="w-3 h-3 text-white/50" />}
    </button>
  );
}

function CommandBox({ cmd, label }: { cmd: string; label?: string }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-black/40 border border-white/10 px-3 py-1.5">
      <Terminal className="w-3 h-3 text-white/40 shrink-0" />
      {label && <span className="text-xs text-white/40 mr-1">{label}</span>}
      <code className="flex-1 text-xs text-emerald-300 font-mono truncate">{cmd}</code>
      <CopyButton text={cmd} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildChecks(status: FullSystemStatus | null): CheckItem[] {
  const s = status;
  return [
    {
      id: "ollama",
      icon: Brain,
      label: "AI Engine (Ollama)",
      sublabel: s ? (s.ollamaReachable ? "Reachable at localhost:11434" : "Not running") : undefined,
      state: !s ? "pending" : s.ollamaReachable ? "ok" : "error",
      critical: true,
    },
    {
      id: "model",
      icon: Package,
      label: "AI Model",
      sublabel: s
        ? s.modelInstalled
          ? "qwen2.5-coder:7b installed"
          : s.ollamaReachable
          ? "qwen2.5-coder:7b not found"
          : "Ollama must run first"
        : undefined,
      state: !s ? "pending" : s.modelInstalled ? "ok" : "error",
      actionCmd: !s?.modelInstalled && s?.ollamaReachable ? "ollama pull qwen2.5-coder:7b" : undefined,
      critical: true,
    },
    {
      id: "tts",
      icon: Volume2,
      label: "Voice Engine (TTS)",
      sublabel: s
        ? s.ttsEngine
          ? `${s.ttsEngine} detected`
          : "No TTS engine found — voice feedback disabled"
        : undefined,
      state: !s ? "pending" : s.ttsEngine ? "ok" : "warning",
      detail: s && !s.ttsEngine
        ? (s.platform === "linux"
            ? "Optional: sudo apt install -y espeak-ng"
            : "Voice feedback will be disabled")
        : undefined,
      actionCmd: s && !s.ttsEngine && s.platform === "linux"
        ? "sudo apt install -y espeak-ng"
        : undefined,
      critical: false,
    },
    {
      id: "mic",
      icon: Mic,
      label: "Microphone Access",
      sublabel: s
        ? s.micGranted
          ? "Permission granted"
          : "Blocked — voice interview disabled"
        : undefined,
      state: !s ? "pending" : s.micGranted ? "ok" : "warning",
      critical: false,
    },
    {
      id: "disk",
      icon: HardDrive,
      label: "Disk Space",
      sublabel: s ? formatDiskFree(s.diskFreeGb) : undefined,
      state: !s ? "pending" : s.diskOk ? "ok" : "warning",
      detail: s && !s.diskOk ? "Need ≥5 GB for AI model" : undefined,
      critical: false,
    },
    {
      id: "gpu",
      icon: Cpu,
      label: "GPU Acceleration",
      sublabel: s
        ? s.gpuInfo
          ? s.gpuInfo
          : "No GPU — CPU-only mode (slower)"
        : undefined,
      state: !s ? "pending" : s.gpuInfo ? "ok" : "warning",
      critical: false,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// State icon
// ─────────────────────────────────────────────────────────────────────────────

function StateIcon({ state }: { state: CheckState }) {
  if (state === "pending")
    return <div className="w-5 h-5 rounded-full border-2 border-white/20" />;
  if (state === "checking" || state === "fixing")
    return <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />;
  if (state === "ok")
    return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  if (state === "warning")
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  return <XCircle className="w-5 h-5 text-red-400" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pull-progress bar
// ─────────────────────────────────────────────────────────────────────────────

function PullProgressBar({ pull }: { pull: PullProgress }) {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex justify-between text-xs text-white/50">
        <span className="truncate max-w-[70%]">{pull.status}</span>
        <span>{pull.pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          animate={{ width: `${pull.pct}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Check row
// ─────────────────────────────────────────────────────────────────────────────

interface CheckRowProps {
  item: CheckItem;
  index: number;
  onStartOllama: () => void;
  onPullModel: () => void;
  pull: PullProgress | null;
  isStartingOllama: boolean;
  ollamaStartError?: ActionError | null;
  pullError?: ActionError | null;
}

function CheckRow({ item, index, onStartOllama, onPullModel, pull, isStartingOllama, ollamaStartError, pullError }: CheckRowProps) {
  const Icon = item.icon;
  const isPulling = item.id === "model" && pull !== null;

  const bgColor =
    item.state === "ok"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : item.state === "error"
      ? "border-red-500/20 bg-red-500/5"
      : item.state === "warning"
      ? "border-yellow-500/20 bg-yellow-500/5"
      : item.state === "checking" || item.state === "fixing"
      ? "border-sky-500/20 bg-sky-500/5"
      : "border-white/8 bg-white/[0.03]";

  return (
    <motion.div
      className={`rounded-2xl border ${bgColor} p-4 transition-colors duration-300`}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-white/70" style={{ width: 18, height: 18 }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-white/90">{item.label}</span>
            <StateIcon state={item.state} />
          </div>
          {item.sublabel && (
            <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{item.sublabel}</p>
          )}
          {item.detail && (
            <p className="text-xs text-yellow-400/70 mt-0.5">{item.detail}</p>
          )}

          {/* Pull progress */}
          {isPulling && <PullProgressBar pull={pull!} />}

          {/* Action buttons */}
          {item.id === "ollama" && item.state === "error" && !isStartingOllama && (
            <button
              onClick={onStartOllama}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-bold hover:bg-sky-500/25 transition-all"
            >
              <Play className="w-3 h-3" strokeWidth={3} />
              Start Ollama
            </button>
          )}
          {item.id === "ollama" && isStartingOllama && (
            <p className="mt-2 text-xs text-sky-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Starting Ollama…
            </p>
          )}
          {item.id === "ollama" && ollamaStartError && (
            <div className="mt-2">
              <p className="text-xs text-red-400 leading-snug">{ollamaStartError.text}</p>
              {ollamaStartError.cmd && <CommandBox cmd={ollamaStartError.cmd} />}
            </div>
          )}
          {item.id === "model" && item.state === "error" && pull === null && (
            <button
              onClick={onPullModel}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all"
            >
              <Download className="w-3 h-3" strokeWidth={3} />
              Download Model (~4.7 GB)
            </button>
          )}
          {item.id === "model" && pullError && pull === null && (
            <div className="mt-2">
              <p className="text-xs text-red-400 leading-snug">{pullError.text}</p>
              {pullError.cmd && <CommandBox cmd={pullError.cmd} />}
            </div>
          )}
          {item.id === "tts" && item.state === "warning" && item.actionCmd && (
            <div className="mt-2">
              <p className="text-xs text-yellow-400/80 leading-snug mb-1">Install to enable voice:</p>
              <CommandBox cmd={item.actionCmd} />
            </div>
          )}
          {item.id === "mic" && item.state === "warning" && (
            <button
              onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {})}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-bold hover:bg-yellow-500/20 transition-all"
            >
              <Mic className="w-3 h-3" />
              Allow Microphone
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface StartupOrchestratorProps {
  onReady: () => void;
}

export default function StartupOrchestrator({ onReady }: StartupOrchestratorProps) {
  const [phase, setPhase] = useState<"loading" | "checking" | "done">("loading");
  const [status, setStatus] = useState<FullSystemStatus | null>(null);
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [ollamaStartError, setOllamaStartError] = useState<ActionError | null>(null);
  const [pullError, setPullError] = useState<ActionError | null>(null);
  const [pull, setPull] = useState<PullProgress | null>(null);
  const [autoLaunchIn, setAutoLaunchIn] = useState<number | null>(null);
  const autoLaunchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Run checks ─────────────────────────────────────────────────────────────
  const runChecks = useCallback(async () => {
    setPhase("checking");
    setStatus(null);
    const result = await runSystemCheck();
    setStatus(result);
    setPhase("done");

    // If everything critical is OK → auto-launch after 2.5 s
    if (isCriticalReady(result)) {
      setAutoLaunchIn(3);
    }
  }, []);

  useEffect(() => {
    // Brief cosmetic delay so the logo animation plays first
    const t = setTimeout(runChecks, 1200);
    return () => clearTimeout(t);
  }, [runChecks]);

  // ── Auto-launch countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (autoLaunchIn === null) return;
    if (autoLaunchIn <= 0) {
      onReady();
      return;
    }
    autoLaunchRef.current = setInterval(() => {
      setAutoLaunchIn((n) => (n !== null ? n - 1 : null));
    }, 1000);
    return () => {
      if (autoLaunchRef.current) clearInterval(autoLaunchRef.current);
    };
  }, [autoLaunchIn, onReady]);

  // ── Fix: start Ollama ──────────────────────────────────────────────────────
  const handleStartOllama = useCallback(async () => {
    if (!window.systemCheck) {
      setOllamaStartError({
        text: "Running in browser mode — start Ollama manually in a terminal:",
        cmd: "ollama serve",
      });
      return;
    }
    setIsStartingOllama(true);
    setOllamaStartError(null);
    setAutoLaunchIn(null);
    if (autoLaunchRef.current) clearInterval(autoLaunchRef.current);
    try {
      const result = await window.systemCheck.startOllama();
      if (!result.ok) {
        const isNotFound = result.stderr?.includes("ENOENT") || result.stderr?.includes("not found");
        setOllamaStartError({
          text: isNotFound
            ? "Ollama binary not found. Install it from ollama.com, then run:"
            : result.stderr
            ? `Failed: ${result.stderr.slice(0, 100)}`
            : "Auto-start failed. Run manually:",
          cmd: "ollama serve",
        });
      }
    } catch (e) {
      setOllamaStartError({ text: e instanceof Error ? e.message : "Unexpected error.", cmd: "ollama serve" });
    } finally {
      setIsStartingOllama(false);
    }
    await runChecks();
  }, [runChecks]);

  // ── Fix: pull model ───────────────────────────────────────────────────────
  const handlePullModel = useCallback(async () => {
    if (!window.systemCheck) {
      setPullError({
        text: "Running in browser mode — pull the model manually in a terminal:",
        cmd: "ollama pull qwen2.5-coder:7b",
      });
      return;
    }
    setAutoLaunchIn(null);
    setPullError(null);
    if (autoLaunchRef.current) clearInterval(autoLaunchRef.current);

    setPull({ status: "Starting download…", completed: null, total: null, pct: 0 });

    window.systemCheck.onPullProgress((data: PullProgressEvent) => {
      setPull((prev) => {
        const completed = data.completed ?? prev?.completed ?? null;
        const total = data.total ?? prev?.total ?? null;
        const pct =
          completed && total && total > 0
            ? Math.round((completed / total) * 100)
            : prev?.pct ?? 0;
        return { status: data.status ?? prev?.status ?? "", completed, total, pct };
      });
    });

    try {
      const result = await window.systemCheck.pullModel("qwen2.5-coder:7b");
      if (!result.ok) {
        const isNotFound = result.stderr?.includes("ENOENT") || result.stderr?.includes("not found");
        setPullError({
          text: isNotFound
            ? "Ollama binary not found. Ensure Ollama is running first, then:"
            : result.stderr
            ? `Download failed: ${result.stderr.slice(0, 120)}`
            : "Download failed. Ensure Ollama is running, then:",
          cmd: "ollama pull qwen2.5-coder:7b",
        });
      }
    } catch (e) {
      setPullError({ text: e instanceof Error ? e.message : "Unexpected error.", cmd: "ollama pull qwen2.5-coder:7b" });
    }

    window.systemCheck.offPullProgress();
    setPull(null);
    await runChecks();
  }, [runChecks]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const checks = buildChecks(status);
  const criticalReady = status ? isCriticalReady(status) : false;
  const hasErrors = checks.some((c) => c.state === "error" && c.critical);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-auto"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% -10%, rgba(16,185,129,0.08), transparent 60%), #050d1a" }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[
          { top: "-15%", left: "-5%", color: "#10b981", size: "55vw" },
          { top: "55%", right: "-10%", color: "#6366f1", size: "45vw" },
        ].map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: b.top,
              left: "left" in b ? b.left : undefined,
              right: "right" in b ? b.right : undefined,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle, ${b.color}14 0%, transparent 70%)`,
            }}
            animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
            transition={{ duration: 16 + i * 6, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-lg mx-4 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-white/8">
          <motion.div
            className="flex items-center justify-center gap-2.5 mb-4"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Placement <span className="text-emerald-400">OS</span>
            </span>
          </motion.div>

          <motion.h1
            className="text-lg font-bold text-white/90 mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {phase === "loading"
              ? "Preparing your AI environment…"
              : phase === "checking"
              ? "Running health checks…"
              : criticalReady
              ? "All systems ready"
              : "Action required"}
          </motion.h1>

          <motion.p
            className="text-sm text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {phase === "done" && criticalReady
              ? autoLaunchIn !== null
                ? `Launching in ${autoLaunchIn}…`
                : "Ready to launch"
              : "Checking Ollama · AI model · voice · microphone · disk"}
          </motion.p>
        </div>

        {/* Checks list */}
        <div className="px-5 py-5 space-y-2.5 max-h-[55vh] overflow-y-auto">
          <AnimatePresence>
            {phase === "loading" ? (
              <motion.div
                className="flex flex-col items-center justify-center py-10 gap-3"
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <p className="text-sm text-white/40">Initialising…</p>
              </motion.div>
            ) : (
              checks.map((item, i) => (
                <CheckRow
                  key={item.id}
                  item={item}
                  index={i}
                  onStartOllama={handleStartOllama}
                  onPullModel={handlePullModel}
                  pull={item.id === "model" ? pull : null}
                  isStartingOllama={item.id === "ollama" ? isStartingOllama : false}
                  ollamaStartError={item.id === "ollama" ? ollamaStartError : null}
                  pullError={item.id === "model" ? pullError : null}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {phase === "done" && (
          <motion.div
            className="px-5 pb-6 pt-3 border-t border-white/8 space-y-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Summary badge */}
            <div className="flex items-center gap-2 mb-0.5">
              {criticalReady ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Critical checks passed
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  Fix required before launch
                </span>
              )}
              <span className="ml-auto text-[10px] text-white/25 font-semibold">
                {checks.filter((c) => c.state === "warning").length} warnings
              </span>
            </div>

            {/* Primary action */}
            <button
              onClick={() => {
                if (autoLaunchRef.current) clearInterval(autoLaunchRef.current);
                if (criticalReady) {
                  onReady();
                } else {
                  runChecks();
                }
              }}
              disabled={pull !== null || isStartingOllama}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm transition-all
                ${
                  criticalReady
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-white/8 border border-white/12 text-white/70 hover:bg-white/12"
                }
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {pull ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading model…
                </>
              ) : criticalReady ? (
                <>
                  <ChevronRight className="w-4 h-4" strokeWidth={3} />
                  {autoLaunchIn !== null ? `Launch App (${autoLaunchIn})` : "Launch App"}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Re-run Checks
                </>
              )}
            </button>

            {/* Skip link */}
            {!criticalReady && (
              <button
                onClick={onReady}
                className="w-full text-center text-xs text-white/30 hover:text-white/55 transition-colors py-1"
              >
                Skip & launch anyway (app may not function)
              </button>
            )}

            {/* Offline badge */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/20 font-semibold pt-0.5">
              <WifiOff className="w-2.5 h-2.5" />
              AI runs locally · no data sent to servers
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Docs link */}
      <motion.a
        href="https://github.com/YOUR_ORG/YOUR_REPO#setup"
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <ExternalLink className="w-3 h-3" />
        Setup guide
      </motion.a>
    </div>
  );
}
