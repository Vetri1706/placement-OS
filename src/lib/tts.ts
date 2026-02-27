function formatSpeakError(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

// Helps with Chromium autoplay policies: call this from a user gesture
// (e.g. clicking Start Interview / toggling Voice).
export async function unlockAudioPlayback(): Promise<void> {
  try {
    const AudioContextCtor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (AudioContextCtor) {
      const ctx = new AudioContextCtor();
      if (ctx.state === "suspended") await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
      setTimeout(() => {
        try {
          ctx.close();
        } catch {
          /* ignore */
        }
      }, 50);
    }
  } catch {
    // ignore
  }
}

export type SpeakArgs = {
  text: string;
  rate?: number;
  pitch?: number;
  lang?: string;
};

export function sanitizeForSpeech(input: string): string {
  let text = String(input ?? "");

  // Remove code fences and inline code.
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]+)`/g, "$1");

  // Replace markdown links: [title](url) -> title
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Remove common markdown emphasis / bullets.
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1");

  // Strip heading markers and list prefixes.
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s*[-*•]+\s+/gm, "");
  text = text.replace(/^\s*\d+\)\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");

  // Remove leftover formatting chars that get read literally.
  text = text.replace(/[\*#_~^=<>|]/g, " ");

  // Collapse whitespace.
  text = text.replace(/\s+/g, " ").trim();

  // Keep spoken output reasonably short to avoid rambling.
  if (text.length > 700) {
    text = text.slice(0, 700).trim() + "…";
  }

  return text;
}

function canUseNativeTts() {
  return typeof window !== "undefined" && typeof (window as any)?.nativeTts?.speak === "function";
}

async function speakNativeTts(args: SpeakArgs): Promise<{ stop: () => void }> {
  if (!canUseNativeTts()) throw new Error("Native TTS bridge is unavailable.");
  const res = await (window as any).nativeTts.speak({
    text: sanitizeForSpeech(args.text),
    rate: args.rate,
    pitch: args.pitch,
  });
  if (!res?.ok) {
    throw new Error(res?.stderr || "Native TTS failed.");
  }

  return {
    stop: () => {
      try {
        (window as any).nativeTts?.stop?.();
      } catch {
        /* ignore */
      }
    },
  };
}

export function canUseSystemTts() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

async function waitForVoices(timeoutMs = 800): Promise<SpeechSynthesisVoice[]> {
  try {
    const initial = window.speechSynthesis.getVoices();
    if (initial && initial.length > 0) return initial;

    return await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try {
          window.speechSynthesis.removeEventListener?.("voiceschanged", onVoicesChanged);
        } catch {
          /* ignore */
        }
        resolve(window.speechSynthesis.getVoices() || []);
      };

      const onVoicesChanged = () => finish();

      try {
        window.speechSynthesis.addEventListener?.("voiceschanged", onVoicesChanged);
      } catch {
        /* ignore */
      }

      setTimeout(finish, timeoutMs);
    });
  } catch {
    return [];
  }
}

export async function speakSystemTts(args: SpeakArgs): Promise<{ stop: () => void }> {
  const { text, rate = 1.05, pitch = 1, lang = "en-US" } = args;
  if (!canUseSystemTts()) throw new Error("System TTS is unavailable in this environment.");

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sanitizeForSpeech(text));
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = lang;

    // Voices can load async in Chromium/Electron.
    const voices = await waitForVoices();
    const preferOrder = ["Google", "Natural", "Microsoft", "Pico", "RHVoice", "Festival", "Flite"];
    const englishVoices = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en"));
    const preferred = preferOrder
      .map((key) => englishVoices.find((v) => (v.name || "").includes(key)))
      .find(Boolean);
    if (preferred) utterance.voice = preferred;

    let didStart = false;
    utterance.onstart = () => {
      didStart = true;
    };
    utterance.onerror = () => {
      // Some platforms fail silently; we still rely on the watchdog below.
    };

    window.speechSynthesis.speak(utterance);

    // Watchdog: if speech doesn't begin shortly, treat it as a failure.
    await new Promise((r) => setTimeout(r, 500));
    const synth = window.speechSynthesis;
    const isActive = !!(synth.speaking || synth.pending || didStart);
    if (!isActive) {
      throw new Error(
        "Speech synthesis did not start. On Linux you may need speech-dispatcher (spd-say) and/or to enable speech synthesis in Electron.",
      );
    }

    return {
      stop: () => {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
      },
    };
  } catch (e) {
    throw new Error(`System TTS failed (${formatSpeakError(e)})`);
  }
}

// Best-effort: prefer browser/system speechSynthesis, fall back to an OS command
// (spd-say/espeak) via Electron if speechSynthesis is unavailable/silent.
export async function speakTts(args: SpeakArgs): Promise<{ stop: () => void; engine: "system" | "native" }> {
  const ua = typeof navigator !== "undefined" ? String(navigator.userAgent || "") : "";
  const platform = typeof navigator !== "undefined" ? String(navigator.platform || "") : "";
  const isElectron = /electron/i.test(ua);
  const isLinux = /linux/i.test(platform) || /linux/i.test(ua);

  // In Electron/Linux, browser speechSynthesis frequently has empty/broken voice backends.
  // Try system voices first (when they actually work), then fall back to native.
  if (isElectron && isLinux) {
    try {
      const res = await speakSystemTts(args);
      return { ...res, engine: "system" };
    } catch {
      const res = await speakNativeTts(args);
      return { ...res, engine: "native" };
    }
  }

  try {
    const res = await speakSystemTts(args);
    return { ...res, engine: "system" };
  } catch {
    const res = await speakNativeTts(args);
    return { ...res, engine: "native" };
  }
}
