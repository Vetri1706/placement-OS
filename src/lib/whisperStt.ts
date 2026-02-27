export type WhisperConfig = {
  command?: string;
  model?: string;
  language?: string;
  timeoutMs?: number;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export type RecordingHandle = {
  stop: () => Promise<{ audioBase64: string; mimeType: string }>;
};

export async function startMicRecording(): Promise<RecordingHandle> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone is not available in this environment.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  const mimeType = candidates.find((t) => {
    try {
      return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });

  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onerror = () => {
          reject(new Error("Recording failed."));
        };

        recorder.onstop = async () => {
          try {
            for (const track of stream.getTracks()) track.stop();
          } catch {
            // ignore
          }

          try {
            const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
            const buffer = await blob.arrayBuffer();
            resolve({
              audioBase64: arrayBufferToBase64(buffer),
              mimeType: blob.type || recorder.mimeType || "audio/webm",
            });
          } catch (e) {
            reject(e);
          }
        };

        try {
          recorder.stop();
        } catch (e) {
          reject(e);
        }
      }),
  };
}

export async function whisperCheck(command?: string) {
  if (!window.stt?.whisperCheck) return { ok: false, stderr: "Whisper bridge is unavailable." };
  return await window.stt.whisperCheck({ command });
}

export async function whisperTranscribe(
  audio: { audioBase64: string; mimeType: string },
  cfg: WhisperConfig,
): Promise<string> {
  if (!window.stt?.whisperTranscribe) throw new Error("Whisper bridge is unavailable.");

  const res = await window.stt.whisperTranscribe({
    audioBase64: audio.audioBase64,
    mimeType: audio.mimeType,
    command: cfg.command,
    model: cfg.model,
    language: cfg.language,
    timeoutMs: cfg.timeoutMs,
  });

  if (!res.ok) {
    throw new Error(res.stderr || "Whisper transcription failed.");
  }

  return (res.text || "").trim();
}
