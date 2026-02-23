import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { FileText, Play, BookOpen, Star, Search } from "lucide-react";

const resources = [
  { title: "React Hooks Complete Guide", type: "video", tags: ["#React", "#Hooks"], rating: 4.8, image: "hsl(200 100% 55% / 0.15)" },
  { title: "Data Structures & Algorithms", type: "pdf", tags: ["#Algorithms", "#DSA"], rating: 4.9, image: "hsl(260 60% 60% / 0.15)" },
  { title: "System Design Interview", type: "pdf", tags: ["#SystemDesign"], rating: 4.7, image: "hsl(170 80% 50% / 0.15)" },
  { title: "Machine Learning Basics", type: "video", tags: ["#ML", "#Python"], rating: 4.6, image: "hsl(25 95% 55% / 0.15)" },
  { title: "JavaScript ES2024 Features", type: "pdf", tags: ["#JavaScript"], rating: 4.5, image: "hsl(200 100% 55% / 0.15)" },
  { title: "Database Optimization", type: "video", tags: ["#SQL", "#Performance"], rating: 4.8, image: "hsl(260 60% 60% / 0.15)" },
  { title: "TypeScript Advanced Patterns", type: "pdf", tags: ["#TypeScript"], rating: 4.9, image: "hsl(170 80% 50% / 0.15)" },
  { title: "Cloud Architecture 101", type: "video", tags: ["#AWS", "#Cloud"], rating: 4.4, image: "hsl(25 95% 55% / 0.15)" },
];

const ResourcesLibraryView = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Resources Library</h2>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources..."
            className="glass rounded-lg pl-10 pr-4 py-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-64"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["All", "Videos", "PDFs", "Courses"].map((tab, i) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              i === 0 ? "neon-button text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      <div className="columns-2 lg:columns-3 gap-4 space-y-4">
        {resources.map((res, i) => (
          <GlassCard key={i} className="break-inside-avoid p-0 overflow-hidden" delay={i * 0.05}>
            <div className="h-32 flex items-center justify-center" style={{ background: res.image }}>
              {res.type === "video" ? <Play className="w-10 h-10 text-foreground/40" /> : <BookOpen className="w-10 h-10 text-foreground/40" />}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1 mb-2">
                {res.type === "video" ? <Play className="w-3 h-3 text-primary" /> : <FileText className="w-3 h-3 text-secondary" />}
                <span className="text-xs text-muted-foreground uppercase">{res.type}</span>
              </div>
              <h4 className="text-sm font-semibold mb-2">{res.title}</h4>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3 h-3 text-streak fill-streak" />
                <span className="text-xs text-muted-foreground">{res.rating}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {res.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full glass text-primary/80">{tag}</span>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
};

export default ResourcesLibraryView;
