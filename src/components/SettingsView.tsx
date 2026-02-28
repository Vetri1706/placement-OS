import type React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Link as LinkIcon, Save, Upload } from "lucide-react";
import GlassCard from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";

interface ProfileSettings {
  name: string;
  degree: string;
  experienceYears: string;
  experiences: string;
  graduationYear: string;
  languagesKnown: string;
  resumeLink: string;
  portfolioLink: string;
  leetCodeLink: string;
  resumeText: string;
}

const defaultProfile: ProfileSettings = {
  name: "Alex",
  degree: "B.Tech Computer Science",
  experienceYears: "2",
  experiences: "Internship at Acme Labs; Built internal dashboards and APIs.",
  graduationYear: "2025",
  languagesKnown: "JavaScript, TypeScript, Python, Java",
  resumeLink: "https://example.com/resume.pdf",
  portfolioLink: "https://example.com",
  leetCodeLink: "https://leetcode.com/u/example",
  resumeText: "",
};

const storageKey = "ai-interview-coach/profile-settings";

const SettingsView = () => {
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);
  const [saveState, setSaveState] = useState<string>("");
  const setUserName = useAppStore((s) => s.setUserName);

  useEffect(() => {
    try {
      const saved = window.appStore?.get?.(storageKey);
      if (saved && typeof saved === "object") {
        const merged = { ...defaultProfile, ...(saved as Partial<ProfileSettings>) };
        setProfile(merged);
        // Sync name to global store so TopBar shows it
        if (merged.name) setUserName(merged.name);
      }
    } catch {
      /* ignore */
    }
  }, [setUserName]);

  useEffect(() => {
    try {
      window.appStore?.set?.(storageKey, profile);
    } catch {
      /* ignore */
    }
  }, [profile]);

  const handleChange = (key: keyof ProfileSettings) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaveState("");
    // Live-sync name to TopBar
    if (key === "name" && value.trim()) {
      setUserName(value.trim());
    }
  };

  const handleSave = () => {
    setSaveState("Profile saved");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile & Settings</h2>
          <p className="text-sm text-muted-foreground">Update your profile and links.</p>
        </div>
        {saveState && (
          <div className="flex items-center gap-2 text-sm text-accent">
            <BadgeCheck className="w-4 h-4" /> {saveState}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 p-6 space-y-4" delay={0.05} hover={false}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Profile details</h3>
            <button
              onClick={handleSave}
              className="glass px-3 py-1.5 rounded text-sm flex items-center gap-2 text-foreground"
              aria-label="Save profile"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col text-sm gap-1">
              <span className="text-muted-foreground">Name</span>
              <input
                value={profile.name}
                onChange={handleChange("name")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="Your name"
              />
            </label>

            <label className="flex flex-col text-sm gap-1">
              <span className="text-muted-foreground">Degree</span>
              <input
                value={profile.degree}
                onChange={handleChange("degree")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="e.g. B.Tech Computer Science"
              />
            </label>

            <label className="flex flex-col text-sm gap-1">
              <span className="text-muted-foreground">Years of experience</span>
              <input
                value={profile.experienceYears}
                onChange={handleChange("experienceYears")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="e.g. 2"
              />
            </label>

            <label className="flex flex-col text-sm gap-1">
              <span className="text-muted-foreground">Graduation year</span>
              <input
                value={profile.graduationYear}
                onChange={handleChange("graduationYear")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="e.g. 2025"
              />
            </label>

            <label className="flex flex-col text-sm gap-1 md:col-span-2">
              <span className="text-muted-foreground">Experiences</span>
              <textarea
                value={profile.experiences}
                onChange={handleChange("experiences")}
                className="glass rounded px-3 py-2 bg-transparent outline-none min-h-[80px]"
                placeholder="Internships, projects, roles"
              />
            </label>

            <label className="flex flex-col text-sm gap-1 md:col-span-2">
              <span className="text-muted-foreground">Languages known</span>
              <input
                value={profile.languagesKnown}
                onChange={handleChange("languagesKnown")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="e.g. JavaScript, TypeScript, Python, Java"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <label className="flex flex-col text-sm gap-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <LinkIcon className="w-4 h-4" /> Resume link
              </span>
              <input
                value={profile.resumeLink}
                onChange={handleChange("resumeLink")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="https://..."
              />
            </label>

            <label className="flex flex-col text-sm gap-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <LinkIcon className="w-4 h-4" /> Portfolio link
              </span>
              <input
                value={profile.portfolioLink}
                onChange={handleChange("portfolioLink")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="https://..."
              />
            </label>

            <label className="flex flex-col text-sm gap-1 md:col-span-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <LinkIcon className="w-4 h-4" /> LeetCode profile link
              </span>
              <input
                value={profile.leetCodeLink}
                onChange={handleChange("leetCodeLink")}
                className="glass rounded px-3 py-2 bg-transparent outline-none"
                placeholder="https://leetcode.com/u/..."
              />
            </label>

            <label className="flex flex-col text-sm gap-1 md:col-span-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <Upload className="w-4 h-4" /> Resume text (paste for analysis)
              </span>
              <textarea
                value={profile.resumeText}
                onChange={handleChange("resumeText")}
                className="glass rounded px-3 py-2 bg-transparent outline-none min-h-[120px]"
                placeholder="Paste resume text here"
              />
            </label>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 p-6 space-y-4" delay={0.06} hover={false}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold">Interviewer Voice</h3>
              <p className="text-sm text-muted-foreground">AI questions are spoken via system TTS. Your answers are typed.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default SettingsView;
