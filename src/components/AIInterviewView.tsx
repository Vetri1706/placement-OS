import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { Bot, User, Volume2, VolumeX, SkipForward, Loader2, RotateCcw } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { conductInterview } from "@/lib/aiService";
import { checkOllamaHealth } from "@/lib/aiClient";
import type { ChatMessage } from "@/lib/aiClient";
import { speakTts, unlockAudioPlayback } from "@/lib/tts";

interface UIMessage {
  role: "ai" | "user";
  text: string;
}

const TOPICS = ["Data Structures & Algorithms", "System Design", "Behavioral", "Frontend Development", "Backend Development", "Database & SQL"];

const AIInterviewView = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("Data Structures & Algorithms");
  const [started, setStarted] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [ttsError, setTtsError] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<UIMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const voiceEnabledRef = useRef(true);
  const ttsStopRef = useRef<null | (() => void)>(null);

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    checkOllamaHealth().then(setOllamaOnline);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildChatHistory = (msgs: UIMessage[]): ChatMessage[] => {
    return msgs.map((m) => ({
      role: m.role === "ai" ? "assistant" as const : "user" as const,
      content: m.text,
    }));
  };

  const streamAiResponse = useCallback(async (currentMessages: UIMessage[]) => {
    setLoading(true);
    setIsSpeaking(true);

    // Add a placeholder AI message
    const aiMsg: UIMessage = { role: "ai", text: "" };
    const withPlaceholder = [...currentMessages, aiMsg];
    setMessages(withPlaceholder);

    const aiIndex = currentMessages.length;
    let aiText = "";

    try {
      const chatHistory = buildChatHistory(currentMessages);
      await conductInterview(chatHistory, (token) => {
        aiText += token;
        setMessages((prev) => {
          const copy = [...prev];
          copy[aiIndex] = { role: "ai", text: aiText };
          return copy;
        });
      });

      // Ensure final text is set
      setMessages((prev) => {
        const copy = [...prev];
        copy[aiIndex] = { role: "ai", text: aiText };
        return copy;
      });

      // Speak the AI response via TTS
      if (voiceEnabledRef.current && aiText) {
        // Stop any previous speech
        ttsStopRef.current?.();
        ttsStopRef.current = null;
        setTtsError("");

        try {
          const { stop, engine } = await speakTts({ text: aiText, rate: 1.0 });
          ttsStopRef.current = stop;
          if (engine === "native") {
            // Optional: helps explain why it works when system speech is silent.
            setTtsError("");
          }
        } catch (e) {
          setTtsError(e instanceof Error ? e.message : "Voice failed.");
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => {
        const copy = [...prev];
        copy[aiIndex] = { role: "ai", text: `Error: ${errMsg}\n\nMake sure Ollama is running:\n  ollama serve` };
        return copy;
      });
    } finally {
      setLoading(false);
      setIsSpeaking(false);
    }
  }, []);

  const startInterview = useCallback(async () => {
    // user gesture: unlock audio early so subsequent TTS plays reliably
    try {
      await unlockAudioPlayback();
    } catch {
      // ignore
    }
    setStarted(true);
    const initialUser: UIMessage = {
      role: "user",
      text: `Start a mock interview on: ${selectedTopic}. Ask the first question.`,
    };
    await streamAiResponse([initialUser]);
  }, [selectedTopic, streamAiResponse]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: UIMessage = { role: "user", text: inputText.trim() };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated);
    setInputText("");

    await streamAiResponse(updated);
  }, [inputText, loading, streamAiResponse]);

  const skipQuestion = useCallback(async () => {
    if (loading) return;
    const skipMsg: UIMessage = { role: "user", text: "Skip this question. Ask the next one." };
    const updated = [...messagesRef.current, skipMsg];
    setMessages(updated);
    await streamAiResponse(updated);
  }, [loading, streamAiResponse]);

  const resetInterview = () => {
    abortRef.current?.abort();
    ttsStopRef.current?.();
    ttsStopRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setMessages([]);
    messagesRef.current = [];
    setStarted(false);
    setIsSpeaking(false);
    setLoading(false);
    setTtsError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
      {/* AI Avatar Side */}
      <GlassCard className="col-span-5 p-6 flex flex-col items-center justify-center" delay={0} hover={false}>
        <div className="relative mb-8">
          <motion.div
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(200 100% 55% / 0.2), hsl(260 60% 60% / 0.2))" }}
            animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="w-16 h-16 text-primary" />
          </motion.div>
          {isSpeaking && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid hsl(200 100% 55% / 0.3)" }}
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2">AI Interviewer</h3>
        <p className="text-sm text-foreground/70 mb-2">{selectedTopic}</p>

        {voiceEnabled && (
          <p className="text-xs text-foreground/60 mb-3 text-center">
            Voice: System TTS • Input: Text
          </p>
        )}

        {ollamaOnline === false && (
          <p className="text-sm text-destructive mb-3">Ollama is offline – start it first</p>
        )}

        {/* Topic selector (before start) */}
        {!started && (
          <div className="w-full space-y-3 mb-6">
            <p className="text-sm text-foreground/70 text-center">Choose a topic:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedTopic === t ? "neon-button text-primary-foreground" : "glass text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Waveform */}
        <div className="flex items-center gap-1 h-12 mb-6">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-primary"
              animate={isSpeaking ? { height: [3, Math.random() * 32 + 3, 3] } : { height: 3 }}
              transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.03 }}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {!started ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startInterview}
              disabled={ollamaOnline === false}
              className="neon-button text-primary-foreground text-sm font-medium py-2 px-6 rounded-lg"
            >
              Start Interview
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  voiceEnabledRef.current = next;
                  if (!next) {
                    ttsStopRef.current?.();
                    ttsStopRef.current = null;
                    setTtsError("");
                    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                  } else {
                    // user gesture: unlock audio when enabling voice
                    unlockAudioPlayback().catch(() => {
                      // ignore
                    });
                  }
                }}
                className={`p-3 rounded-full ${voiceEnabled ? "neon-button text-primary-foreground" : "glass text-muted-foreground"}`}
                title={voiceEnabled ? "Voice ON — click to mute" : "Voice OFF — click to enable"}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={skipQuestion}
                disabled={loading}
                className="p-3 rounded-full glass text-muted-foreground"
              >
                <SkipForward className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetInterview}
                className="p-3 rounded-full glass text-muted-foreground"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </div>
      </GlassCard>

      {/* Conversation */}
      <GlassCard className="col-span-7 p-6 flex flex-col" delay={0.1} hover={false}>
        <h3 className="text-lg font-semibold mb-4">Conversation</h3>
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && !started && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a topic and start your mock interview.
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "ai" ? "bg-primary/20" : "bg-secondary/20"
              }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-secondary" />}
              </div>
              <div className={`glass rounded-lg p-3 max-w-[80%] ${msg.role === "user" ? "bg-primary/5" : ""}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {loading && messages.length > 0 && messages[messages.length - 1]?.text === "" && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="glass rounded-lg p-3 flex items-end gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!started || loading}
            placeholder={started ? "Type your response…" : "Start the interview first…"}
            rows={1}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: "36px", height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 128) + "px";
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={sendMessage}
            disabled={!started || loading || !inputText.trim()}
            className="neon-button text-primary-foreground text-sm font-medium py-1.5 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
          </motion.button>
        </div>

        {ttsError && (
          <p className="mt-2 text-xs text-destructive/90">{ttsError}</p>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default AIInterviewView;
