import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { Bot, User, Mic, MicOff, SkipForward } from "lucide-react";
import { useState } from "react";

const messages = [
  { role: "ai", text: "Welcome to your mock interview. I'll be asking you about system design today. Are you ready?" },
  { role: "user", text: "Yes, I'm ready. Let's start!" },
  { role: "ai", text: "Great! Let's start with this: How would you design a URL shortening service like bit.ly? Walk me through your approach." },
  { role: "user", text: "I would start by identifying the core requirements. We need a way to generate short URLs, store mappings, and redirect users..." },
];

const AIInterviewView = () => {
  const [isSpeaking, setIsSpeaking] = useState(true);

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
        <p className="text-sm text-muted-foreground mb-6">System Design Round</p>

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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`p-3 rounded-full ${isSpeaking ? "neon-button text-primary-foreground" : "glass text-muted-foreground"}`}
          >
            {isSpeaking ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 rounded-full glass text-muted-foreground">
            <SkipForward className="w-5 h-5" />
          </motion.button>
        </div>
      </GlassCard>

      {/* Conversation */}
      <GlassCard className="col-span-7 p-6 flex flex-col" delay={0.1} hover={false}>
        <h3 className="text-lg font-semibold mb-4">Conversation</h3>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "ai" ? "bg-primary/20" : "bg-secondary/20"
              }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-secondary" />}
              </div>
              <div className={`glass rounded-lg p-3 max-w-[80%] ${msg.role === "user" ? "bg-primary/5" : ""}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="glass rounded-lg p-3 flex items-center gap-3">
          <input
            type="text"
            placeholder="Type your response..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <motion.button whileHover={{ scale: 1.05 }} className="neon-button text-primary-foreground text-sm font-medium py-1.5 px-4 rounded-lg">
            Send
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AIInterviewView;
