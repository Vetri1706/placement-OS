export {}

// ── system:checkAll return type ──────────────────────────────────────────────

export interface SystemCheckResult {
  ollamaReachable: boolean
  modelInstalled: boolean
  models: string[]
  diskFreeGb: number | null
  diskOk: boolean
  ttsEngine: string | null
  whisperAvailable: boolean
  gpuInfo: string | null
  platform: string
}

export interface PullProgressEvent {
  status: string
  completed?: number | null
  total?: number | null
  digest?: string | null
  done?: boolean
}

declare global {
  interface Window {
    appStore: {
      get: (key: string) => any
      set: (key: string, value: any) => void
      has: (key: string) => boolean
      delete: (key: string) => void
    }

    codeRunner: {
      run: (args: { language: "java" | "c" | "cpp"; code: string; stdin?: string; timeoutMs?: number }) => Promise<{ ok: boolean; stdout: string; stderr: string }>
    }

    stt: {
      whisperCheck: (args: { command?: string }) => Promise<{ ok: boolean; stdout?: string; stderr?: string }>
      whisperTranscribe: (args: {
        audioBase64: string
        mimeType: string
        command?: string
        model?: string
        language?: string
        timeoutMs?: number
      }) => Promise<{ ok: boolean; text: string; stderr?: string }>
    }

    nativeTts: {
      check: () => Promise<{ ok: boolean; engine?: string; stderr?: string }>
      speak: (args: { text: string; rate?: number; pitch?: number }) => Promise<{ ok: boolean; engine?: string; stderr?: string }>
      stop: () => Promise<{ ok: boolean }>
    }

    resume: {
      pickPdf: () => Promise<{ canceled: boolean; filePath?: string | null }>
      extractPdfText: (args: { filePath: string }) => Promise<{ ok: boolean; text?: string; stderr?: string }>
    }

    systemCheck: {
      checkAll: () => Promise<SystemCheckResult>
      startOllama: () => Promise<{ ok: boolean; method?: string; stderr?: string }>
      pullModel: (model: string) => Promise<{ ok: boolean; stderr?: string }>
      onPullProgress: (cb: (data: PullProgressEvent) => void) => void
      offPullProgress: () => void
    }
  }
}
