import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import GlassCard from "./GlassCard";
import { Play, Copy, RotateCcw, ChevronDown } from "lucide-react";

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

const highlightKeywords = (line: string) => {
  const keywordRegex = /(\bfunction\b|\bconst\b|\bfor\b|\blet\b|\bif\b|\breturn\b|\bnew\b)/g;
  const keywordSet = new Set(["function", "const", "for", "let", "if", "return", "new"]);
  const segments = line.split(keywordRegex);

  return segments.map((segment, index) => {
    if (keywordSet.has(segment)) {
      return (
        <span key={`${segment}-${index}`} className="editor-keyword">
          {segment}
        </span>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
};

const CodingEditorView = () => {
  const [code, setCode] = useState(defaultCode);

  const lines = useMemo(() => code.split("\n"), [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* no-op */
    }
  };

  const handleReset = () => {
    setCode(defaultCode);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
      {/* Problem Panel */}
      <GlassCard className="col-span-4 p-5 overflow-y-auto" delay={0} hover={false}>
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

      {/* Editor */}
      <div className="col-span-8 flex flex-col gap-4">
        <GlassCard className="flex-1 flex flex-col overflow-hidden" delay={0.1} hover={false}>
          {/* Editor Header */}
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

          {/* Code Area */}
          <div className="editor-surface flex-1 p-4 font-mono text-sm overflow-auto">
            <div className="editor-orb-a" />
            <div className="editor-orb-b" />
            <div className="editor-content">
              {lines.map((line, i) => (
              <motion.div
                key={i + 1}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex"
              >
                <span className="editor-line-number w-8 text-right mr-4 select-none text-xs leading-6">{i + 1}</span>
                <span className="leading-6 whitespace-pre-wrap">
                  {highlightKeywords(line)}
                </span>
              </motion.div>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <div className="px-4 py-3 border-t border-border/30 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="neon-button text-primary-foreground font-semibold py-2 px-6 rounded-lg text-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Run Code
            </motion.button>
          </div>
        </GlassCard>

        {/* Output */}
        <GlassCard className="h-32 p-4" delay={0.2} hover={false}>
          <p className="text-xs text-muted-foreground mb-2">Output</p>
          <div className="font-mono text-sm text-accent">
            <span className="text-muted-foreground">{'>'}</span> [0, 1]
          </div>
          <p className="text-xs text-accent mt-2">✓ All test cases passed</p>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default CodingEditorView;
