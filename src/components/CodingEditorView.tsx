import { motion } from "framer-motion";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import GlassCard from "./GlassCard";
import { Copy, RotateCcw, ChevronDown, Play } from "lucide-react";

const languageOptions = [
  { label: "Java", monaco: "java" },
  { label: "C", monaco: "c" },
  { label: "py", monaco: "python" },
  { label: "C++", monaco: "cpp" },
  { label: "JavaScript", monaco: "javascript" },
];

const starterTemplates: Record<string, string> = {
  java: 'System.out.println("hello");',
  c: "#include <stdio.h>\n\nint main() {\n  printf(\"hello\\n\");\n  return 0;\n}",
  py: 'print("hello")',
  cpp: '#include <iostream>\n\nint main() {\n  std::cout << "hello" << std::endl;\n  return 0;\n}',
  javascript: 'console.log("hello");',
};

const trimQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "");

const extractScriptOutput = (source: string, language: string) => {
  const lines = source.split("\n");
  const output: string[] = [];

  if (language === "java") {
    lines.forEach((line) => {
      const match = line.match(/System\.out\.println\((.+)\);?/);
      if (match?.[1]) output.push(trimQuotes(match[1].trim()));
    });
  }

  if (language === "py" || language === "pandas") {
    lines.forEach((line) => {
      const match = line.match(/print\((.+)\)/);
      if (match?.[1]) output.push(trimQuotes(match[1].trim()));
    });
  }

  if (language === "cpp") {
    lines.forEach((line) => {
      if (!line.includes("cout")) return;
      const chunks = [...line.matchAll(/"([^"]*)"/g)].map((item) => item[1]);
      if (chunks.length > 0) output.push(chunks.join(""));
    });
  }

  if (language === "go") {
    lines.forEach((line) => {
      const match = line.match(/fmt\.Println\((.+)\)/);
      if (match?.[1]) output.push(trimQuotes(match[1].trim()));
    });
  }

  if (language === "rust") {
    lines.forEach((line) => {
      const match = line.match(/println!\((.+)\);?/);
      if (match?.[1]) output.push(trimQuotes(match[1].trim()));
    });
  }

  if (language === "sql") {
    const match = source.match(/select\s+'([^']+)'/i);
    if (match?.[1]) output.push(match[1]);
  }

  return output;
};

const CodingEditorView = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(starterTemplates.javascript);
  const [output, setOutput] = useState("No run yet.");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* no-op */
    }
  };

  const handleReset = () => {
    setCode(starterTemplates[selectedLanguage] ?? "");
    setOutput("No run yet.");
  };

  const handleLanguageChange = (nextLanguage: string) => {
    setSelectedLanguage(nextLanguage);
    setCode(starterTemplates[nextLanguage] ?? "");
    setOutput("No run yet.");
  };

  const handleRun = () => {
    if (selectedLanguage === "javascript" || selectedLanguage === "typescript") {
      try {
        const logs: string[] = [];
        const scopedConsole = {
          log: (...args: unknown[]) => {
            const line = args
              .map((arg) => {
                if (typeof arg === "string") return arg;
                try {
                  return JSON.stringify(arg);
                } catch {
                  return String(arg);
                }
              })
              .join(" ");
            logs.push(line);
          },
        };

        const runner = new Function("console", code);
        runner(scopedConsole);
        setOutput(logs.length > 0 ? logs.join("\n") : "Code ran successfully. No output.");
      } catch (error) {
        setOutput(error instanceof Error ? `Runtime error: ${error.message}` : "Runtime error.");
      }
      return;
    }

    const extracted = extractScriptOutput(code, selectedLanguage);
    setOutput(extracted.length > 0 ? extracted.join("\n") : "Code ran successfully. No output.");
  };

  const currentMonacoLanguage = languageOptions.find((language) => language.label.toLowerCase() === selectedLanguage)?.monaco ?? "javascript";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-120px)]">
      <GlassCard className="h-full flex flex-col overflow-hidden" delay={0.1} hover={false}>
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Try coding</p>
            <p className="text-sm text-foreground/70">Try coding or solve your own challenges here.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className="glass text-foreground font-medium px-2.5 py-1.5 rounded text-sm flex items-center gap-1.5"
              aria-label="Run code"
            >
              <Play className="w-3.5 h-3.5" /> Run
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy code"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={handleReset} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Reset editor">
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="relative glass rounded px-2 py-1">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-sm text-foreground/70 pr-5 outline-none"
                aria-label="Select language"
              >
                {languageOptions.map((language) => (
                  <option key={language.label.toLowerCase()} value={language.label.toLowerCase()} className="bg-background text-foreground">
                    {language.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={currentMonacoLanguage}
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

        <div className="border-t border-border/30 px-4 py-2.5 min-h-[72px] max-h-[40vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-1">Output</p>
          <pre className="text-sm whitespace-pre-wrap break-words text-foreground">{output}</pre>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default CodingEditorView;
