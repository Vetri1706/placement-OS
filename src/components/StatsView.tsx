import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import { Flame, Clock, Target, TrendingUp } from "lucide-react";

const weeklyData = [
  { day: "Mon", hours: 3.5 },
  { day: "Tue", hours: 5.2 },
  { day: "Wed", hours: 4.1 },
  { day: "Thu", hours: 6.0 },
  { day: "Fri", hours: 2.8 },
  { day: "Sat", hours: 7.5 },
  { day: "Sun", hours: 4.5 },
];

const monthlyData = [
  { week: "W1", problems: 18 },
  { week: "W2", problems: 24 },
  { week: "W3", problems: 15 },
  { week: "W4", problems: 32 },
];

const StatsView = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Your Stats</h2>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Flame, label: "Current Streak", value: "12 days", color: "hsl(25 95% 55%)" },
          { icon: Clock, label: "Total Study Time", value: "86 hours", color: "hsl(200 100% 55%)" },
          { icon: Target, label: "Problems Solved", value: "247", color: "hsl(170 80% 50%)" },
          { icon: TrendingUp, label: "Weekly Average", value: "4.8h/day", color: "hsl(260 60% 60%)" },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-5" delay={i * 0.05}>
            <stat.icon className="w-5 h-5 mb-3" style={{ color: stat.color }} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-7 p-6" delay={0.2} hover={false}>
          <h3 className="text-lg font-semibold mb-4">Study Hours This Week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(225 20% 12% / 0.9)",
                  border: "1px solid hsl(0 0% 100% / 0.1)",
                  borderRadius: "8px",
                  backdropFilter: "blur(12px)",
                  color: "hsl(210 40% 96%)",
                }}
              />
              <Bar dataKey="hours" fill="hsl(200 100% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="col-span-5 p-6" delay={0.3} hover={false}>
          <h3 className="text-lg font-semibold mb-4">Problems Solved</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(225 20% 12% / 0.9)",
                  border: "1px solid hsl(0 0% 100% / 0.1)",
                  borderRadius: "8px",
                  backdropFilter: "blur(12px)",
                  color: "hsl(210 40% 96%)",
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(170 80% 50%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(170 80% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="problems" stroke="hsl(170 80% 50%)" fill="url(#gradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default StatsView;
