const OLLAMA_BASE = "http://localhost:11434";
const MODEL = "qwen2.5-coder:7b";

/* ─── health ─────────────────────────────────────────────── */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.models) && data.models.some((m: { name: string }) => m.name.startsWith("qwen2.5-coder"));
  } catch {
    return false;
  }
}

/* ─── non-streaming generate ─────────────────────────────── */
export async function ollamaGenerate(prompt: string, systemPrompt?: string, maxTokens = 1024): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
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
  const body: Record<string, unknown> = {
    model: MODEL,
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
  const stream = !!onToken;
  const body = {
    model: MODEL,
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