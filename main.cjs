const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const path = require("path")
const fs = require("fs")
const os = require("os")
const { spawn } = require("child_process")
const ElectronStore = require("electron-store")
const Store = ElectronStore.default ?? ElectronStore

Store.initRenderer()

// On Linux, Chromium speech synthesis (speechSynthesis) is commonly gated behind
// speech-dispatcher. This switch helps enable it when available.
try {
  if (process.platform === "linux") {
    app.commandLine.appendSwitch("enable-speech-dispatcher")
  }
} catch {
  // ignore
}

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "placement-os-run-"))
}

function writeFile(dir, name, content) {
  const full = path.join(dir, name)
  fs.writeFileSync(full, content, "utf8")
  return full
}

function runCommand(cmd, args, options) {
  const timeoutMs = options?.timeoutMs ?? 4000
  const cwd = options?.cwd
  const input = options?.stdin ?? ""
  const env = options?.env ? { ...process.env, ...options.env } : process.env

  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: "pipe", env })

    let stdout = ""
    let stderr = ""
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      try { child.kill("SIGKILL") } catch {}
    }, timeoutMs)

    child.stdout.on("data", (d) => { stdout += d.toString() })
    child.stderr.on("data", (d) => { stderr += d.toString() })

    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({ ok: false, code: -1, stdout, stderr: `${stderr}${stderr ? "\n" : ""}${String(err)}`, timedOut: false, errorCode: err?.code })
    })

    child.on("close", (code) => {
      clearTimeout(timer)
      if (timedOut) {
        resolve({ ok: false, code: code ?? -1, stdout, stderr: `${stderr}${stderr ? "\n" : ""}Timed out after ${timeoutMs}ms`, timedOut: true })
        return
      }
      resolve({ ok: code === 0, code: code ?? 0, stdout, stderr, timedOut: false, errorCode: null })
    })

    try {
      if (input) child.stdin.write(input)
      child.stdin.end()
    } catch {
      // ignore
    }
  })
}

function safeReadTextFile(p) {
  try {
    return fs.readFileSync(p, "utf8")
  } catch {
    return null
  }
}

async function pickPythonCommand() {
  if (await commandExists("python3")) return "python3"
  if (await commandExists("python")) return "python"
  return null
}

function stageScriptToTemp(relativeScriptPath) {
  const appPath = app.getAppPath()
  const srcPath = path.join(appPath, relativeScriptPath)
  const content = safeReadTextFile(srcPath)
  if (!content) return { ok: false, stderr: `Could not find script at ${srcPath}` }
  const dir = mkTempDir()
  const staged = writeFile(dir, path.basename(relativeScriptPath), content)
  return { ok: true, stagedPath: staged }
}

async function extractPdfTextWithPython(pdfPath) {
  const py = await pickPythonCommand()
  if (!py) return { ok: false, stderr: "Python was not found (need python3)." }

  const staged = stageScriptToTemp(path.join("scripts", "extract_pdf_text.py"))
  if (!staged.ok) return { ok: false, stderr: staged.stderr }

  const res = await runCommand(
    py,
    [staged.stagedPath, pdfPath],
    {
      timeoutMs: 20000,
      env: {
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    },
  )

  if (!res.ok) {
    return { ok: false, stderr: (res.stderr || "Extraction failed").trim() }
  }

  const text = String(res.stdout || "").replace(/\u0000/g, "").trim()
  if (!text) {
    return { ok: false, stderr: "No text extracted (PDF may be scanned/image-only)." }
  }

  const capped = text.length > 250_000 ? text.slice(0, 250_000) : text
  return { ok: true, text: capped }
}

async function commandExists(cmd) {
  const res = await runCommand("which", [cmd], { timeoutMs: 800 })
  return !!res.ok && !!String(res.stdout || "").trim()
}

function spawnDetached(cmd, args) {
  return new Promise((resolve) => {
    let settled = false
    try {
      const child = spawn(cmd, args, { detached: true, stdio: "ignore" })

      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        resolve({ ok: true })
      }, 150)

      child.on("error", (err) => {
        clearTimeout(timer)
        if (settled) return
        settled = true
        resolve({ ok: false, stderr: String(err), errorCode: err?.code })
      })

      try {
        child.unref()
      } catch {
        // ignore
      }
    } catch (e) {
      resolve({ ok: false, stderr: e instanceof Error ? e.message : String(e) })
    }
  })
}

async function pickNativeTtsEngine() {
  if (process.platform === "darwin") {
    const res = await runCommand("say", ["-v", "?"], { timeoutMs: 1500 })
    return res.ok ? { engine: "say" } : { engine: null }
  }

  if (process.platform === "win32") {
    // We don't auto-enable a Windows implementation here; keep it explicit.
    return { engine: null }
  }

  // linux
  // Prefer Piper neural TTS when available (much less robotic than espeak).
  const piper = await pickPiperEngineConfig()
  if (piper) return { engine: "piper", ...piper }

  const spd = await runCommand("spd-say", ["--help"], { timeoutMs: 1200 })
  if (spd.ok) return { engine: "spd-say" }

  const espeak = await runCommand("espeak", ["--version"], { timeoutMs: 1200 })
  if (espeak.ok) return { engine: "espeak" }

  const espeakNg = await runCommand("espeak-ng", ["--version"], { timeoutMs: 1200 })
  if (espeakNg.ok) return { engine: "espeak-ng" }

  return { engine: null }
}

function listFilesRecursive(rootDir, maxDepth = 4) {
  const out = []
  function walk(dir, depth) {
    if (depth > maxDepth) return
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        walk(full, depth + 1)
      } else if (e.isFile()) {
        out.push(full)
      }
    }
  }
  walk(rootDir, 0)
  return out
}

function scorePiperModelPath(modelPath) {
  const p = String(modelPath || "").toLowerCase()
  // Prefer English, US, medium quality voices by default.
  let score = 0
  if (p.includes("en_us")) score += 50
  if (p.includes("en-gb") || p.includes("en_gb")) score += 30
  // Prefer voices the user is likely to have installed intentionally.
  if (p.includes("/ryan/") || p.includes("en_us-ryan")) score += 35
  if (p.includes("/sam/") || p.includes("en_us-sam")) score += 25
  if (p.includes("lessac")) score += 25
  if (p.includes("medium")) score += 10
  if (p.includes("high")) score += 6
  if (p.includes("low")) score -= 5
  return score
}

async function pickPiperEngineConfig() {
  if (process.platform !== "linux") return null

  const piperTtsBin = "/usr/bin/piper-tts"
  const piperVenvBin = "/usr/lib/piper-tts/bin/piper"

  // Allow explicit override.
  const envModel = String(process.env.PLACEMENT_OS_PIPER_MODEL || "").trim()
  if (envModel && fs.existsSync(envModel)) {
    const hasPiperTts = await commandExists("piper-tts") || fs.existsSync(piperTtsBin)
    const hasPiperVenv = fs.existsSync(piperVenvBin)
    const hasPiper = await commandExists("piper")
    const hasPythonPiper = false // system python module is often not installed on Arch packages
    if (!hasPiperTts && !hasPiperVenv && !hasPiper && !hasPythonPiper) return null
    const player = await pickAudioPlayer()
    return player ? { modelPath: envModel, playerCmd: player } : null
  }

  const hasPiperTts = await commandExists("piper-tts") || fs.existsSync(piperTtsBin)
  const hasPiperVenv = fs.existsSync(piperVenvBin)
  const hasPiper = await commandExists("piper")
  if (!hasPiperTts && !hasPiperVenv && !hasPiper) return null

  const candidates = [
    "/usr/share/piper-voices",
    "/usr/local/share/piper-voices",
    "/usr/share/piper/voices",
    "/usr/share/piper",
  ]

  const models = []
  for (const base of candidates) {
    if (!fs.existsSync(base)) continue
    for (const f of listFilesRecursive(base, 4)) {
      if (f.endsWith(".onnx")) models.push(f)
    }
  }

  if (models.length === 0) return null
  models.sort((a, b) => scorePiperModelPath(b) - scorePiperModelPath(a))

  const player = await pickAudioPlayer()
  if (!player) return null

  return { modelPath: models[0], playerCmd: player }
}

async function pickAudioPlayer() {
  // PipeWire on CachyOS: pw-play is typically present.
  if (await commandExists("pw-play")) return "pw-play"
  if (await commandExists("paplay")) return "paplay"
  if (await commandExists("aplay")) return "aplay"
  return null
}

// Track a single active native TTS process per renderer (webContents).
// This prevents overlap/stammering when new speech starts before old speech ends.
const nativeTtsChildrenByWcId = new Map()

function stopNativeTtsFor(webContentsId) {
  const child = nativeTtsChildrenByWcId.get(webContentsId)
  if (!child) return
  try {
    if (!child.killed) child.kill("SIGKILL")
  } catch {
    // ignore
  }
  nativeTtsChildrenByWcId.delete(webContentsId)
}

function trackNativeTtsChild(webContentsId, child, onClose) {
  stopNativeTtsFor(webContentsId)
  nativeTtsChildrenByWcId.set(webContentsId, child)
  child.on("close", () => {
    if (nativeTtsChildrenByWcId.get(webContentsId) === child) {
      nativeTtsChildrenByWcId.delete(webContentsId)
    }
    try {
      onClose?.()
    } catch {
      // ignore
    }
  })
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function rateToEspeakSpeed(rate) {
  // espeak speed: 80..450 words per minute (approx). Default is ~175.
  const r = clampNumber(rate, 0.6, 1.6, 1.0)
  return String(Math.round(175 * r))
}

function rateToSpdRelative(rate) {
  // spd-say rate is typically -100..100 (relative). Map 1.0 -> 0.
  const r = clampNumber(rate, 0.6, 1.6, 1.0)
  return String(Math.round((r - 1.0) * 100))
}

function pitchToSpdRelative(pitch) {
  const p = clampNumber(pitch, 0.5, 1.5, 1.0)
  return String(Math.round((p - 1.0) * 100))
}

function pitchToEspeakPitch(pitch) {
  // espeak pitch: 0..99 (default 50). Map pitch (0.5..1.5) around 1.0.
  const p = clampNumber(pitch, 0.5, 1.5, 1.0)
  return String(Math.round(50 + (p - 1.0) * 25))
}

function spawnManagedTts(webContentsId, cmd, args) {
  return new Promise((resolve) => {
    let settled = false
    let child
    try {
      child = spawn(cmd, args, { stdio: "ignore" })
    } catch (e) {
      resolve({ ok: false, stderr: e instanceof Error ? e.message : String(e) })
      return
    }

    // Replace any existing process for this renderer.
    trackNativeTtsChild(webContentsId, child)

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve({ ok: true })
    }, 120)

    child.on("error", (err) => {
      clearTimeout(timer)
      if (nativeTtsChildrenByWcId.get(webContentsId) === child) nativeTtsChildrenByWcId.delete(webContentsId)
      if (settled) return
      settled = true
      resolve({ ok: false, stderr: String(err), errorCode: err?.code })
    })

    // If it exits quickly before the timer, still treat as started.
    child.on("close", () => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      resolve({ ok: true })
    })

    try {
      child.unref()
    } catch {
      // ignore
    }
  })
}

function isSpawnEnoent(res) {
  return !res?.ok && String(res?.errorCode || "").toUpperCase() === "ENOENT"
}

function isPythonMissingWhisperModule(res) {
  const stderr = String(res?.stderr || "")
  const stdout = String(res?.stdout || "")
  return /No module named whisper/i.test(stderr) || /No module named whisper/i.test(stdout)
}

function whisperPythonModuleHelpText() {
  return [
    "Python cannot import the 'whisper' module.",
    "Install the package for the SAME python3 Electron is using:",
    "  python3 -m pip install -U openai-whisper",
    "Also install ffmpeg:",
    "  sudo apt update && sudo apt install -y ffmpeg",
    "If you see 'externally-managed-environment' on Debian/Ubuntu, use one of:",
    "  python3 -m venv ~/.venvs/placement-os && ~/.venvs/placement-os/bin/pip install -U openai-whisper",
    "  pipx install openai-whisper",
    "Then either ensure 'whisper' is on PATH, or keep using the fallback 'python3 -m whisper'.",
  ].join("\n")
}

function whisperHelpText(attemptedCommand) {
  const attempted = String(attemptedCommand || "whisper")
  return [
    `Whisper executable not found: ${attempted}`,
    "Fix options:",
    "1) Install Whisper + ffmpeg:",
    "   - Ubuntu/Debian: sudo apt update && sudo apt install -y ffmpeg python3 python3-pip && pip3 install -U openai-whisper",
    "2) Ensure the whisper script is on PATH (often ~/.local/bin):",
    "   - export PATH=\"$HOME/.local/bin:$PATH\"",
    "3) Or set the app's Whisper command to use Python module mode:",
    "   - python3 -m whisper",
  ].join("\n")
}

async function runWhisperWithFallback(command, baseArgs, options) {
  const primaryCommand = String(command ?? "whisper").trim() || "whisper"
  const primary = await runCommand(primaryCommand, baseArgs, options)
  if (primary.ok) return { attempted: primaryCommand, res: primary }

  // Fallback: if `whisper` isn't on PATH, try running it as a Python module.
  if (primaryCommand === "whisper" && isSpawnEnoent(primary)) {
    const fallbackCommand = "python3"
    const fallbackArgs = ["-m", "whisper", ...baseArgs]
    const fallback = await runCommand(fallbackCommand, fallbackArgs, options)
    return { attempted: `${primaryCommand} (fallback: ${fallbackCommand} -m whisper)`, res: fallback, usedFallback: true }
  }

  return { attempted: primaryCommand, res: primary }
}

ipcMain.handle("code:run", async (_event, payload) => {
  const language = payload?.language
  const code = String(payload?.code ?? "")
  const stdin = String(payload?.stdin ?? "")
  const timeoutMs = Number(payload?.timeoutMs ?? 5000)

  if (!language || !code) {
    return { ok: false, stdout: "", stderr: "Missing language or code." }
  }

  const dir = mkTempDir()
  try {
    if (language === "java") {
      writeFile(dir, "Main.java", code)
      const compile = await runCommand("javac", ["Main.java"], { cwd: dir, timeoutMs })
      if (!compile.ok) return { ok: false, stdout: compile.stdout, stderr: compile.stderr }
      const exec = await runCommand("java", ["-cp", dir, "Main"], { cwd: dir, timeoutMs, stdin })
      return { ok: exec.ok, stdout: exec.stdout, stderr: exec.stderr }
    }

    if (language === "c") {
      writeFile(dir, "main.c", code)
      const compile = await runCommand("gcc", ["main.c", "-O2", "-std=c11", "-o", "main"], { cwd: dir, timeoutMs })
      if (!compile.ok) return { ok: false, stdout: compile.stdout, stderr: compile.stderr }
      const exec = await runCommand(path.join(dir, "main"), [], { cwd: dir, timeoutMs, stdin })
      return { ok: exec.ok, stdout: exec.stdout, stderr: exec.stderr }
    }

    if (language === "cpp") {
      writeFile(dir, "main.cpp", code)
      const compile = await runCommand("g++", ["main.cpp", "-O2", "-std=c++17", "-o", "main"], { cwd: dir, timeoutMs })
      if (!compile.ok) return { ok: false, stdout: compile.stdout, stderr: compile.stderr }
      const exec = await runCommand(path.join(dir, "main"), [], { cwd: dir, timeoutMs, stdin })
      return { ok: exec.ok, stdout: exec.stdout, stderr: exec.stderr }
    }

    return { ok: false, stdout: "", stderr: `Unsupported language: ${language}` }
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
})

// ────────────────────────────────────────────────────────────────
// Whisper STT (offline/local)
// Requires a local whisper CLI (e.g. `pip install -U openai-whisper`) and ffmpeg.
// Renderer records audio (webm/wav) and sends base64.

ipcMain.handle("stt:whisperCheck", async (_event, payload) => {
  const command = String(payload?.command ?? "whisper").trim() || "whisper"
  const { res, usedFallback } = await runWhisperWithFallback(command, ["--help"], { timeoutMs: 3000 })
  if (!res.ok && isSpawnEnoent(res)) {
    return { ok: false, stdout: "", stderr: whisperHelpText(command) }
  }
  if (!res.ok && usedFallback && isPythonMissingWhisperModule(res)) {
    return { ok: false, stdout: "", stderr: whisperPythonModuleHelpText() }
  }
  const note = usedFallback ? "\n\n(Used fallback: python3 -m whisper)" : ""
  return { ok: !!res.ok, stdout: `${res.stdout || ""}${note}`, stderr: res.stderr }
})

ipcMain.handle("stt:whisper", async (_event, payload) => {
  const audioBase64 = String(payload?.audioBase64 ?? "")
  const mimeType = String(payload?.mimeType ?? "audio/webm")
  const command = String(payload?.command ?? "whisper").trim() || "whisper"
  const model = String(payload?.model ?? "base").trim() || "base"
  const language = String(payload?.language ?? "en").trim() || "en"
  const timeoutMs = Number(payload?.timeoutMs ?? 120000)

  if (!audioBase64) {
    return { ok: false, text: "", stderr: "Missing audio." }
  }

  const dir = mkTempDir()
  try {
    let ext = "webm"
    if (mimeType.includes("wav")) ext = "wav"
    else if (mimeType.includes("mpeg")) ext = "mp3"
    else if (mimeType.includes("ogg")) ext = "ogg"

    const audioPath = path.join(dir, `audio.${ext}`)
    fs.writeFileSync(audioPath, Buffer.from(audioBase64, "base64"))

    const args = [
      audioPath,
      "--model", model,
      "--language", language,
      "--task", "transcribe",
      "--output_dir", dir,
      "--output_format", "txt",
      "--verbose", "False",
      "--fp16", "False",
    ]

    const { res } = await runWhisperWithFallback(command, args, { timeoutMs })
    if (!res.ok) {
      if (isSpawnEnoent(res)) {
        return { ok: false, text: "", stderr: whisperHelpText(command) }
      }
      if (isPythonMissingWhisperModule(res)) {
        return { ok: false, text: "", stderr: whisperPythonModuleHelpText() }
      }
      return { ok: false, text: "", stderr: res.stderr || res.stdout || "Whisper failed." }
    }

    const files = fs.readdirSync(dir)
    const txt = files.find((f) => f.toLowerCase().endsWith(".txt"))
    if (!txt) {
      return { ok: false, text: "", stderr: "Whisper finished but no transcript file was produced." }
    }

    const transcript = fs.readFileSync(path.join(dir, txt), "utf8").trim()
    return { ok: true, text: transcript, stderr: res.stderr }
  } catch (e) {
    return { ok: false, text: "", stderr: e instanceof Error ? e.message : String(e) }
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
})

// ────────────────────────────────────────────────────────────────
// Native TTS fallback (useful on Linux when speechSynthesis is silent)

ipcMain.handle("tts:check", async () => {
  const picked = await pickNativeTtsEngine()
  if (!picked.engine) {
    if (process.platform === "linux") {
      return {
        ok: false,
        stderr: "No native TTS engine found. Install one of: speech-dispatcher (spd-say) or espeak.",
      }
    }
    return { ok: false, stderr: "No native TTS engine found." }
  }
  return { ok: true, engine: picked.engine }
})

ipcMain.handle("tts:stop", async (event) => {
  const wcId = event?.sender?.id
  if (typeof wcId === "number") stopNativeTtsFor(wcId)
  return { ok: true }
})

ipcMain.handle("tts:speak", async (_event, payload) => {
  const wcId = _event?.sender?.id
  const text = String(payload?.text ?? "").trim()
  if (!text) return { ok: false, stderr: "Missing text." }

  if (typeof wcId === "number") {
    // Ensure no overlap even if renderer forgets to stop.
    stopNativeTtsFor(wcId)
  }

  const picked = await pickNativeTtsEngine()
  if (!picked.engine) {
    return {
      ok: false,
      stderr: process.platform === "linux"
        ? "No native TTS engine found. Install one of: sudo apt install -y speech-dispatcher espeak"
        : "No native TTS engine found.",
    }
  }

  if (picked.engine === "piper") {
    if (typeof wcId !== "number") {
      return { ok: false, stderr: "Native TTS requires a renderer context." }
    }

    const modelPath = String(picked.modelPath || "").trim()
    const playerCmd = String(picked.playerCmd || "").trim()
    if (!modelPath || !fs.existsSync(modelPath)) {
      return { ok: false, engine: "piper", stderr: "Piper voice model not found. Install a piper-voices package." }
    }
    if (!playerCmd) {
      return { ok: false, engine: "piper", stderr: "No audio player found. Install pw-play (pipewire), paplay, or aplay." }
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "placement-os-tts-"))
    const wavPath = path.join(tmpDir, "piper.wav")

    const rate = clampNumber(payload?.rate, 0.6, 1.6, 1.0)
    // Piper uses sentence silence to improve cadence; keep tiny, scale slightly with rate.
    const sentenceSilence = rate < 0.95 ? "0.12" : "0.06"

    // On Arch/CachyOS, `piper-tts-git` provides `/usr/bin/piper-tts` and `/usr/lib/piper-tts/bin/piper`.
    // Prefer those over system python modules.
    const tryCommands = []
    if (await commandExists("piper-tts")) tryCommands.push({ cmd: "piper-tts", argsBase: [] })
    if (fs.existsSync("/usr/bin/piper-tts")) tryCommands.push({ cmd: "/usr/bin/piper-tts", argsBase: [] })
    if (fs.existsSync("/usr/lib/piper-tts/bin/piper")) tryCommands.push({ cmd: "/usr/lib/piper-tts/bin/piper", argsBase: [] })
    if (await commandExists("piper")) tryCommands.push({ cmd: "piper", argsBase: [] })

    let piperOk = false
    let lastErr = ""
    for (const c of tryCommands) {
      const args = [
        ...c.argsBase,
        "-m",
        modelPath,
        "-f",
        wavPath,
        "--sentence-silence",
        sentenceSilence,
        "--",
        text,
      ]

      const child = spawn(c.cmd, args, { stdio: "ignore" })
      trackNativeTtsChild(wcId, child, () => {})

      const res = await new Promise((resolve) => {
        child.on("error", (err) => resolve({ ok: false, stderr: String(err), errorCode: err?.code }))
        child.on("close", (code) => resolve({ ok: code === 0, stderr: "" }))
      })

      if (res.ok && fs.existsSync(wavPath)) {
        piperOk = true
        break
      }
      lastErr = res.stderr || "Piper failed to generate audio."
    }

    if (!piperOk) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      return { ok: false, engine: "piper", stderr: lastErr || "Piper failed." }
    }

    // Play wav (managed so stop works)
    let playerArgs = [wavPath]
    const playChild = spawn(playerCmd, playerArgs, { stdio: "ignore" })
    trackNativeTtsChild(wcId, playChild, () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
    })

    return { ok: true, engine: "piper" }
  }

  if (picked.engine === "say") {
    const res = typeof wcId === "number" ? await spawnManagedTts(wcId, "say", [text]) : await spawnDetached("say", [text])
    return { ok: !!res.ok, engine: "say", stderr: res.stderr }
  }

  if (picked.engine === "spd-say") {
    const rate = payload?.rate
    const pitch = payload?.pitch
    const args = [
      "-r",
      rateToSpdRelative(rate),
      "-p",
      pitchToSpdRelative(pitch),
      text,
    ]
    const res = typeof wcId === "number" ? await spawnManagedTts(wcId, "spd-say", args) : await spawnDetached("spd-say", args)
    return { ok: !!res.ok, engine: "spd-say", stderr: res.stderr }
  }

  if (picked.engine === "espeak" || picked.engine === "espeak-ng") {
    const rate = payload?.rate
    const pitch = payload?.pitch
    const args = [
      "-v",
      "en-us",
      "-s",
      rateToEspeakSpeed(rate),
      "-p",
      pitchToEspeakPitch(pitch),
      // slightly longer word gap helps reduce choppiness
      "-g",
      "6",
      text,
    ]
    const res = typeof wcId === "number" ? await spawnManagedTts(wcId, picked.engine, args) : await spawnDetached(picked.engine, args)
    return { ok: !!res.ok, engine: picked.engine, stderr: res.stderr }
  }

  return { ok: false, stderr: `Unsupported native TTS engine: ${picked.engine}` }
})

// ────────────────────────────────────────────────────────────────
// Resume PDF text extraction (Python + PyMuPDF)

ipcMain.handle("resume:pickPdf", async () => {
  try {
    const res = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    })
    if (res.canceled) return { canceled: true, filePath: null }
    return { canceled: false, filePath: res.filePaths?.[0] ?? null }
  } catch (e) {
    return { canceled: true, filePath: null, stderr: e instanceof Error ? e.message : String(e) }
  }
})

ipcMain.handle("resume:extractPdfText", async (_event, payload) => {
  const filePath = String(payload?.filePath || "").trim()
  if (!filePath) return { ok: false, stderr: "Missing filePath" }
  try {
    if (!fs.existsSync(filePath)) return { ok: false, stderr: "File not found" }
    if (path.extname(filePath).toLowerCase() !== ".pdf") return { ok: false, stderr: "Selected file is not a PDF" }
  } catch {
    return { ok: false, stderr: "Could not access file" }
  }

  const res = await extractPdfTextWithPython(filePath)
  if (!res.ok) return { ok: false, stderr: res.stderr }
  return { ok: true, text: res.text }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,

    transparent: true,
    backgroundColor: "#00000000",

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Allow microphone access for speech-to-text in the AI Interviewer.
  // Deny everything else by default.
  try {
    win.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === "media" || permission === "microphone" || permission === "audioCapture") {
        callback(true)
        return
      }
      callback(false)
    })
  } catch {
    // ignore
  }

  // ⭐ Load built React app
  const indexPath = path.join(__dirname, "dist", "index.html")

  console.log("Loading:", indexPath)

  win.loadFile(indexPath)

  // DevTools (opt-in)
  if (process.env.PLACEMENT_OS_DEVTOOLS === "1") {
    win.webContents.openDevTools()
  }
}

app.whenReady().then(createWindow)