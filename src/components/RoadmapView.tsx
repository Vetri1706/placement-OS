import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { Calendar, Clock, Target, Sparkles, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import type { ResumeAnalysisResult } from "@/lib/aiService";

const tracks = [
  { id: "30", label: "30-Day Intensive", days: 30 },
  { id: "13", label: "13-Day Sprint", days: 13 },
];

const focusAreas = [
  { id: "dsa", label: "DSA" },
  { id: "system", label: "System Design" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
];

const generatePlan = (days: number, focus: string) => {
  const weeks = Math.max(1, Math.round(days / 7));
  const milestones = Array.from({ length: weeks }).map((_, i) => {
    const start = i * 7 + 1;
    const end = Math.min(days, (i + 1) * 7);
    return {
      title: `Days ${start}-${end}`,
      tasks: [`Core practice in ${focus}`, "2 mock interviews", "1 project or case study"],
    };
  });

  return {
    pace: days <= 14 ? "Fast-paced" : "Steady",
    weeklyHours: days <= 14 ? 12 : 8,
    milestones,
  };
};

const RoadmapView = () => {
  const [selectedTrack, setSelectedTrack] = useState(tracks[0].id);
  const [focus, setFocus] = useState(focusAreas[0].id);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResult | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai-interview-coach/resume-analysis");
      if (stored) setResumeAnalysis(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const plan = useMemo(() => generatePlan(Number(selectedTrack), focus), [selectedTrack, focus]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roadmap</h2>
          <p className="text-sm text-muted-foreground">
            {resumeAnalysis
              ? "Tailored roadmap based on your resume analysis."
              : "Get a 13-day sprint or 30-day plan tailored to your focus."}
          </p>
        </div>
        <Sparkles className="w-5 h-5 text-accent" />
      </div>

      {/* Resume-based recommendations */}
      {resumeAnalysis && (
        <div className="grid grid-cols-12 gap-4">
          <GlassCard className="col-span-12 lg:col-span-4 p-5 space-y-3" delay={0.02} hover={false}>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Weaknesses to Address
            </h3>
            <ul className="space-y-1.5">
              {resumeAnalysis.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-foreground glass rounded-md px-3 py-1.5">• {w}</li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="col-span-12 lg:col-span-4 p-5 space-y-3" delay={0.05} hover={false}>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Missing Skills to Learn
            </h3>
            <div className="flex flex-wrap gap-2">
              {resumeAnalysis.missingKeywords.map((kw, i) => (
                <span key={i} className="rounded-md bg-destructive/15 px-2.5 py-1 text-sm text-destructive border border-destructive/30 font-medium">{kw}</span>
              ))}
            </div>
            {resumeAnalysis.missingKeywords.length === 0 && (
              <p className="text-sm text-foreground/70">No missing keywords detected.</p>
            )}
          </GlassCard>

          <GlassCard className="col-span-12 lg:col-span-4 p-5 space-y-3" delay={0.08} hover={false}>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-accent" /> Suggested Improvements
            </h3>
            <ul className="space-y-1.5">
              {resumeAnalysis.improvements.slice(0, 4).map((imp, i) => (
                <li key={i} className="text-sm text-foreground glass rounded-md px-3 py-1.5">• {imp}</li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      {!resumeAnalysis && (
        <GlassCard className="p-4 flex items-center gap-3" delay={0.02} hover={false}>
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">
            <strong>Tip:</strong> Analyze your resume first to get a personalized roadmap based on your strengths and gaps.
          </p>
        </GlassCard>
      )}

      <GlassCard className="p-5 space-y-4" delay={0.05} hover={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-foreground/70">Duration</span>
            <div className="flex gap-2 flex-wrap">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`px-3 py-1.5 rounded glass text-sm ${selectedTrack === track.id ? "text-accent" : "text-foreground"}`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" /> {track.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm text-foreground/70">Focus area</span>
            <div className="flex gap-2 flex-wrap">
              {focusAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setFocus(area.id)}
                  className={`px-3 py-1.5 rounded glass text-sm ${focus === area.id ? "text-accent" : "text-foreground"}`}
                >
                  <Target className="w-4 h-4 inline mr-1" /> {area.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-4 p-5 space-y-3" delay={0.1} hover={false}>
          <h3 className="text-lg font-semibold">Plan overview</h3>
          <p className="text-sm text-foreground/70">{plan.pace} • ~{plan.weeklyHours} hrs/week</p>
          <div className="glass rounded-lg p-3 text-sm space-y-2">
            <p className="text-foreground">Daily: 2-3 practice sets + review.</p>
            <p className="text-foreground">Weekly: 2 mocks, 1 project increment.</p>
            <p className="text-foreground">Include spaced repetition for mistakes.</p>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-8 p-5 space-y-3" delay={0.15} hover={false}>
          <h3 className="text-lg font-semibold">Milestones</h3>
          <div className="space-y-3">
            {plan.milestones.map((milestone) => (
              <div key={milestone.title} className="glass rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <p className="text-sm font-semibold">{milestone.title}</p>
                </div>
                <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1">
                  {milestone.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default RoadmapView;
