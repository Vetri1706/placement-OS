import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ExternalLink, Mic, HardDrive, Brain } from "lucide-react";
import GlassCard from "./GlassCard";
import { checkOllamaHealth, getOllamaTags, REQUIRED_MODEL } from "@/lib/aiClient";
import { useAppStore } from "@/store/useAppStore";

type MicStatus =
  | { state: "unknown" }
  | { state: "ok" }
  | { state: "blocked"; reason?: string }
  | { state: "error"; reason?: string };

type StorageStatus =
  | { state: "unknown" }
  | { state: "ok"; quotaBytes?: number; usageBytes?: number }
  | { state: "error"; reason?: string };

function bytesToGiB(n?: number) {
  if (!n || !Number.isFinite(n)) return "—";
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function StatusRow({ label, ok, details }: { label: string; ok: boolean | null; details?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 glass rounded-lg px-3 py-2">
      <div className="min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        {details ? <div className="text-xs text-muted-foreground mt-0.5 break-words">{details}</div> : null}
      </div>
      <div className="flex-shrink-0 mt-0.5">
        {ok === null ? (
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
        ) : ok ? (
          <CheckCircle2 className="w-4 h-4 text-accent" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" />
        )}
      </div>
    </div>
  );
}

export default function SetupCheckerView() {
  const setView = useAppStore((s) => s.setView);

  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [mic, setMic] = useState<MicStatus>({ state: "unknown" });
  const [storage, setStorage] = useState<StorageStatus>({ state: "unknown" });

  const hasRequiredModel = useMemo(() => ollamaModels.some((m) => m === REQUIRED_MODEL || m.startsWith("qwen2.5-coder")), [ollamaModels]);

  const runChecks = useCallback(async () => {
    setChecking(true);
    try {
      const ok = await checkOllamaHealth();
      setOllamaOk(ok);

      const tags = await getOllamaTags();
      setOllamaModels(tags.models.map((m) => m.name));

      try {
        const estimate = await navigator.storage?.estimate?.();
        if (!estimate) {
          setStorage({ state: "unknown" });
        } else {
          setStorage({ state: "ok", quotaBytes: estimate.quota, usageBytes: estimate.usage });
        }
      } catch (e) {
        setStorage({ state: "error", reason: e instanceof Error ? e.message : "Storage estimate failed" });
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const checkMic = useCallback(async () => {
    setMic({ state: "unknown" });

    try {
      const perm = await (navigator.permissions?.query?.({ name: "microphone" as PermissionName }) as Promise<PermissionStatus> | undefined);
      if (perm?.state === "denied") {
        setMic({ state: "blocked", reason: "Microphone permission denied" });
        return;
      }
    } catch {
      // ignore permissions API failures
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMic({ state: "ok" });
    } catch (e) {
      setMic({ state: "blocked", reason: e instanceof Error ? e.message : "Microphone access failed" });
    }
  }, []);

  const requirementsText = "Minimum: 8 GB RAM (16 GB recommended), modern CPU, 6–8 GB free disk. Internet required only for first setup.";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Setup Checker</h2>
          <p className="text-sm text-muted-foreground">Detect missing runtime/model/mic/storage before you start.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => runChecks()}
            className="glass px-3 py-2 rounded-lg text-sm flex items-center gap-2"
            aria-label="Re-check setup"
            disabled={checking}
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} /> Re-check
          </button>
          <button
            onClick={() => {
              try {
                window.appStore?.set?.("placementOs:setupDismissed", true);
              } catch {
                /* ignore */
              }
              setView("dashboard");
            }}
            className="glass px-3 py-2 rounded-lg text-sm"
          >
            Skip
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3" delay={0.02} hover={false}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" /> Local AI runtime
          </h3>

          <StatusRow
            label="Ollama running"
            ok={ollamaOk}
            details={
              ollamaOk
                ? `Ollama is reachable. Required model: ${REQUIRED_MODEL}.`
                : "Ollama not detected on http://localhost:11434 (install + start the service)."
            }
          />

          <StatusRow
            label="Required model available"
            ok={ollamaOk ? hasRequiredModel : null}
            details={hasRequiredModel ? `Found ${REQUIRED_MODEL}.` : `Run: ollama pull ${REQUIRED_MODEL}`}
          />

          <div className="glass rounded-lg px-3 py-2 text-xs text-muted-foreground leading-relaxed">
            <div className="font-semibold text-foreground mb-1">Quick commands</div>
            <div className="space-y-1">
              <div><code>ollama --version</code></div>
              <div><code>ollama pull {REQUIRED_MODEL}</code></div>
              <div><code>ollama serve</code></div>
            </div>
          </div>

          <a
            className="glass rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2 w-fit"
            href="https://ollama.com"
            target="_blank"
            rel="noreferrer"
          >
            Get Ollama <ExternalLink className="w-4 h-4" />
          </a>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3" delay={0.05} hover={false}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" /> Audio + storage
          </h3>

          <StatusRow
            label="Microphone access"
            ok={mic.state === "unknown" ? null : mic.state === "ok"}
            details={
              mic.state === "unknown"
                ? "Click ‘Check microphone’ to verify permissions."
                : mic.state === "ok"
                  ? "Microphone OK"
                  : mic.reason ?? "Microphone blocked"
            }
          />

          <button
            onClick={checkMic}
            className="glass px-3 py-2 rounded-lg text-sm flex items-center gap-2 w-fit"
            aria-label="Check microphone"
          >
            <Mic className="w-4 h-4" /> Check microphone
          </button>

          <StatusRow
            label="Storage available"
            ok={storage.state === "unknown" ? null : storage.state === "ok"}
            details={
              storage.state === "ok"
                ? `Quota: ${bytesToGiB(storage.quotaBytes)} • Used: ${bytesToGiB(storage.usageBytes)}`
                : storage.state === "error"
                  ? storage.reason
                  : "Storage estimate not available"
            }
          />

          <div className="glass rounded-lg px-3 py-2 text-xs text-muted-foreground leading-relaxed">
            <div className="font-semibold text-foreground mb-1">Minimum requirements</div>
            <div>{requirementsText}</div>
          </div>

          <div className="glass rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
            <HardDrive className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-foreground">Pro tip</div>
              <div>Low RAM can cause slow responses or failures. 16 GB+ is best for local AI.</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
