/**
 * systemCheck.ts
 * Renderer-side service that aggregates all environment checks.
 * The IPC-heavy checks run in the main process; mic access is checked here
 * because it requires the browser Permissions API.
 */

import type { SystemCheckResult } from "@/types/electron";

export interface FullSystemStatus extends SystemCheckResult {
  micGranted: boolean;
}

/**
 * Runs every check and returns a FullSystemStatus.
 * Never throws — failures are encoded in the result object.
 */
export async function runSystemCheck(): Promise<FullSystemStatus> {
  // ── IPC checks (Ollama, disk, TTS, GPU …) ─────────────────────────────────
  let ipcResult: SystemCheckResult = {
    ollamaReachable: false,
    modelInstalled: false,
    models: [],
    diskFreeGb: null,
    diskOk: true,
    ttsEngine: null,
    whisperAvailable: false,
    gpuInfo: null,
    platform: "unknown",
  };

  if (typeof window !== "undefined" && window.systemCheck) {
    try {
      ipcResult = await window.systemCheck.checkAll();
    } catch {
      // main process unreachable (browser dev mode etc.)
    }
  }

  // ── Microphone (renderer only) ────────────────────────────────────────────
  let micGranted = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    micGranted = true;
  } catch {
    micGranted = false;
  }

  return { ...ipcResult, micGranted };
}

/**
 * True when the two blocking dependencies are satisfied.
 */
export function isCriticalReady(status: FullSystemStatus): boolean {
  return status.ollamaReachable && status.modelInstalled;
}

/**
 * Returns a human-readable disk space label.
 */
export function formatDiskFree(gb: number | null): string {
  if (gb === null) return "Unknown";
  return `${gb.toFixed(1)} GB free`;
}
