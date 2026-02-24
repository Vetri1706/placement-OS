import { motion } from "framer-motion";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import GlassCard from "./GlassCard";
import { Play, Copy, RotateCcw, ChevronDown } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";

const defaultCode = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`;

interface TestCase {
  id: string;
  nums: number[];
  target: number;
  expected: number[];
}

interface TestResult {
  id: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

const defaultTestCases: TestCase[] = [
  { id: "case-1", nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
  { id: "case-2", nums: [3, 2, 4], target: 6, expected: [1, 2] },
  { id: "case-3", nums: [3, 3], target: 6, expected: [0, 1] },
];

const normalizePair = (value: unknown): number[] => {
  if (!Array.isArray(value) || value.length !== 2) return [];
  const normalized = value.map((entry) => Number(entry));
  if (normalized.some(Number.isNaN)) return [];
  return normalized;
};

const samePair = (a: number[], b: number[]) => a.length === 2 && b.length === 2 && a[0] === b[0] && a[1] === b[1];

const CodingEditorView = () => {
  const isMobile = useIsMobile();
  const [code, setCode] = useState(defaultCode);
  const [customNums, setCustomNums] = useState("[2,7,11,15]");
  const [customTarget, setCustomTarget] = useState("9");
  const [customExpected, setCustomExpected] = useState("[0,1]");
  const [customCases, setCustomCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [review, setReview] = useState("Run tests to see feedback.");
  const [runTimeMs, setRunTimeMs] = useState<number | null>(null);
  const [showComplexity, setShowComplexity] = useState(false);
  const [inputError, setInputError] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* no-op */
    }
  };

  const handleReset = () => {
    setCode(defaultCode);
    setResults([]);
    setReview("Run tests to see feedback.");
    setRunTimeMs(null);
  };

  const handleAddCustomCase = () => {
    setInputError("");
    try {
      const parsedNums = JSON.parse(customNums) as unknown;
      const parsedExpected = JSON.parse(customExpected) as unknown;
      const nums = Array.isArray(parsedNums) ? parsedNums.map((n) => Number(n)) : [];
      const expected = normalizePair(parsedExpected);
      const target = Number(customTarget);

      if (!Array.isArray(parsedNums) || nums.some(Number.isNaN)) {
        setInputError("Custom nums must be a valid number array, e.g. [2,7,11,15].");
        return;
      }

      if (Number.isNaN(target)) {
        setInputError("Custom target must be a valid number.");
        return;
      }

      if (expected.length !== 2) {
        setInputError("Expected output must be a pair index array, e.g. [0,1].");
        return;
      }

      const newCase: TestCase = {
        id: `custom-${Date.now()}`,
        nums,
        target,
        expected,
      };

      setCustomCases((prev) => [...prev, newCase]);
      setInputError("");
    } catch {
      setInputError("Invalid JSON format in custom testcase fields.");
    }
  };

  const handleRunCode = () => {
    const allCases = [...defaultTestCases, ...customCases];
    const startedAt = performance.now();

    try {
      const runner = new Function(`${code}\n; return typeof twoSum === 'function' ? twoSum : null;`);
      const twoSumFn = runner() as ((nums: number[], target: number) => unknown) | null;

      if (!twoSumFn) {
        setResults([]);
        setRunTimeMs(Number((performance.now() - startedAt).toFixed(3)));
        setReview("Could not find function `twoSum(nums, target)`. Please define it and try again.");
        return;
      }

      const nextResults: TestResult[] = allCases.map((testCase) => {
        try {
          const actualRaw = twoSumFn(testCase.nums, testCase.target);
          const actual = normalizePair(actualRaw);
          const passed = samePair(actual, testCase.expected);

          return {
            id: testCase.id,
            input: `nums = [${testCase.nums.join(",")}], target = ${testCase.target}`,
            expected: `[${testCase.expected.join(",")}]`,
            actual: Array.isArray(actualRaw) ? `[${actualRaw.join(",")}]` : String(actualRaw),
            passed,
          };
        } catch (error) {
          return {
            id: testCase.id,
            input: `nums = [${testCase.nums.join(",")}], target = ${testCase.target}`,
            expected: `[${testCase.expected.join(",")}]`,
            actual: "Runtime error",
            passed: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      setResults(nextResults);
      setRunTimeMs(Number((performance.now() - startedAt).toFixed(3)));

      const passedCount = nextResults.filter((result) => result.passed).length;
      const total = nextResults.length;
      if (passedCount === total) {
        setReview("Excellent work. All test cases passed, and your implementation looks efficient for this problem.");
      } else {
        setReview(`Passed ${passedCount}/${total} tests. Review failing cases and edge handling.`);
      }
    } catch (error) {
      setResults([]);
      setRunTimeMs(Number((performance.now() - startedAt).toFixed(3)));
      setReview(error instanceof Error ? `Code execution failed: ${error.message}` : "Code execution failed.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-120px)]">
      <ResizablePanelGroup
        key={isMobile ? "mobile-main" : "desktop-main"}
        direction={isMobile ? "vertical" : "horizontal"}
        className="h-full rounded-2xl overflow-hidden"
      >
        <ResizablePanel defaultSize={isMobile ? 35 : 32} minSize={isMobile ? 22 : 18}>
          <GlassCard className="h-full p-5 overflow-y-auto" delay={0} hover={false}>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">Easy</span>
              <h3 className="font-semibold">Two Sum</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Given an array of integers <code className="text-primary text-xs glass px-1.5 py-0.5 rounded">nums</code> and an integer <code className="text-primary text-xs glass px-1.5 py-0.5 rounded">target</code>, return indices of the two numbers such that they add up to target.
            </p>
            <div className="glass rounded-lg p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">Example:</p>
              <code className="text-xs text-accent">Input: nums = [2,7,11,15], target = 9</code>
              <br />
              <code className="text-xs text-accent">Output: [0,1]</code>
            </div>
          </GlassCard>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={isMobile ? 65 : 68} minSize={35}>
          <ResizablePanelGroup
            key={isMobile ? "mobile-right" : "desktop-right"}
            direction="vertical"
            className="h-full"
          >
            <ResizablePanel defaultSize={62} minSize={35}>
              <GlassCard className="h-full flex flex-col overflow-hidden" delay={0.1} hover={false}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
                      <div className="w-3 h-3 rounded-full bg-streak/60" />
                      <div className="w-3 h-3 rounded-full bg-accent/60" />
                    </div>
                    <span className="text-xs text-muted-foreground">solution.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={handleReset} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1 glass rounded px-2 py-1 text-xs text-muted-foreground">
                      JavaScript <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    options={{
                      fontSize: 14,
                      fontFamily: "JetBrains Mono, monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      automaticLayout: true,
                      padding: { top: 12 },
                      roundedSelection: true,
                      smoothScrolling: true,
                    }}
                  />
                </div>

                <div className="px-4 py-3 border-t border-border/30 flex items-center justify-end gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="neon-button text-primary-foreground font-semibold py-2 px-6 rounded-lg text-sm flex items-center gap-2"
                    onClick={handleRunCode}
                  >
                    <Play className="w-4 h-4" /> Run Code
                  </motion.button>
                  <button
                    onClick={() => setShowComplexity((prev) => !prev)}
                    className="glass text-foreground font-semibold py-2 px-4 rounded-lg text-sm"
                  >
                    Complexity & Runtime
                  </button>
                </div>
              </GlassCard>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={38} minSize={20}>
              <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="h-full">
                <ResizablePanel defaultSize={isMobile ? 58 : 62} minSize={26}>
                  <GlassCard className="h-full p-4 overflow-y-auto" delay={0.2} hover={false}>
                    <p className="text-xs text-muted-foreground mb-2">Output</p>
                    <div className="space-y-2 text-xs">
                      {results.length === 0 ? (
                        <p className="text-muted-foreground">No test run yet.</p>
                      ) : (
                        results.map((result, index) => (
                          <div key={result.id} className="glass rounded-md p-2">
                            <p className={result.passed ? "text-accent" : "text-destructive"}>
                              {result.passed ? "✓" : "✗"} Test {index + 1}: {result.input}
                            </p>
                            <p className="text-muted-foreground">Expected: {result.expected}</p>
                            <p className="text-muted-foreground">Actual: {result.actual}</p>
                            {result.error && <p className="text-destructive">Error: {result.error}</p>}
                          </div>
                        ))
                      )}
                    </div>

                    <p className="text-xs mt-3 text-primary">Review: {review}</p>

                    {showComplexity && (
                      <div className="mt-3 glass rounded-md p-3 text-xs text-muted-foreground">
                        <p>Estimated Time Complexity: O(n)</p>
                        <p>Estimated Space Complexity: O(n)</p>
                        <p>Last Runtime: {runTimeMs !== null ? `${runTimeMs} ms` : "Run code to measure."}</p>
                      </div>
                    )}
                  </GlassCard>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={isMobile ? 42 : 38} minSize={24}>
                  <GlassCard className="h-full p-4 overflow-y-auto" delay={0.25} hover={false}>
                    <p className="text-sm font-medium mb-3">Custom Test Cases</p>
                    <div className="grid grid-cols-12 gap-2 text-xs">
                      <input
                        value={customNums}
                        onChange={(e) => setCustomNums(e.target.value)}
                        className="col-span-12 md:col-span-5 glass rounded px-2 py-2 bg-transparent outline-none"
                        placeholder="nums (e.g. [2,7,11,15])"
                      />
                      <input
                        value={customTarget}
                        onChange={(e) => setCustomTarget(e.target.value)}
                        className="col-span-12 md:col-span-2 glass rounded px-2 py-2 bg-transparent outline-none"
                        placeholder="target"
                      />
                      <input
                        value={customExpected}
                        onChange={(e) => setCustomExpected(e.target.value)}
                        className="col-span-12 md:col-span-3 glass rounded px-2 py-2 bg-transparent outline-none"
                        placeholder="expected (e.g. [0,1])"
                      />
                      <button onClick={handleAddCustomCase} className="col-span-12 md:col-span-2 glass rounded px-2 py-2 font-medium">
                        Add
                      </button>
                    </div>
                    {inputError && <p className="text-xs text-destructive mt-2">{inputError}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Custom cases added: {customCases.length}</p>
                  </GlassCard>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </motion.div>
  );
};

export default CodingEditorView;
