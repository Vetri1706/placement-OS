import { motion } from "framer-motion";
import { Flame, Bell, Search, User } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const TopBar = () => {
  const streak = 12;

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex items-center justify-between px-6 py-4"
    >
      {/* LEFT — SEARCH */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search What You Need..."
            className="glass rounded-lg pl-10 pr-4 py-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-64"
          />
        </div>
      </div>

      {/* RIGHT — ACTIONS */}
      <div className="flex items-center gap-5">

        {/* 🔥 STREAK */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 glass rounded-full px-4 py-2"
        >
          <div className="relative">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(225 15% 18%)" strokeWidth="2" />
              <motion.circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="hsl(25 95% 55%)"
                strokeWidth="2"
                strokeDasharray={`${(streak / 30) * 94.2} 94.2`}
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 94.2" }}
                animate={{ strokeDasharray: `${(streak / 30) * 94.2} 94.2` }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </svg>

            <Flame className="w-3.5 h-3.5 text-streak absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <span className="text-sm font-semibold text-gradient-warm">
            {streak} Day Streak
          </span>
        </motion.div>

        {/* 🔔 NOTIFICATIONS */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </motion.button>

        {/* 🌗 THEME TOGGLE — FIXED SIZE */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="glass rounded-full px-3 py-2 flex items-center justify-center"
        >
          <ThemeToggle />
        </motion.div>

        {/* 👤 AVATAR */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 glass rounded-full pl-1 pr-4 py-1 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>

          <span className="text-sm font-medium">Alex</span>
        </motion.div>

      </div>
    </motion.header>
  );
};

export default TopBar;