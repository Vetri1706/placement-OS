const { contextBridge, ipcRenderer } = require("electron")

// In-memory only. Intentionally does NOT persist to disk.
const memoryStore = new Map()

contextBridge.exposeInMainWorld("appStore", {
  get: (key) => memoryStore.get(key),
  set: (key, value) => { memoryStore.set(key, value) },
  has: (key) => memoryStore.has(key),
  delete: (key) => memoryStore.delete(key)
})

contextBridge.exposeInMainWorld("codeRunner", {
  run: ({ language, code, stdin, timeoutMs }) => ipcRenderer.invoke("code:run", { language, code, stdin, timeoutMs })
})

contextBridge.exposeInMainWorld("stt", {
  whisperCheck: ({ command }) => ipcRenderer.invoke("stt:whisperCheck", { command }),
  whisperTranscribe: ({ audioBase64, mimeType, command, model, language, timeoutMs }) =>
    ipcRenderer.invoke("stt:whisper", { audioBase64, mimeType, command, model, language, timeoutMs })
})

contextBridge.exposeInMainWorld("nativeTts", {
  check: () => ipcRenderer.invoke("tts:check"),
  speak: ({ text, rate, pitch }) => ipcRenderer.invoke("tts:speak", { text, rate, pitch }),
  stop: () => ipcRenderer.invoke("tts:stop")
})

contextBridge.exposeInMainWorld("resume", {
  pickPdf: () => ipcRenderer.invoke("resume:pickPdf"),
  extractPdfText: ({ filePath }) => ipcRenderer.invoke("resume:extractPdfText", { filePath })
})

// ── System Health Check ──────────────────────────────────────────────────────
contextBridge.exposeInMainWorld("systemCheck", {
  /** Run all environment checks. Returns a SystemCheckResult. */
  checkAll: () => ipcRenderer.invoke("system:checkAll"),

  /** Attempt to start the Ollama daemon. */
  startOllama: () => ipcRenderer.invoke("system:startOllama"),

  /**
   * Pull an Ollama model. Progress events are streamed via onPullProgress.
   * @param {string} model e.g. "qwen2.5-coder:7b"
   */
  pullModel: (model) => ipcRenderer.invoke("system:pullModel", { model }),

  /** Subscribe to pull progress events. */
  onPullProgress: (cb) => ipcRenderer.on("system:pullProgress", (_e, data) => cb(data)),

  /** Remove all pull progress listeners. */
  offPullProgress: () => ipcRenderer.removeAllListeners("system:pullProgress"),
})