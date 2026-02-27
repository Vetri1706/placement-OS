export type ElevenLabsSpeakArgs = {
  apiKey: string;
  voiceId: string;
  text: string;
  signal?: AbortSignal;
};

export type ElevenLabsVoiceSummary = {
  voiceId: string;
  name: string;
  category?: string;
};

function formatAudioPlayError(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

// Helps with Chromium autoplay policies: call this from a user gesture
// (e.g. clicking Start Interview / toggling Voice).
export async function unlockAudioPlayback(): Promise<void> {
  // Resume AudioContext if available (often required on Chrome).
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
        try { ctx.close(); } catch { /* ignore */ }
      }, 50);
    }
  } catch {
    // ignore
  }
}

export async function elevenLabsSpeakMp3(args: ElevenLabsSpeakArgs): Promise<Blob> {
  const { apiKey, voiceId, text, signal } = args;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.85,
      },
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let friendly = "";

    try {
      const parsed = JSON.parse(errText);
      const detail = parsed?.detail;
      const code = detail?.code ? String(detail.code) : "";
      const message = detail?.message ? String(detail.message) : "";

      if (res.status === 402 || code === "paid_plan_required" || code === "payment_required") {
        friendly =
          "This ElevenLabs voice requires a paid plan for API usage. " +
          "Pick a premade voice or a voice you created under your account (My Voices), or upgrade your ElevenLabs plan.";
      } else if (message) {
        friendly = message;
      }
    } catch {
      // ignore
    }

    throw new Error(
      `ElevenLabs TTS failed (${res.status}): ${friendly || errText || res.statusText}`,
    );
  }

  const buffer = await res.arrayBuffer();
  return new Blob([buffer], { type: "audio/mpeg" });
}

export async function listElevenLabsVoices(apiKey: string, signal?: AbortSignal): Promise<ElevenLabsVoiceSummary[]> {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "xi-api-key": apiKey,
    },
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let friendly = "";
    try {
      const parsed = JSON.parse(errText);
      const detail = parsed?.detail;
      const status = detail?.status ? String(detail.status) : "";
      const message = detail?.message ? String(detail.message) : "";

      if (res.status === 401 && status === "missing_permissions" && message.includes("voices_read")) {
        friendly = "Your ElevenLabs API key is missing the permission voices_read. Enable voices_read for this key in ElevenLabs dashboard, then try again.";
      } else if (message) {
        friendly = message;
      }
    } catch {
      // ignore
    }

    throw new Error(`Failed to load ElevenLabs voices (${res.status}): ${friendly || errText || res.statusText}`);
  }

  const data = await res.json().catch(() => ({}));
  const voices = Array.isArray(data?.voices) ? data.voices : [];

  return voices
    .map((v: any) => ({
      voiceId: String(v?.voice_id ?? ""),
      name: String(v?.name ?? ""),
      category: v?.category ? String(v.category) : undefined,
    }))
    .filter((v: ElevenLabsVoiceSummary) => v.voiceId && v.name);
}

export async function playElevenLabsTts(args: ElevenLabsSpeakArgs): Promise<{ audio: HTMLAudioElement; stop: () => void } > {
  const blob = await elevenLabsSpeakMp3(args);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = 1;
  audio.muted = false;

  const stop = () => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  audio.addEventListener(
    "error",
    () => {
      // HTMLMediaElement.error is not consistently typed across TS libs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaErr = (audio as any).error;
      console.error("[ElevenLabsTTS] audio element error", mediaErr);
    },
    { once: true },
  );

  audio.addEventListener(
    "ended",
    () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    },
    { once: true },
  );

  try {
    const playPromise = audio.play();
    if (playPromise) await playPromise;
  } catch (e) {
    const msg = formatAudioPlayError(e);
    // Leave URL for a bit for debugging; revoke soon.
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }, 10_000);
    throw new Error(`Audio playback failed (${msg}). If you see NotAllowedError, click a button in the app to unlock audio.`);
  }
  return { audio, stop };
}
