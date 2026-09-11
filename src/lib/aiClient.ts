const OLLAMA_BASE = "http://localhost:11434";
export const FALLBACK_MODEL = "qwen2.5-coder:7b";

export type OllamaTags = {
  models: Array<{ name: string }>
};

export async function getOllamaTags(): Promise<OllamaTags> {
  const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama tags failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as Partial<OllamaTags>;
  return { models: Array.isArray(data.models) ? data.models : [] };
}

function selectBestAvailableModel(models: string[]): string {
  if (!models.length) return FALLBACK_MODEL;
  if (models.includes(FALLBACK_MODEL)) return FALLBACK_MODEL;
  const qwenCoder = models.find((name) => name.startsWith("qwen2.5-coder"));
  if (qwenCoder) return qwenCoder;
  const qwen = models.find((name) => name.startsWith("qwen"));
  if (qwen) return qwen;
  return models[0];
}

export async function getPreferredModel(): Promise<string> {
  const storedModel = window.appStore?.get("ollama:model");
  if (typeof storedModel === "string" && storedModel.trim().length > 0) return storedModel;

  try {
    const tags = await getOllamaTags();
    const availableModels = tags.models
      .map((model) => model.name)
      .filter((name): name is string => typeof name === "string" && name.trim().length > 0);
    return selectBestAvailableModel(availableModels);
  } catch {
    return FALLBACK_MODEL;
  }
}

export function setPreferredModel(modelName: string) {
  window.appStore?.set("ollama:model", modelName);
}

/* ─── health ─────────────────────────────────────────────── */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const data = await getOllamaTags();
    return Array.isArray(data.models) && data.models.some((m) => m.name === FALLBACK_MODEL || m.name.startsWith("qwen2.5-coder"));
  } catch {
    return false;
  }
}

/* ─── non-streaming generate ─────────────────────────────── */
export async function ollamaGenerate(prompt: string, systemPrompt?: string, maxTokens = 1024): Promise<string> {
  const model = await getPreferredModel();
  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: false,
    options: { temperature: 0.2, num_predict: maxTokens, num_ctx: 2048 },
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.response ?? "";
}

/* ─── streaming generate ─────────────────────────────────── */
export async function ollamaStream(
  prompt: string,
  onToken: (token: string) => void,
  options?: { system?: string; signal?: AbortSignal; maxTokens?: number },
): Promise<string> {
  const model = await getPreferredModel();
  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: true,
    options: { temperature: 0.2, num_predict: options?.maxTokens ?? 1024, num_ctx: 2048 },
  };
  if (options?.system) body.system = options.system;

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama stream failed (${res.status}): ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No readable stream from Ollama");

  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n").filter(Boolean)) {
      try {
        const json = JSON.parse(line);
        if (json.response) {
          full += json.response;
          onToken(json.response);
        }
      } catch {
        /* partial JSON line – skip */
      }
    }
  }

  return full;
}

/* ─── chat (multi-turn) ──────────────────────────────────── */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(messages: ChatMessage[], onToken?: (token: string) => void): Promise<string> {
  const model = await getPreferredModel();
  const stream = !!onToken;
  const body = {
    model,
    messages,
    stream,
    options: { temperature: 0.4, num_predict: 512, num_ctx: 2048 },
  };

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama chat failed (${res.status}): ${text}`);
  }

  if (!stream) {
    const data = await res.json();
    return data.message?.content ?? "";
  }

  // streaming path
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No readable stream");

  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n").filter(Boolean)) {
      try {
        const json = JSON.parse(line);
        const token = json.message?.content ?? "";
        if (token) {
          full += token;
          onToken!(token);
        }
      } catch {
        /* skip */
      }
    }
  }

  return full;
}