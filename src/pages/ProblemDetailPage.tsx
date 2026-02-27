import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Play,
  Send,
  Star,
  CircleDotDashed,
  CircleDashed,
  Trophy,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import SidebarNav from "@/components/SidebarNav";
import TopBar from "@/components/TopBar";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { mockProblems } from "@/data/mockProblems";
import { useAppStore } from "@/store/useAppStore";
import { runPythonSolve } from "@/lib/pythonRunner";

const parseMaybeJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalize = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  return JSON.stringify(value);
};

const ProblemDetailPage = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const setView = useAppStore((s) => s.setView);
  const solvedProblemIds = useAppStore((s) => s.solvedProblemIds);
  const attemptedProblemIds = useAppStore((s) => s.attemptedProblemIds);
  const markProblemAttempted = useAppStore((s) => s.markProblemAttempted);
  const markProblemSolved = useAppStore((s) => s.markProblemSolved);

  const [language, setLanguage] = useState("javascript");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<0 | 1>(0);
  const [customInputs, setCustomInputs] = useState<[string, string]>([
    '{"nums":[2,7,11,15],"target":9}',
    '{"nums":[3,2,4],"target":6}',
  ]);
  const [customExpecteds, setCustomExpecteds] = useState<[string, string]>(["[0,1]", "[1,2]"]);
  const [code, setCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("Ready.");
  const [runTimeMs, setRunTimeMs] = useState<number | null>(null);
  const [passState, setPassState] = useState<"idle" | "pass" | "fail">("idle");
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");

  useEffect(() => {
    setView("problems");
  }, [setView]);

  const currentIndex = mockProblems.findIndex((problem) => problem.id === id);
  const problem = currentIndex >= 0 ? mockProblems[currentIndex] : null;

  const getStarterCode = (nextLanguage: string) => {
    if (nextLanguage === "javascript") {
      return problem?.starterCode ?? "";
    }
    if (nextLanguage === "python") {
      return [
        "def solve(input):",
        "    nums = input.get('nums', [])",
        "    target = input.get('target', 0)",
        "    # Return indices of two numbers that add up to target",
        "    return []",
        "",
      ].join("\n");
    }

    if (nextLanguage === "java") {
      return [
        "import java.io.*;",
        "",
        "public class Main {",
        "  public static void main(String[] args) throws Exception {",
        "    // Reads stdin and prints to stdout.",
        "    // For now, the input is passed as a raw string (usually JSON).",
        "    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",
        "    StringBuilder sb = new StringBuilder();",
        "    String line;",
        "    while ((line = br.readLine()) != null) {",
        "      sb.append(line);",
        "    }",
        "    String input = sb.toString();",
        "    System.out.println(solve(input));",
        "  }",
        "",
        "  static String solve(String input) {",
        "    // TODO: parse input and return the answer. Output should match expected exactly.",
        "    return \"[]\";",
        "  }",
        "}",
      ].join("\n");
    }

    if (nextLanguage === "c") {
      return [
        "#include <stdio.h>",
        "#include <string.h>",
        "",
        "int main(void) {",
        "  // Reads stdin and prints to stdout.",
        "  // Input is passed as a raw string (usually JSON).",
        "  char input[8192];",
        "  size_t n = fread(input, 1, sizeof(input) - 1, stdin);",
        "  input[n] = '\\0';",
        "  ",
        "  // TODO: parse input and print the answer.",
        "  printf(\"[]\");",
        "  return 0;",
        "}",
      ].join("\n");
    }

    if (nextLanguage === "cpp") {
      return [
        "#include <bits/stdc++.h>",
        "using namespace std;",
        "",
        "int main() {",
        "  ios::sync_with_stdio(false);",
        "  cin.tie(nullptr);",
        "",
        "  // Reads stdin and prints to stdout.",
        "  string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());",
        "",
        "  // TODO: parse input and print the answer.",
        "  cout << \"[]\";",
        "  return 0;",
        "}",
      ].join("\n");
    }

    return problem?.starterCode ?? "";
  };

  useEffect(() => {
    if (!problem) return;
    setCode(getStarterCode(language));
    const case1 = problem.testCases[0] ?? { input: "{}", expected: "" };
    const case2 = problem.testCases[1] ?? { input: "", expected: "" };
    setSelectedTestCase(0);
    setCustomInputs([case1.input ?? "{}", case2.input ?? ""]);
    setCustomExpecteds([case1.expected ?? "", case2.expected ?? ""]);
    setConsoleOutput("Ready.");
    setPassState("idle");
    setRunTimeMs(null);
  }, [problem, language]);

  const status = useMemo(() => {
    if (!problem) return "not-started" as const;
    if (solvedProblemIds.includes(problem.id)) return "solved" as const;
    if (attemptedProblemIds.includes(problem.id)) return "attempted" as const;
    return "not-started" as const;
  }, [attemptedProblemIds, problem, solvedProblemIds]);

  const evaluateSolveFunction = async (inputRaw: string) => {
    const startedAt = performance.now();

    const parsedInput = parseMaybeJson(inputRaw);

    if (language === "python") {
      try {
        const userOutput = await runPythonSolve(code, parsedInput);
        return {
          output: typeof userOutput === "string" ? userOutput : JSON.stringify(userOutput),
          parsedOutput: userOutput,
          passed: false,
          timeMs: Number((performance.now() - startedAt).toFixed(3)),
        };
      } catch (error) {
        return {
          output: error instanceof Error ? `Runtime error: ${error.message}` : "Runtime error.",
          passed: false,
          timeMs: Number((performance.now() - startedAt).toFixed(3)),
        };
      }
    }

    if (language === "java" || language === "c" || language === "cpp") {
      if (!window.codeRunner?.run) {
        return {
          output: "Local runner is not available (missing preload bridge).",
          passed: false,
          timeMs: Number((performance.now() - startedAt).toFixed(3)),
        };
      }

      const result = await window.codeRunner.run({ language: language as "java" | "c" | "cpp", code, stdin: inputRaw, timeoutMs: 6000 });

      if (!result.ok) {
        const message = result.stderr?.trim() || "Compilation/runtime error.";
        return {
          output: `Error: ${message}`,
          passed: false,
          timeMs: Number((performance.now() - startedAt).toFixed(3)),
        };
      }

      const stdout = (result.stdout ?? "").trim();
      return {
        output: stdout,
        parsedOutput: parseMaybeJson(stdout),
        passed: false,
        timeMs: Number((performance.now() - startedAt).toFixed(3)),
      };
    }

    if (language !== "javascript") {
      return {
        output: "Execution is not supported for this language.",
        passed: false,
        timeMs: Number((performance.now() - startedAt).toFixed(3)),
      };
    }

    const runUserCode = new Function(`${code}\n; return typeof solve === 'function' ? solve : null;`);
    const solveFn = runUserCode() as ((input: unknown) => unknown) | null;

    if (!solveFn) {
      return {
        output: "No `solve(input)` function found.",
        passed: false,
        timeMs: Number((performance.now() - startedAt).toFixed(3)),
      };
    }

    const userOutput = solveFn(parsedInput);

    return {
      output: typeof userOutput === "string" ? userOutput : JSON.stringify(userOutput),
      parsedOutput: userOutput,
      passed: false,
      timeMs: Number((performance.now() - startedAt).toFixed(3)),
    };
  };

  const runCode = async () => {
    if (!problem) return;

    try {
      markProblemAttempted(problem.id);
      const selectedInput = customInputs[selectedTestCase] ?? "{}";
      const selectedExpectedRaw = customExpecteds[selectedTestCase] ?? "";

      const result = await evaluateSolveFunction(selectedInput);
      const expected = parseMaybeJson(selectedExpectedRaw);
      const passed = normalize(result.parsedOutput ?? result.output) === normalize(expected);
      setRunTimeMs(result.timeMs);
      setPassState(passed ? "pass" : "fail");
      setBottomTab("result");
      setConsoleOutput(`Output: ${result.output}\nExpected: ${selectedExpectedRaw}`);
    } catch (error) {
      setRunTimeMs(null);
      setPassState("fail");
      setBottomTab("result");
      setConsoleOutput(error instanceof Error ? `Runtime error: ${error.message}` : "Runtime error.");
    }
  };

  const submitSolution = async () => {
    if (!problem) return;

    try {
      const startedAt = performance.now();
      markProblemAttempted(problem.id);

      const evaluations = [] as Array<{ index: number; input: string; expected: string; output: string; passed: boolean }>;
      for (let index = 0; index < problem.testCases.length; index++) {
        const testCase = problem.testCases[index];
        const result = await evaluateSolveFunction(testCase.input);
        const expected = parseMaybeJson(testCase.expected);
        const passed = normalize(result.parsedOutput ?? result.output) === normalize(expected);

        evaluations.push({
          index,
          input: testCase.input,
          expected: testCase.expected,
          output: result.output,
          passed,
        });
      }

      const allPassed = evaluations.every((item) => item.passed);
      const finishedAt = performance.now();

      if (allPassed) {
        markProblemSolved({ id: problem.id, difficulty: problem.difficulty });
      }

      setRunTimeMs(Number((finishedAt - startedAt).toFixed(3)));
      setPassState(allPassed ? "pass" : "fail");
      setBottomTab("result");
      setConsoleOutput(
        evaluations
          .map((item) => `${item.passed ? "✓" : "✗"} Case ${item.index + 1}\nInput: ${item.input}\nOutput: ${item.output}\nExpected: ${item.expected}`)
          .join("\n\n"),
      );
    } catch (error) {
      setRunTimeMs(null);
      setPassState("fail");
      setBottomTab("result");
      setConsoleOutput(error instanceof Error ? `Submission failed: ${error.message}` : "Submission failed.");
    }
  };

  if (!problem) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <SidebarNav />
        <div className="ml-20 relative z-10">
          <TopBar />
          <main className="px-6 pb-6">
            <GlassCard className="p-6" hover={false}>
              <p className="text-lg font-semibold">Problem not found.</p>
              <Button className="mt-4" onClick={() => navigate("/app")}>Back to Challenges</Button>
            </GlassCard>
          </main>
        </div>
      </div>
    );
  }

  const previousProblem = currentIndex > 0 ? mockProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex < mockProblems.length - 1 ? mockProblems[currentIndex + 1] : null;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <SidebarNav />
      <div className="ml-20 relative z-10">
        <TopBar />
        <main className="px-6 pb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-4" hover={false}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
                    <ArrowLeft className="h-4 w-4" /> Challenges
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!previousProblem}
                    onClick={() => previousProblem && navigate(`/problem/${previousProblem.id}`)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!nextProblem}
                    onClick={() => nextProblem && navigate(`/problem/${nextProblem.id}`)}
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFavorite((prev) => !prev)}
                    className="glass rounded-md px-3 py-1.5 text-sm font-medium"
                  >
                    <Star className={`mr-1 inline h-3.5 w-3.5 ${isFavorite ? "fill-streak text-streak" : "text-muted-foreground"}`} />
                    Favorite
                  </button>

                  {status === "solved" && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-3 py-1 text-sm text-accent font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                    </span>
                  )}
                  {status === "attempted" && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-3 py-1 text-sm text-primary font-medium">
                      <CircleDotDashed className="h-3.5 w-3.5" /> Attempted
                    </span>
                  )}
                  {status === "not-started" && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-3 py-1 text-sm text-foreground/70">
                      <CircleDashed className="h-3.5 w-3.5" /> Not Started
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>

            <div className="h-[calc(100vh-210px)]">
              <ResizablePanelGroup direction="horizontal" className="h-full rounded-2xl overflow-hidden">
                <ResizablePanel defaultSize={44} minSize={28}>
                  <GlassCard className="h-full overflow-hidden" hover={false}>
                    <Tabs defaultValue="description" className="h-full flex flex-col">
                      <div className="flex items-center justify-between gap-3 border-b border-border/30 px-4 py-3">
                        <div className="min-w-0">
                          <h1 className="text-lg font-semibold truncate">{problem.title}</h1>
                        </div>
                        <TabsList className="bg-muted/40">
                          <TabsTrigger value="description">Description</TabsTrigger>
                          <TabsTrigger value="editorial">Editorial</TabsTrigger>
                        </TabsList>
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto p-5">
                        <TabsContent value="description" className="mt-0">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  problem.difficulty === "Easy"
                                    ? "bg-accent/20 text-accent border-accent/30"
                                    : problem.difficulty === "Medium"
                                      ? "bg-primary/20 text-primary border-primary/30"
                                      : "bg-destructive/20 text-destructive border-destructive/30"
                                }
                              >
                                {problem.difficulty}
                              </Badge>

                              {problem.tags.map((tag) => (
                                <span key={tag} className="rounded-md bg-muted/30 px-2 py-1 text-sm text-foreground/70">
                                  {tag}
                                </span>
                              ))}

                              <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-sm text-primary font-medium">
                                <Trophy className="h-3.5 w-3.5" /> +{problem.points} XP
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-muted/25 px-2 py-1 text-sm text-foreground/70">
                                <Clock3 className="h-3.5 w-3.5" /> {problem.estimatedMinutes} min
                              </span>
                            </div>
                          </div>

                          <p className="mb-4 text-sm leading-relaxed text-foreground/80">{problem.fullDescription}</p>

                          <div className="mb-5">
                            <h3 className="mb-2 text-sm font-semibold">Constraints</h3>
                            <ul className="space-y-1 text-sm text-foreground">
                              {problem.constraints.map((item) => (
                                <li key={item} className="glass rounded-md px-2 py-1.5">{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="mb-5">
                            <h3 className="mb-2 text-sm font-semibold">Examples</h3>
                            <div className="space-y-2">
                              {problem.examples.map((example, index) => (
                                <div key={index} className="glass rounded-lg p-3 text-sm">
                                  <p className="text-foreground font-medium">Input: {example.input}</p>
                                  <p className="text-foreground font-medium">Output: {example.output}</p>
                                  {example.explanation && <p className="mt-1 text-primary">{example.explanation}</p>}
                                </div>
                              ))}
                            </div>
                          </div>

                          <Accordion type="single" collapsible defaultValue="hints" className="mb-5 glass rounded-lg px-3">
                            <AccordionItem value="hints" className="border-b-0">
                              <AccordionTrigger className="text-sm">Hints</AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-1 text-sm text-foreground">
                                  {problem.hints.map((hint) => (
                                    <li key={hint}>• {hint}</li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          <div className="mb-5">
                            <h3 className="mb-2 text-sm font-semibold">Related Topics</h3>
                            <div className="flex flex-wrap gap-1.5">
                              {problem.relatedTopics.map((topic) => (
                                <span key={topic} className="rounded-md bg-muted/30 px-2 py-1 text-sm text-foreground/70">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="mb-1 flex items-center justify-between text-sm text-foreground/70">
                              <span>Solve Rate</span>
                              <span>{problem.solveRate}%</span>
                            </div>
                            <Progress value={problem.solveRate} className="h-2 bg-muted/60" />
                          </div>
                        </TabsContent>

                        <TabsContent value="editorial" className="mt-0">
                          <div className="space-y-4">
                            <div className="glass rounded-lg p-4">
                              <h3 className="text-sm font-semibold mb-2">Editorial</h3>
                              <p className="text-sm leading-relaxed text-foreground/80">
                                {problem.editorial ?? "No editorial available for this problem yet."}
                              </p>
                            </div>

                            {problem.approach && (
                              <div className="glass rounded-lg p-4">
                                <h3 className="text-sm font-semibold mb-2">Approach</h3>
                                <pre className="text-sm whitespace-pre-wrap break-words text-foreground leading-relaxed">
                                  {problem.approach}
                                </pre>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="glass rounded-lg p-4">
                                <h3 className="text-sm font-semibold mb-2">Time Complexity</h3>
                                <p className="text-sm text-foreground/80">{problem.timeComplexity ?? "N/A"}</p>
                              </div>
                              <div className="glass rounded-lg p-4">
                                <h3 className="text-sm font-semibold mb-2">Space Complexity</h3>
                                <p className="text-sm text-foreground/80">{problem.spaceComplexity ?? "N/A"}</p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </GlassCard>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={56} minSize={34}>
                  <ResizablePanelGroup direction="vertical" className="h-full">
                    <ResizablePanel defaultSize={68} minSize={44}>
                      <GlassCard className="h-full overflow-hidden" hover={false}>
                        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                          <div className="text-sm text-foreground/70">Editor</div>
                          <Select
                            value={language}
                            onValueChange={(nextLanguage) => {
                              setLanguage(nextLanguage);
                              setCode(getStarterCode(nextLanguage));
                              setConsoleOutput("Ready.");
                              setPassState("idle");
                              setRunTimeMs(null);
                            }}
                          >
                            <SelectTrigger className="h-8 w-36 border-border/30 bg-transparent text-sm">
                              <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="javascript">JavaScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="java">Java</SelectItem>
                              <SelectItem value="c">C</SelectItem>
                              <SelectItem value="cpp">C++</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="h-[calc(100%-62px)]">
                          <Editor
                            height="100%"
                            language={
                              language === "python"
                                ? "python"
                                : language === "java"
                                  ? "java"
                                  : language === "c"
                                    ? "c"
                                    : language === "cpp"
                                      ? "cpp"
                                      : "javascript"
                            }
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            options={{
                              minimap: { enabled: false },
                              smoothScrolling: true,
                              automaticLayout: true,
                              fontSize: 14,
                              wordWrap: "on",
                              padding: { top: 12 },
                            }}
                          />
                        </div>
                      </GlassCard>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={32} minSize={20}>
                      <GlassCard className="h-full overflow-hidden" hover={false}>
                        <Tabs value={bottomTab} onValueChange={(value) => setBottomTab(value as "testcase" | "result")} className="h-full flex flex-col">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 px-4 py-2.5">
                            <TabsList className="bg-muted/40">
                              <TabsTrigger value="testcase">Testcase</TabsTrigger>
                              <TabsTrigger value="result">Test Result</TabsTrigger>
                            </TabsList>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button onClick={runCode} className="gap-1.5"><Play className="h-3.5 w-3.5" /> Run Code</Button>
                              <Button onClick={submitSolution} variant="secondary" className="gap-1.5">
                                <Send className="h-3.5 w-3.5" /> Submit
                              </Button>
                            </div>
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto p-4">
                            <TabsContent value="testcase" className="mt-0">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-foreground/80">Cases</span>
                                <div className="glass flex items-center rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTestCase(0)}
                                    className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                                      selectedTestCase === 0 ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    Case 1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTestCase(1)}
                                    disabled={!customInputs[1] && !customExpecteds[1]}
                                    className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                                      selectedTestCase === 1 ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                                    } disabled:opacity-50 disabled:hover:text-muted-foreground`}
                                  >
                                    Case 2
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                <div>
                                  <p className="mb-1 text-sm font-semibold text-foreground/80">Test Case Input</p>
                                  <textarea
                                    value={customInputs[selectedTestCase]}
                                    onChange={(event) =>
                                      setCustomInputs((prev) => {
                                        const next = [...prev] as [string, string];
                                        next[selectedTestCase] = event.target.value;
                                        return next;
                                      })
                                    }
                                    className="glass min-h-[6rem] w-full resize-y rounded-lg bg-transparent p-2 text-sm text-foreground outline-none"
                                  />
                                </div>
                                <div>
                                  <p className="mb-1 text-sm font-semibold text-foreground/80">Expected Output</p>
                                  <textarea
                                    value={customExpecteds[selectedTestCase]}
                                    onChange={(event) =>
                                      setCustomExpecteds((prev) => {
                                        const next = [...prev] as [string, string];
                                        next[selectedTestCase] = event.target.value;
                                        return next;
                                      })
                                    }
                                    className="glass min-h-[6rem] w-full resize-y rounded-lg bg-transparent p-2 text-sm text-foreground outline-none"
                                  />
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="result" className="mt-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="text-foreground/70"><span className="font-semibold">Execution:</span> {runTimeMs === null ? "--" : `${runTimeMs} ms`}</span>
                                {passState === "pass" && <span className="text-accent font-medium">Pass ✓</span>}
                                {passState === "fail" && <span className="text-destructive font-medium">Fail ✗</span>}
                              </div>
                              <div className="glass rounded-lg p-2 text-sm text-foreground whitespace-pre-wrap min-h-[60px]">
                                {consoleOutput}
                              </div>
                            </TabsContent>
                          </div>
                        </Tabs>
                      </GlassCard>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
