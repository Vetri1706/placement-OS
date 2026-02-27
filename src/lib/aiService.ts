import { ollamaGenerate, ollamaStream, ollamaChat, type ChatMessage } from "./aiClient";
import { mockProblems } from "@/data/mockProblems";
import type { ResourceAIExplain, ResourceItem } from "@/types/resources";

/* ─────────── RESUME ANALYSIS ─────────── */

export interface ResumeAnalysisResult {
  atsScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvements: string[];
  interviewQuestions: string[];
}

const RESUME_SYSTEM = `You are an expert ATS resume analyst. Respond in valid JSON only — no markdown, no text outside JSON.`;

export async function analyzeResume(
  text: string,
  onToken?: (token: string) => void,
): Promise<string> {
  const prompt = `Analyze resume, return JSON:
{"atsScore":<0-100>,"summary":"<2 sentences>","strengths":["..."],"weaknesses":["..."],"missingKeywords":["..."],"improvements":["..."],"interviewQuestions":["Q1","Q2","Q3","Q4","Q5"]}

Resume:
${text.slice(0, 3000)}

Return ONLY valid JSON.`;

  if (onToken) {
    return await ollamaStream(prompt, onToken, { system: RESUME_SYSTEM, maxTokens: 2048 });
  }
  return await ollamaGenerate(prompt, RESUME_SYSTEM, 2048);
}

export function parseResumeResult(raw: string): ResumeAnalysisResult | null {
  try {
    // strip markdown fences if model added them
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      atsScore: Number(parsed.atsScore) || 0,
      summary: String(parsed.summary ?? ""),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
      interviewQuestions: Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions.map(String) : [],
    };
  } catch {
    return null;
  }
}

/* ─────────── CODE EXPLANATION ─────────── */

const CODE_SYSTEM = `You are a concise coding tutor. Keep explanations short and clear.`;

/** Try to find a predefined explanation for known problems by title or code */
export function findProblemByTitle(title?: string) {
  if (!title) return undefined;
  return mockProblems.find((p) => p.title === title);
}

export async function explainCode(
  code: string,
  language: string,
  onToken?: (token: string) => void,
  problemTitle?: string,
): Promise<string> {
  // Fast path: check by title first (most reliable), then by code matching
  const knownProblem = findProblemByTitle(problemTitle);
  if (knownProblem?.detailedExplanation) {
    const predefined = `## ${knownProblem.title}\n\n**What it does:** ${knownProblem.detailedExplanation}\n\n**Approach:**\n${knownProblem.approach}\n\n**Time Complexity:** ${knownProblem.timeComplexity}\n**Space Complexity:** ${knownProblem.spaceComplexity}`;
    if (onToken) onToken(predefined);
    return predefined;
  }

  // Fallback to LLM for custom code
  const prompt = `Briefly explain this ${language} code. Include: what it does, time complexity, space complexity.\n\n\`\`\`${language}\n${code.slice(0, 1500)}\n\`\`\``;

  if (onToken) {
    return await ollamaStream(prompt, onToken, { system: CODE_SYSTEM, maxTokens: 512 });
  }
  return await ollamaGenerate(prompt, CODE_SYSTEM, 512);
}

/* ─────────── PROBLEM HINTS ─────────── */

export async function getProblemHint(
  problemTitle: string,
  problemDescription: string,
  userCode: string,
  language: string,
  onToken?: (token: string) => void,
): Promise<string> {
  // Fast path: serve predefined hints for known problems
  const knownProblem = mockProblems.find((p) => p.title === problemTitle);
  if (knownProblem) {
    const hintText = [
      `## Hints for "${knownProblem.title}"`,
      "",
      ...knownProblem.hints.map((h, i) => `${i + 1}. ${h}`),
      "",
      `**Think about:** ${knownProblem.approach?.split("\n")[0] ?? knownProblem.editorial ?? ""}`,
      "",
      `**Complexity target:** Time ${knownProblem.timeComplexity ?? "?"}, Space ${knownProblem.spaceComplexity ?? "?"}`,
    ].join("\n");

    if (onToken) onToken(hintText);
    return hintText;
  }

  // Fallback to LLM
  const prompt = `Give a short hint (no full solution) for "${problemTitle}": ${problemDescription.slice(0, 500)}\nUser code:\n\`\`\`${language}\n${userCode.slice(0, 800)}\n\`\`\``;

  if (onToken) {
    return await ollamaStream(prompt, onToken, { system: CODE_SYSTEM, maxTokens: 256 });
  }
  return await ollamaGenerate(prompt, CODE_SYSTEM, 256);
}

/* ─────────── CODE REVIEW / DEBUG ─────────── */

export async function debugCode(
  code: string,
  language: string,
  error: string,
  onToken?: (token: string) => void,
): Promise<string> {
  const prompt = `Fix this ${language} code error. Be concise.\n\nCode:\n\`\`\`${language}\n${code.slice(0, 1000)}\n\`\`\`\n\nError: ${error.slice(0, 300)}`;

  if (onToken) {
    return await ollamaStream(prompt, onToken, { system: CODE_SYSTEM, maxTokens: 512 });
  }
  return await ollamaGenerate(prompt, CODE_SYSTEM, 512);
}

/* ─────────── AI INTERVIEW ─────────── */

const INTERVIEW_SYSTEM = `You are a technical interviewer.

Rules:
- Ask one question at a time.
- For the very first assistant message: output ONLY the first question (no greeting, no self-introduction, no preamble).
- After the user answers: give ONE short sentence of feedback, then ask the next question.
- Keep the whole message to 1-2 sentences when possible.
- Use plain text ONLY (no markdown, no bullet points, no numbering, no code fences).
- Avoid filler like "Hi", "Let's start", "Here's your question", or labels.
- Avoid special formatting characters like *, #, _, backticks, and excessive punctuation.
- Write in a way that sounds smooth when spoken aloud.`;

export async function conductInterview(
  messages: ChatMessage[],
  onToken?: (token: string) => void,
): Promise<string> {
  const chatMessages: ChatMessage[] = [
    { role: "system", content: INTERVIEW_SYSTEM },
    ...messages.slice(-10), // Keep only last 10 messages for speed
  ];

  return await ollamaChat(chatMessages, onToken);
}

/* ─────────── SOLUTION OPTIMIZATION ─────────── */

export async function optimizeSolution(
  code: string,
  language: string,
  problemTitle: string,
  onToken?: (token: string) => void,
): Promise<string> {
  // Fast path for known problems
  const knownProblem = mockProblems.find((p) => p.title === problemTitle);
  if (knownProblem?.approach) {
    const predefined = `## Optimization for "${knownProblem.title}"\n\n**Optimal approach:**\n${knownProblem.approach}\n\n**Target complexity:**\n- Time: ${knownProblem.timeComplexity}\n- Space: ${knownProblem.spaceComplexity}\n\n**Editorial:** ${knownProblem.editorial ?? "N/A"}`;
    if (onToken) onToken(predefined);
    return predefined;
  }

  const prompt = `Suggest optimizations for this ${language} solution to "${problemTitle}". Be concise.\n\n\`\`\`${language}\n${code.slice(0, 1000)}\n\`\`\``;

  if (onToken) {
    return await ollamaStream(prompt, onToken, { system: CODE_SYSTEM, maxTokens: 512 });
  }
  return await ollamaGenerate(prompt, CODE_SYSTEM, 512);
}

/* ─────────── RESOURCE EXPLANATION ─────────── */

const RESOURCE_SYSTEM =
  "You are a learning coach. Respond in valid JSON only — no markdown, no text outside JSON. Do not claim you opened the link; use only the provided metadata and general knowledge.";

export async function explainResource(
  resource: Pick<ResourceItem, "title" | "type" | "source" | "url" | "tags" | "difficulty" | "roles" | "description">,
): Promise<string> {
  const prompt = `Create an AI study helper for this resource. Return JSON:
{"summary":"<2-4 sentences>","keyPoints":["..."],"questions":["..."],"practiceSuggestions":["..."],"nextSteps":["..."]}

Resource metadata:
Title: ${resource.title}
Type: ${resource.type}
Source: ${resource.source}
URL: ${resource.url}
Difficulty: ${resource.difficulty}
Roles: ${(resource.roles ?? []).join(", ")}
Tags: ${(resource.tags ?? []).join(", ")}
Description: ${resource.description ?? ""}

Rules:
- Keep it concise and actionable.
- Questions should be interview-style or self-check questions.
- Practice suggestions should be tasks or problem ideas (not copyrighted text).

Return ONLY valid JSON.`;

  return await ollamaGenerate(prompt, RESOURCE_SYSTEM, 768);
}

export function parseResourceExplainResult(raw: string): ResourceAIExplain | null {
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: String(parsed.summary ?? ""),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions.map(String) : [],
      practiceSuggestions: Array.isArray(parsed.practiceSuggestions) ? parsed.practiceSuggestions.map(String) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
    };
  } catch {
    return null;
  }
}