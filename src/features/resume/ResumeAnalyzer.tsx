import { useState, useCallback } from "react";
import { analyzeResume, parseResumeResult, type ResumeAnalysisResult } from "@/lib/aiService";
import { checkOllamaHealth } from "@/lib/aiClient";

export default function ResumeAnalyzer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [rawOutput, setRawOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setRawOutput("");
    setResult(null);

    try {
      const online = await checkOllamaHealth();
      if (!online) {
        setError("Ollama is not running. Start it with: ollama serve");
        setLoading(false);
        return;
      }

      const raw = await analyzeResume(text, (token) => {
        setRawOutput((prev) => prev + token);
      });

      const parsed = parseResumeResult(raw);
      if (parsed) {
        setResult(parsed);
      } else {
        setError("Could not parse structured result. Raw output shown below.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [text]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Resume Analyzer (Ollama)</h1>

      <textarea
        className="w-full h-40 border p-2 rounded"
        placeholder="Paste resume text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="bg-gray-800 text-green-400 p-4 rounded">
            <p className="font-bold">ATS Score: {result.atsScore}/100</p>
            <p className="mt-1">{result.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 text-green-400 p-3 rounded">
              <p className="font-bold mb-1">Strengths</p>
              {result.strengths.map((s, i) => <p key={i}>• {s}</p>)}
            </div>
            <div className="bg-gray-800 text-orange-400 p-3 rounded">
              <p className="font-bold mb-1">Weaknesses</p>
              {result.weaknesses.map((w, i) => <p key={i}>• {w}</p>)}
            </div>
          </div>

          {result.interviewQuestions.length > 0 && (
            <div className="bg-gray-800 text-blue-400 p-3 rounded">
              <p className="font-bold mb-1">Interview Questions</p>
              {result.interviewQuestions.map((q, i) => <p key={i}>{i + 1}. {q}</p>)}
            </div>
          )}
        </div>
      )}

      {!result && rawOutput && (
        <pre className="bg-gray-900 text-green-400 p-4 rounded whitespace-pre-wrap text-sm">
          {rawOutput}
        </pre>
      )}
    </div>
  );
}