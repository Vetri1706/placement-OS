import type React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link as LinkIcon, Upload, Sparkles, Loader2, CheckCircle2, AlertTriangle, Brain, FileText, Target, HelpCircle, Lightbulb, XCircle } from "lucide-react";
import GlassCard from "./GlassCard";
import { analyzeResume, parseResumeResult, type ResumeAnalysisResult } from "@/lib/aiService";
import { checkOllamaHealth } from "@/lib/aiClient";
import { Progress } from "@/components/ui/progress";

interface ProfileSettings {
  resumeLink: string;
  resumeText: string;
}

const storageKey = "ai-interview-coach/profile-settings";

const ResumeAnalyzerView = () => {
  const [profile, setProfile] = useState<ProfileSettings>({ resumeLink: "", resumeText: "" });
  const [analyzing, setAnalyzing] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);

  // Check Ollama health on mount
  useEffect(() => {
    checkOllamaHealth().then(setOllamaOnline);
  }, []);

  // Load/save profile in session only (no disk persistence)
  useEffect(() => {
    try {
      const saved = window.appStore?.get?.(storageKey);
      if (saved && typeof saved === "object") {
        const parsed = saved as Partial<ProfileSettings>;
        setProfile((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const existing = window.appStore?.get?.(storageKey);
      const base = existing && typeof existing === "object" ? existing : {};
      window.appStore?.set?.(storageKey, { ...(base as any), ...profile });
    } catch {
      /* ignore */
    }
  }, [profile]);

  const handleChange = (key: keyof ProfileSettings) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const inputText = useMemo(() => (profile.resumeText || profile.resumeLink).trim(), [profile]);

  const handleAnalyze = useCallback(async (overrideText?: string) => {
    const textToAnalyze = String(overrideText ?? inputText).trim();
    if (!textToAnalyze) return;
    setAnalyzing(true);
    setError(null);
    setStreamText("");
    setAnalysisResult(null);

    try {
      const raw = await analyzeResume(textToAnalyze, (token) => {
        setStreamText((prev) => prev + token);
      });
      const parsed = parseResumeResult(raw);
      if (parsed) {
        setAnalysisResult(parsed);
        // Keep for roadmap generation in-session only
        try {
          window.appStore?.set?.("ai-interview-coach/resume-analysis", parsed);
        } catch {
          /* ignore */
        }
      } else {
        // If parsing fails, still show the raw output
        setError("Could not parse structured result. Showing raw AI output below.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Ollama. Make sure it's running.");
    } finally {
      setAnalyzing(false);
    }
  }, [inputText]);

  const handleUploadPdf = useCallback(async () => {
    if (!window.resume?.pickPdf || !window.resume?.extractPdfText) {
      setError("PDF upload is not available in this environment.");
      return;
    }

    setError(null);
    setExtractingPdf(true);

    try {
      const picked = await window.resume.pickPdf();
      if (picked.canceled || !picked.filePath) return;

      const extracted = await window.resume.extractPdfText({ filePath: picked.filePath });
      if (!extracted.ok || !extracted.text) {
        throw new Error(extracted.stderr || "Failed to extract text from PDF.");
      }

      setProfile((prev) => ({ ...prev, resumeText: extracted.text ?? "", resumeLink: "" }));

      // Do the rest: auto-run analysis after extraction.
      if (ollamaOnline !== false) {
        await handleAnalyze(extracted.text);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF extraction failed";
      setError(msg);
    } finally {
      setExtractingPdf(false);
    }
  }, [handleAnalyze, ollamaOnline]);

  const scoreColor = analysisResult
    ? analysisResult.atsScore >= 75
      ? "text-accent"
      : analysisResult.atsScore >= 50
        ? "text-primary"
        : "text-destructive"
    : "text-muted-foreground";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resume Analyzer</h2>
          <p className="text-sm text-foreground/70">AI-powered resume analysis using Ollama (qwen2.5-coder:7b)</p>
        </div>
        <div className="flex items-center gap-3">
          {ollamaOnline === null ? (
            <span className="text-sm text-foreground/70 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking Ollama…</span>
          ) : ollamaOnline ? (
            <span className="text-sm text-accent flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ollama Online</span>
          ) : (
            <span className="text-sm text-destructive flex items-center gap-1"><XCircle className="w-3 h-3" /> Ollama Offline</span>
          )}
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* ── Left: Input ── */}
        <GlassCard className="col-span-12 lg:col-span-5 p-6 space-y-4" delay={0.05} hover={false}>
          <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Resume Input</h3>

          <label className="flex flex-col text-sm gap-1">
            <span className="text-foreground/70 flex items-center gap-1">
              <LinkIcon className="w-4 h-4" /> Resume link
            </span>
            <input
              value={profile.resumeLink}
              onChange={handleChange("resumeLink")}
              className="glass rounded px-3 py-2 bg-transparent outline-none"
              placeholder="https://..."
            />
          </label>

          <motion.button
            whileHover={{ scale: extractingPdf ? 1 : 1.01 }}
            whileTap={{ scale: extractingPdf ? 1 : 0.99 }}
            onClick={handleUploadPdf}
            disabled={extractingPdf || analyzing}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              extractingPdf || analyzing
                ? "glass text-muted-foreground cursor-not-allowed"
                : "glass text-foreground hover:text-foreground"
            }`}
            title="Upload a local PDF and extract text"
          >
            {extractingPdf ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Extracting PDF…</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload PDF</>
            )}
          </motion.button>

          <label className="flex flex-col text-sm gap-1">
            <span className="text-foreground/70 flex items-center gap-1">
              <Upload className="w-4 h-4" /> Resume text (paste)
            </span>
            <textarea
              value={profile.resumeText}
              onChange={handleChange("resumeText")}
              className="glass rounded px-3 py-2 bg-transparent outline-none min-h-[200px] max-h-[50vh] resize-y"
              placeholder="Paste your full resume text here for AI analysis…"
            />
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnalyze()}
            disabled={analyzing || extractingPdf || !inputText || ollamaOnline === false}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              analyzing || extractingPdf || !inputText || ollamaOnline === false
                ? "glass text-muted-foreground cursor-not-allowed"
                : "neon-button text-primary-foreground"
            }`}
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI…</>
            ) : (
              <><Brain className="w-4 h-4" /> Analyze Resume</>
            )}
          </motion.button>

          {error && (
            <div className="glass rounded-lg p-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </GlassCard>

        {/* ── Right: Results ── */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* ATS Score + Summary */}
          {analysisResult && (
            <GlassCard className="p-6 space-y-4" delay={0.1} hover={false}>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm text-foreground/70 mb-1">ATS Score</p>
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
                      <circle
                        cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                        stroke="currentColor"
                        className={scoreColor}
                        strokeDasharray={`${(analysisResult.atsScore / 100) * 213.6} 213.6`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreColor}`}>
                      {analysisResult.atsScore}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground/70 mb-1">Summary</p>
                  <p className="text-sm leading-relaxed text-foreground">{analysisResult.summary}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Strengths & Weaknesses */}
          {analysisResult && (
            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="p-5 space-y-2" delay={0.15} hover={false}>
                <p className="text-sm text-foreground/70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-accent" /> Strengths</p>
                {analysisResult.strengths.map((s, i) => (
                  <p key={i} className="text-sm text-foreground">• {s}</p>
                ))}
              </GlassCard>
              <GlassCard className="p-5 space-y-2" delay={0.2} hover={false}>
                <p className="text-sm text-foreground/70 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-destructive" /> Weaknesses</p>
                {analysisResult.weaknesses.map((w, i) => (
                  <p key={i} className="text-sm text-foreground">• {w}</p>
                ))}
              </GlassCard>
            </div>
          )}

          {/* Missing Keywords */}
          {analysisResult && analysisResult.missingKeywords.length > 0 && (
            <GlassCard className="p-5 space-y-2" delay={0.25} hover={false}>
              <p className="text-sm text-foreground/70 flex items-center gap-1"><Target className="w-3 h-3" /> Missing Keywords (add these to pass ATS)</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.missingKeywords.map((kw, i) => (
                  <span key={i} className="rounded-md bg-destructive/15 px-2 py-1 text-sm text-destructive border border-destructive/30">{kw}</span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Improvements */}
          {analysisResult && analysisResult.improvements.length > 0 && (
            <GlassCard className="p-5 space-y-2" delay={0.3} hover={false}>
              <p className="text-sm text-foreground/70 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-primary" /> Suggested Improvements</p>
              {analysisResult.improvements.map((imp, i) => (
                <p key={i} className="text-sm text-foreground">• {imp}</p>
              ))}
            </GlassCard>
          )}

          {/* Interview Questions */}
          {analysisResult && analysisResult.interviewQuestions.length > 0 && (
            <GlassCard className="p-5 space-y-2" delay={0.35} hover={false}>
              <p className="text-sm text-foreground/70 flex items-center gap-1"><HelpCircle className="w-3 h-3 text-primary" /> Likely Interview Questions</p>
              {analysisResult.interviewQuestions.map((q, i) => (
                <p key={i} className="text-sm text-foreground">{i + 1}. {q}</p>
              ))}
            </GlassCard>
          )}

          {/* Streaming raw text (shown while analyzing or when parse failed) */}
          {(analyzing || (!analysisResult && streamText)) && (
            <GlassCard className="p-5" delay={0.1} hover={false}>
              <p className="text-sm text-foreground/70 mb-2 flex items-center gap-1">
                {analyzing && <Loader2 className="w-3 h-3 animate-spin" />} AI Output
              </p>
              <pre className="text-sm whitespace-pre-wrap break-words text-foreground leading-relaxed max-h-[50vh] overflow-y-auto">
                {streamText || "Waiting for response…"}
              </pre>
            </GlassCard>
          )}

          {/* Empty state */}
          {!analysisResult && !analyzing && !streamText && (
            <GlassCard className="p-8 flex flex-col items-center justify-center text-center" delay={0.1} hover={false}>
              <Brain className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-foreground/70">Paste your resume and click <strong>Analyze Resume</strong> to get AI-powered feedback.</p>
              <p className="text-sm text-foreground/70 mt-1">Powered by Ollama &middot; qwen2.5-coder:7b</p>
            </GlassCard>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeAnalyzerView;
