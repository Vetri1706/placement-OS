import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "./GlassCard";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Play,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { CURATED_RESOURCES } from "@/data/resources";
import type { ResourceAIExplain, ResourceItem, ResourceSection, ResourceType } from "@/types/resources";
import { loadResourceLibraryState, saveResourceLibraryState, type ResourceLibraryState } from "@/lib/resourceLibraryStore";
import { explainResource, parseResourceExplainResult } from "@/lib/aiService";

type SectionTab = "all" | ResourceSection | "ai";
type TypeTab = "all" | ResourceType;

function faviconCandidates(url: string): string[] {
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;
    const hostname = parsed.hostname;

    return [
      `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(url)}`,
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      `${origin}/favicon.ico`,
      `${origin}/favicon-32x32.png`,
      `${origin}/apple-touch-icon.png`,
    ];
  } catch {
    return [];
  }
}

function ResourceThumbnail({ url, type, size }: { url: string; type: ResourceType; size: "sm" | "md" }) {
  const candidates = useMemo(() => faviconCandidates(url), [url]);
  const [idx, setIdx] = useState(0);

  const src = idx < candidates.length ? candidates[idx] : null;
  const boxClass = size === "sm" ? "w-14 h-14" : "w-16 h-16";
  const imgPad = size === "sm" ? "p-2.5" : "p-3";

  return (
    <div className={`relative ${boxClass} rounded-2xl border border-border/40 bg-background/20 flex items-center justify-center`}>
      <div className="absolute inset-0 flex items-center justify-center">{iconForType(type)}</div>
      {src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-contain ${imgPad}`}
          onError={() => setIdx((v) => v + 1)}
        />
      )}
    </div>
  );
}

function iconForType(type: ResourceType) {
  if (type === "video") return <Play className="w-10 h-10 text-foreground/40" />;
  if (type === "pdf") return <BookOpen className="w-10 h-10 text-foreground/40" />;
  if (type === "article") return <FileText className="w-10 h-10 text-foreground/40" />;
  if (type === "practice") return <Play className="w-10 h-10 text-foreground/40" />;
  return <BookOpen className="w-10 h-10 text-foreground/40" />;
}

function labelForSection(section: ResourceSection) {
  switch (section) {
    case "coding-practice":
      return "Coding Practice";
    case "courses":
      return "Courses";
    case "interview-prep":
      return "Interview Prep";
    case "company-specific":
      return "Company-Specific";
  }
}

function todaySeed(): number {
  const now = new Date();
  const day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
  return day;
}

function pickDaily(resources: ResourceItem[], count: number) {
  if (resources.length <= count) return resources;
  const seed = todaySeed();
  const sorted = [...resources].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const start = seed % sorted.length;
  const picks: ResourceItem[] = [];
  for (let i = 0; i < sorted.length && picks.length < count; i++) {
    picks.push(sorted[(start + i) % sorted.length]);
  }
  return picks;
}

const ResourcesLibraryView = () => {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<SectionTab>("all");
  const [type, setType] = useState<TypeTab>("all");

  const [libraryState, setLibraryState] = useState<ResourceLibraryState | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [aiErrorById, setAiErrorById] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    loadResourceLibraryState().then((st) => {
      if (!alive) return;
      setLibraryState(st);
    });
    return () => {
      alive = false;
    };
  }, []);

  const bookmarkedSet = useMemo(() => new Set(libraryState?.bookmarkedIds ?? []), [libraryState?.bookmarkedIds]);
  const completedSet = useMemo(() => new Set(libraryState?.completedIds ?? []), [libraryState?.completedIds]);

  const baseResources = useMemo(() => CURATED_RESOURCES, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = baseResources;

    if (section !== "all" && section !== "ai") {
      list = list.filter((r) => r.section === section);
    }
    if (type !== "all") {
      list = list.filter((r) => r.type === type);
    }
    if (q) {
      list = list.filter((r) => {
        const hay = [r.title, r.source, r.description ?? "", r.tags.join(" "), r.difficulty, r.section].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    if (section === "ai") {
      // Minimal personalization: prioritize bookmarks & higher-rated resources.
      list = [...list].sort((a, b) => {
        const ab = bookmarkedSet.has(a.id) ? 1 : 0;
        const bb = bookmarkedSet.has(b.id) ? 1 : 0;
        if (ab !== bb) return bb - ab;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
    } else {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    return list;
  }, [baseResources, bookmarkedSet, query, section, type]);

  const dailyPicks = useMemo(() => pickDaily(baseResources, 3), [baseResources]);

  async function persist(next: ResourceLibraryState) {
    setLibraryState(next);
    await saveResourceLibraryState(next);
  }

  async function toggleBookmark(id: string) {
    const cur = libraryState ?? (await loadResourceLibraryState());
    const set = new Set(cur.bookmarkedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    await persist({ ...cur, bookmarkedIds: Array.from(set) });
  }

  async function toggleCompleted(id: string) {
    const cur = libraryState ?? (await loadResourceLibraryState());
    const set = new Set(cur.completedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    await persist({ ...cur, completedIds: Array.from(set) });
  }

  async function saveNote(id: string, note: string) {
    const cur = libraryState ?? (await loadResourceLibraryState());
    await persist({ ...cur, notesById: { ...cur.notesById, [id]: note } });
  }

  async function runAiExplain(resource: ResourceItem) {
    setAiErrorById((e) => ({ ...e, [resource.id]: "" }));
    setAiBusyId(resource.id);

    try {
      const cur = libraryState ?? (await loadResourceLibraryState());
      const cached = cur.aiById[resource.id];
      if (cached?.value?.summary) {
        setAiBusyId(null);
        return;
      }

      const raw = await explainResource({
        title: resource.title,
        type: resource.type,
        source: resource.source,
        url: resource.url,
        tags: resource.tags,
        difficulty: resource.difficulty,
        roles: resource.roles,
        description: resource.description,
      });
      const parsed = parseResourceExplainResult(raw);
      if (!parsed) throw new Error("AI response was not valid JSON");

      const next = {
        ...cur,
        aiById: {
          ...cur.aiById,
          [resource.id]: { createdAt: new Date().toISOString(), value: parsed },
        },
      } satisfies ResourceLibraryState;

      await persist(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      setAiErrorById((e) => ({ ...e, [resource.id]: message }));
    } finally {
      setAiBusyId(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Resources Library</h2>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="glass rounded-lg pl-10 pr-4 py-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-64"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {(
          [
            { key: "all", label: "All" },
            { key: "coding-practice", label: "Coding Practice" },
            { key: "courses", label: "Courses" },
            { key: "interview-prep", label: "Interview Prep" },
            { key: "company-specific", label: "Company-Specific" },
            { key: "ai", label: "AI Recommended" },
          ] as const
        ).map((tab, i) => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.05 }}
            onClick={() => setSection(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              section === tab.key
                ? "neon-button text-primary-foreground"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            { key: "all", label: "All" },
            { key: "video", label: "Videos" },
            { key: "pdf", label: "PDFs" },
            { key: "article", label: "Articles" },
            { key: "practice", label: "Practice" },
            { key: "course", label: "Courses" },
          ] as const
        ).map((tab, i) => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.05 }}
            onClick={() => setType(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              type === tab.key
                ? "neon-button text-primary-foreground"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground/80">Today’s Picks</h3>
          <span className="text-xs text-muted-foreground">Offline cached metadata • {baseResources.length} resources</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dailyPicks.map((res, i) => (
            <GlassCard key={res.id} className="p-0 overflow-hidden" delay={i * 0.03}>
              <div className="h-24 flex items-center justify-center" style={{ background: res.image }}>
                <ResourceThumbnail url={res.url} type={res.type} size="sm" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-foreground/60">{res.source} • {labelForSection(res.section)}</div>
                    <div className="text-sm font-semibold truncate">{res.title}</div>
                  </div>
                  <button
                    onClick={() => window.open(res.url, "_blank", "noopener,noreferrer")}
                    className="glass rounded-lg px-2.5 py-1.5 text-xs text-foreground/80 hover:text-foreground"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="columns-2 lg:columns-3 gap-4 space-y-4">
        {filtered.map((res, i) => {
          const isBookmarked = bookmarkedSet.has(res.id);
          const isCompleted = completedSet.has(res.id);
          const isExpanded = expandedId === res.id;

          const aiValue: ResourceAIExplain | undefined = libraryState?.aiById?.[res.id]?.value;
          const noteValue = libraryState?.notesById?.[res.id] ?? "";
          const aiBusy = aiBusyId === res.id;
          const aiError = aiErrorById[res.id];

          return (
            <GlassCard key={res.id} className="break-inside-avoid p-0 overflow-hidden" delay={i * 0.03}>
              <div className="h-36 flex items-center justify-center" style={{ background: res.image }}>
                <ResourceThumbnail url={res.url} type={res.type} size="md" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {res.type === "video" ? <Play className="w-3 h-3 text-primary" /> : <FileText className="w-3 h-3 text-secondary" />}
                      <span className="text-xs text-foreground/70 uppercase">{res.type}</span>
                      <span className="text-xs text-foreground/40">•</span>
                      <span className="text-xs text-foreground/70">{res.source}</span>
                    </div>
                    <h4 className="text-sm font-semibold mb-1 truncate">{res.title}</h4>
                    <div className="text-xs text-foreground/60">{labelForSection(res.section)} • {res.difficulty}</div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => window.open(res.url, "_blank", "noopener,noreferrer")}
                      className="glass rounded-lg px-2.5 py-1.5 text-xs text-foreground/80 hover:text-foreground flex items-center gap-1"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Open</span>
                    </button>
                    <button
                      onClick={() => toggleBookmark(res.id)}
                      className={`glass rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1 ${
                        isBookmarked ? "text-primary" : "text-foreground/70 hover:text-foreground"
                      }`}
                      title={isBookmarked ? "Bookmarked" : "Bookmark"}
                    >
                      <Star className={`w-4 h-4 ${isBookmarked ? "fill-primary" : ""}`} />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                  </div>
                </div>

                {typeof res.rating === "number" && (
                  <div className="flex items-center gap-2 mt-3">
                    <Star className="w-3 h-3 text-streak fill-streak" />
                    <span className="text-xs text-foreground/70">{res.rating.toFixed(1)}</span>
                    <span className="text-xs text-foreground/40">•</span>
                    <span className="text-xs text-foreground/70">{res.tags.join(" • ")}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => {
                      setExpandedId(isExpanded ? null : res.id);
                    }}
                    className="glass rounded-lg px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground"
                  >
                    {isExpanded ? "Hide" : "Details"}
                  </button>
                  <button
                    onClick={() => toggleCompleted(res.id)}
                    className={`glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 ${
                      isCompleted ? "text-primary" : "text-foreground/80 hover:text-foreground"
                    }`}
                    title={isCompleted ? "Completed" : "Mark completed"}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "" : "text-foreground/50"}`} />
                    Done
                  </button>
                  <button
                    onClick={() => runAiExplain(res)}
                    disabled={aiBusy}
                    className={`glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 ${
                      aiBusy ? "opacity-70" : "text-foreground/80 hover:text-foreground"
                    }`}
                    title="AI Explain"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiBusy ? "Thinking…" : aiValue ? "AI Ready" : "AI Explain"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    {res.description && <div className="text-xs text-foreground/70">{res.description}</div>}

                    <div>
                      <div className="text-xs text-foreground/60 mb-1">Notes (offline)</div>
                      <textarea
                        value={noteValue}
                        onChange={(e) => saveNote(res.id, e.target.value)}
                        rows={3}
                        className="glass w-full rounded-lg px-3 py-2 text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        placeholder="Your notes, key takeaways, TODOs…"
                      />
                    </div>

                    {aiError && <div className="text-xs text-destructive">{aiError}</div>}

                    {aiValue && (
                      <div className="glass rounded-lg p-3">
                        <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" /> AI Study Helper
                        </div>
                        <div className="text-xs text-foreground/80 mb-2">{aiValue.summary}</div>
                        {aiValue.keyPoints.length > 0 && (
                          <div className="text-xs text-foreground/70 mb-2">
                            <div className="text-foreground/60 mb-1">Key points</div>
                            <ul className="list-disc pl-4 space-y-1">
                              {aiValue.keyPoints.slice(0, 5).map((p) => (
                                <li key={p}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiValue.questions.length > 0 && (
                          <div className="text-xs text-foreground/70 mb-2">
                            <div className="text-foreground/60 mb-1">Self-check questions</div>
                            <ul className="list-disc pl-4 space-y-1">
                              {aiValue.questions.slice(0, 4).map((q) => (
                                <li key={q}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiValue.practiceSuggestions.length > 0 && (
                          <div className="text-xs text-foreground/70">
                            <div className="text-foreground/60 mb-1">Practice suggestions</div>
                            <ul className="list-disc pl-4 space-y-1">
                              {aiValue.practiceSuggestions.slice(0, 4).map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ResourcesLibraryView;
