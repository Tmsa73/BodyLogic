import { useState, useMemo } from "react";
import { useGetHistory, useGetSleepLogs, GetHistoryType } from "@workspace/api-client-react";
import { useLang } from "@/contexts/language-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Dumbbell, Moon, Footprints, Droplets, TrendingUp, Calendar, ChevronDown, ChevronUp, BedDouble } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type DayRange = 7 | 30 | 90;

const TYPE_CONFIG = {
  meal: { icon: Utensils, label: "Meal", color: "bg-primary", glow: "glow-primary", textColor: "text-primary", border: "border-primary/30" },
  workout: { icon: Dumbbell, label: "Workout", color: "bg-secondary", glow: "glow-secondary", textColor: "text-secondary", border: "border-secondary/30" },
  sleep: { icon: Moon, label: "Sleep", color: "bg-purple-500", glow: "", textColor: "text-purple-400", border: "border-purple-500/30" },
  water: { icon: Droplets, label: "Water", color: "bg-blue-500", glow: "", textColor: "text-blue-400", border: "border-blue-500/30" },
};

export default function History() {
  const [filter, setFilter] = useState<GetHistoryType>("all");
  const [days, setDays] = useState<DayRange>(7);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: history, isLoading } = useGetHistory({ type: filter, limit: 100, days });
  const { data: sleepLogs } = useGetSleepLogs({ limit: 30 });
  const { t } = useLang();

  const stats = useMemo(() => {
    if (!history) return { meals: 0, workouts: 0, sleep: 0, total: 0 };
    return {
      meals: history.filter(h => h.type === "meal").length,
      workouts: history.filter(h => h.type === "workout").length,
      sleep: history.filter(h => h.type === "sleep").length,
      total: history.length,
    };
  }, [history]);

  const chartData = useMemo(() => {
    if (!history) return [];
    const map: Record<string, { date: string; count: number; meal: number; workout: number; sleep: number }> = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString([], { month: "short", day: "numeric" });
      map[key] = { date: key, count: 0, meal: 0, workout: 0, sleep: 0 };
    }
    history.forEach(h => {
      const key = new Date(h.date).toLocaleDateString([], { month: "short", day: "numeric" });
      if (map[key]) {
        map[key].count++;
        if (h.type === "meal") map[key].meal++;
        if (h.type === "workout") map[key].workout++;
        if (h.type === "sleep") map[key].sleep++;
      }
    });
    return Object.values(map);
  }, [history, days]);

  const sleepChartData = useMemo(() => {
    const result: { day: string; hours: number | null; quality: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = i === 0 ? t("history_today").slice(0, 3) : d.toLocaleDateString([], { weekday: "short" });
      const log = sleepLogs?.find(s => s.date === dateStr);
      result.push({ day: dayLabel, hours: log ? Math.round(log.durationHours * 10) / 10 : 0, quality: log?.quality ?? "" });
    }
    return result;
  }, [sleepLogs, t]);

  const sleepAvg = useMemo(() => {
    const logged = sleepChartData.filter(d => (d.hours ?? 0) > 0);
    if (!logged.length) return 0;
    return Math.round((logged.reduce((acc, d) => acc + (d.hours ?? 0), 0) / logged.length) * 10) / 10;
  }, [sleepChartData]);

  const grouped = useMemo(() => {
    if (!history) return [];
    const groups: Record<string, typeof history> = {};
    history.forEach(h => {
      const d = new Date(h.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let label: string;
      if (d.toDateString() === today.toDateString()) label = t("history_today");
      else if (d.toDateString() === yesterday.toDateString()) label = t("history_yesterday");
      else label = d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
      if (!groups[label]) groups[label] = [];
      groups[label].push(h);
    });
    return Object.entries(groups);
  }, [history, t]);

  return (
    <div className="min-h-full bg-background pb-24">
      <div className="p-5 space-y-5">
        <header className="pt-2 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight gradient-text">{t("nav_history")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t("history_journey")}</p>
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
            {([7, 30, 90] as DayRange[]).map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all",
                  days === d ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d}D
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("history_meals"), count: stats.meals, icon: Utensils, color: "text-primary", bg: "bg-primary/10" },
            { label: t("history_workouts"), count: stats.workouts, icon: Dumbbell, color: "text-secondary", bg: "bg-secondary/10" },
            { label: t("history_sleep"), count: stats.sleep, icon: Moon, color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map(s => (
            <div key={s.label} className={cn("rounded-2xl p-3 border border-border/40 flex flex-col gap-1", s.bg)}>
              <s.icon className={cn("w-4 h-4", s.color)} />
              <div className="text-2xl font-black">{s.count}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── 7-Day Sleep Trend Chart ── */}
        <motion.div
          className="rounded-2xl bg-card border border-purple-500/20 overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <BedDouble className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground uppercase tracking-wider">{t("sleep_trend_title")}</p>
                <p className="text-[9px] text-muted-foreground font-medium">{t("history_sleep")} · {t("rewards_progress")}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-purple-400">{sleepAvg > 0 ? `${sleepAvg}h` : "—"}</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase">{t("sleep_trend_avg")}</div>
            </div>
          </div>

          {/* Zone legend */}
          <div className="px-4 pb-2 flex items-center gap-3">
            {[
              { color: "bg-red-500", label: "< 6h" },
              { color: "bg-amber-400", label: "6–7h" },
              { color: "bg-emerald-500", label: "7–9h" },
              { color: "bg-blue-500", label: "> 9h" },
            ].map(z => (
              <div key={z.label} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", z.color)} />
                <span className="text-[9px] text-muted-foreground font-bold">{z.label}</span>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="h-44 px-2 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepChartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.3} strokeDasharray="4 3" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                />
                <YAxis
                  domain={[0, 12]}
                  ticks={[0, 3, 6, 9, 12]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={v => v === 0 ? "" : `${v}h`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", radius: 6, opacity: 0.5 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as { day: string; hours: number; quality: string };
                    if (!d.hours) return null;
                    const qualityColor = d.quality === "excellent" ? "text-emerald-400" : d.quality === "good" ? "text-emerald-500" : d.quality === "fair" ? "text-amber-400" : "text-red-400";
                    const qualityLabel = d.quality === "excellent" ? t("fitness_excellent") : d.quality === "good" ? t("fitness_good") : d.quality === "fair" ? t("fitness_fair") : d.quality === "poor" ? t("fitness_poor") : "";
                    return (
                      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
                        <p className="font-black text-foreground">{d.day}</p>
                        <p className="font-bold text-purple-400">{d.hours}h {t("history_sleep")}</p>
                        {qualityLabel && <p className={cn("font-bold text-[10px]", qualityColor)}>{qualityLabel}</p>}
                      </div>
                    );
                  }}
                />
                {/* Reference lines */}
                <ReferenceLine y={7} stroke="rgba(16,185,129,0.35)" strokeDasharray="6 3" strokeWidth={1.5} />
                <ReferenceLine y={9} stroke="rgba(59,130,246,0.30)" strokeDasharray="6 3" strokeWidth={1.5} />
                <ReferenceLine y={6} stroke="rgba(239,68,68,0.30)" strokeDasharray="6 3" strokeWidth={1.5} />
                <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={32}>
                  {sleepChartData.map((entry, index) => {
                    const h = entry.hours ?? 0;
                    const fill = h === 0
                      ? "hsl(var(--muted))"
                      : h < 6 ? "#ef4444"
                      : h < 7 ? "#f59e0b"
                      : h <= 9 ? "#10b981"
                      : "#3b82f6";
                    return <Cell key={index} fill={fill} fillOpacity={h === 0 ? 0.25 : 0.85} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day-by-day quality row */}
          <div className="px-4 pb-4 grid grid-cols-7 gap-1">
            {sleepChartData.map((d, i) => {
              const qualityDot = d.quality === "excellent" ? "bg-emerald-400" : d.quality === "good" ? "bg-emerald-500" : d.quality === "fair" ? "bg-amber-400" : d.quality === "poor" ? "bg-red-500" : "bg-muted-foreground/20";
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", qualityDot)} />
                  <span className="text-[8px] text-muted-foreground font-bold">{d.hours ? `${d.hours}h` : "—"}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {chartData.some(d => d.count > 0) && (
          <div className="rounded-2xl bg-card border border-border/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("history_activity")}</span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={days === 7 ? 0 : days === 30 ? 4 : 14} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "11px", padding: "6px 10px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 2" }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {(["all", "meal", "workout", "sleep"] as GetHistoryType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all press-scale",
                filter === f
                  ? f === "all" ? "bg-primary text-primary-foreground glow-primary"
                    : f === "meal" ? "bg-primary text-primary-foreground"
                    : f === "workout" ? "bg-secondary text-secondary-foreground"
                    : "bg-purple-500 text-white"
                  : "bg-muted/60 text-muted-foreground border border-border/40"
              )}
            >
              {f === "all" ? t("history_all") : f === "meal" ? `🍽 ${t("history_meals")}` : f === "workout" ? `💪 ${t("history_workouts")}` : `😴 ${t("history_sleep")}`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <HistorySkeleton />
        ) : !history || history.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">{t("history_no_records")}</p>
            <p className="text-xs text-muted-foreground/70">{t("history_no_records_hint")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([dayLabel, entries]) => (
              <div key={dayLabel}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{dayLabel}</span>
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] font-bold text-muted-foreground/60">{entries.length}</span>
                </div>
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const cfg = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.meal;
                    const isExpanded = expandedId === entry.id;
                    const timeStr = new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    const hasExtra = entry.metadata && Object.keys(entry.metadata).length > 0;

                    return (
                      <div
                        key={entry.id}
                        className={cn("rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden transition-all", isExpanded && "border-border/60")}
                        onClick={() => hasExtra && setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <div className="flex items-center gap-3 p-3.5">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.color, cfg.glow)}>
                            <cfg.icon className="w-4.5 h-4.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm leading-tight truncate">{entry.title}</h3>
                            <p className="text-xs text-muted-foreground font-medium truncate">{entry.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-muted-foreground">{timeStr}</span>
                            {hasExtra && (isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />)}
                          </div>
                        </div>
                        {isExpanded && hasExtra && (
                          <div className={cn("px-4 pb-4 pt-1 border-t border-border/30 flex flex-wrap gap-3")}>
                            {Object.entries(entry.metadata!).map(([k, v]) => (
                              <div key={k} className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{k}</span>
                                <span className={cn("text-sm font-bold", cfg.textColor)}>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl shimmer" />
      ))}
    </div>
  );
}
