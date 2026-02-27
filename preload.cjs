const { contextBridge, ipcRenderer } = require("electron")
const ElectronStore = require("electron-store")
const Store = ElectronStore.default ?? ElectronStore

const store = new Store()

contextBridge.exposeInMainWorld("appStore", {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  has: (key) => store.has(key),
  delete: (key) => store.delete(key)
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