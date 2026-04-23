import { useState, useRef, useEffect } from "react";
import {
  useGetFitnessSummary, useGetWorkouts, useLogWorkout, useDeleteWorkout,
  useGetSleepLogs, useLogSleep, useGetSteps, useUpdateSteps,
  getGetWorkoutsQueryKey, getGetFitnessSummaryQueryKey, getGetSleepLogsQueryKey, getGetStepsQueryKey
} from "@workspace/api-client-react";
import { searchWorkouts, searchWorkoutHistory, saveWorkoutToHistory, getWorkoutHistory, type WorkoutItem } from "@/lib/workout-database";
import { useLang } from "@/hooks/use-lang";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Plus, Timer, Flame, Moon, Zap, Activity, Trash2, Footprints, CheckCircle2, AlertTriangle, Ban, Info, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";
import { BrandTag } from "@/components/brand-tag";
import { checkSleepHours, checkWorkoutCalories, checkWorkoutDuration } from "@/lib/logic-validator";
import { LogicBadge, ValidatedValue, FieldError } from "@/components/logic-badge";

const WORKOUT_TYPE_ICONS: Record<string, typeof Dumbbell> = {
  strength: Dumbbell,
  cardio: Activity,
  hiit: Zap,
  yoga: Moon,
  flexibility: Activity,
  other: Dumbbell,
};

export default function Fitness() {
  const [date] = useState(new Date().toISOString().split('T')[0]!);
  const { data: summary, isLoading: isLoadingSummary } = useGetFitnessSummary();
  const { data: workouts, isLoading: isLoadingWorkouts } = useGetWorkouts({ date });
  const { data: sleepLogs, isLoading: isLoadingSleep } = useGetSleepLogs({ limit: 7 });
  const { data: stepsData, isLoading: isLoadingSteps } = useGetSteps();
  const deleteWorkout = useDeleteWorkout();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t, lang } = useLang();

  const typeLabel: Record<string, string> = {
    strength: t("fitness_strength"), cardio: t("fitness_cardio"), hiit: t("fitness_hiit"),
    yoga: t("fitness_yoga"), flexibility: t("fitness_flexibility"), other: t("fitness_other"),
  };
  const intensityLabel: Record<string, string> = {
    low: t("fitness_low"), moderate: t("fitness_moderate"), high: t("fitness_high"),
  };
  const qualityLabel: Record<string, string> = {
    excellent: t("fitness_excellent"), good: t("fitness_good"),
    fair: t("fitness_fair"), poor: t("fitness_poor"),
  };
  const locale = lang === "ar" ? "ar-SA" : "en-US";

  const isLoading = isLoadingSummary || isLoadingWorkouts || isLoadingSleep || isLoadingSteps;

  const handleDelete = (id: number) => {
    deleteWorkout.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWorkoutsQueryKey({ date }) });
        qc.invalidateQueries({ queryKey: getGetFitnessSummaryQueryKey() });
        toast({ title: t("fitness_workout_removed") });
      }
    });
  };

  if (isLoading || !summary) return <FitnessSkeleton />;

  const todaySleep = sleepLogs?.[0];
  const sleepChartData = [...(sleepLogs || [])].reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString(locale, { weekday: 'short' }),
    hours: s.durationHours
  }));

  const stepsPct = Math.min(100, Math.round(((stepsData?.todaySteps ?? 0) / (stepsData?.stepGoal ?? 10000)) * 100));

  return (
    <div className="min-h-full bg-background pb-6">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end pt-2">
          <div>
            <BrandTag className="mb-1" />
            <h1 className="text-2xl font-black tracking-tight gradient-text">{t("nav_fitness")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date().toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 hover-elevate">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("fitness_weekly")}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black">{summary.totalMinutes}</span>
                <span className="text-xs font-medium text-muted-foreground">{t("unit_min")}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-secondary" />
            </div>
          </div>
          
          <div className="h-32 w-full mt-2">
            {summary.weeklyActivity && summary.weeklyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.weeklyActivity}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={5} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px" }} />
                  <Bar dataKey="minutes" fill="hsl(var(--secondary))" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border-t border-dashed">
                {t("fitness_no_activity")}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/20 hover-elevate flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500 shrink-0" />
            <div>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">{summary.totalCaloriesBurned}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70 mt-1">{t("fitness_kcal_burned")}</p>
            </div>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20 hover-elevate flex items-center gap-3">
            <Timer className="w-6 h-6 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">{summary.avgDuration}<span className="text-sm font-bold ms-0.5">{t("unit_min")}</span></p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70 mt-1">{t("fitness_avg_workout")}</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 hover-elevate">
          <div className="flex items-center gap-2 mb-2">
            <Footprints className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("fitness_steps")}</h3>
          </div>
          <div className="flex items-end justify-between mb-2">
            <p className="text-3xl font-black leading-none">{(stepsData?.todaySteps ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground font-medium">/ {(stepsData?.stepGoal ?? 10000).toLocaleString()}</p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${stepsPct}%` }} />
          </div>
        </div>

        {/* Today's Workouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">{t("fitness_todays_workouts")}</h3>
            <LogWorkoutDialog />
          </div>

          {workouts && workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover-elevate group">
                  <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
                    {workout.type === 'cardio' || workout.type === 'hiit' ? (
                      <Zap className="w-5 h-5 text-secondary" />
                    ) : (
                      <Dumbbell className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{workout.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-secondary uppercase bg-secondary/10 px-1.5 py-0.5 rounded">{typeLabel[workout.type] ?? workout.type}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">{intensityLabel[workout.intensity] ?? workout.intensity}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      {(() => {
                        const durCheck = checkWorkoutDuration(workout.durationMinutes);
                        const calCheck = checkWorkoutCalories(workout.caloriesBurned, workout.durationMinutes);
                        return (
                          <>
                            <div className="flex items-center justify-end gap-1">
                              <p className={cn("text-sm font-black", durCheck.status === "invalid" && "text-destructive line-through opacity-60")}>
                                {workout.durationMinutes}
                              </p>
                              <span className="text-xs text-muted-foreground">{t("unit_min")}</span>
                              {durCheck.status !== "ok" && <LogicBadge check={durCheck} compact />}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <p className={cn("text-xs font-bold text-orange-500", calCheck.status === "invalid" && "text-destructive line-through opacity-60")}>
                                {workout.caloriesBurned}
                              </p>
                              {calCheck.status !== "ok" && <LogicBadge check={calCheck} compact />}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button onClick={() => handleDelete(workout.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-card rounded-2xl border border-dashed border-border">
              <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">{t("fitness_no_workouts")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("fitness_no_workouts_hint")}</p>
            </div>
          )}
        </div>

        {/* Sleep Recovery */}
        <div>
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-bold">{t("fitness_recovery")}</h3>
             <LogSleepDialog />
          </div>
          <div className="rounded-2xl p-5 border relative overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500/20">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                    <Moon className="w-5 h-5 text-indigo-300" />
                  </div>
                  <span className="font-bold text-indigo-100">{t("fitness_last_sleep")}</span>
                </div>
                {todaySleep && (
                  <span className={cn("px-2 py-1 rounded-md text-xs font-bold uppercase",
                    todaySleep.quality === 'excellent' ? "bg-emerald-500/30 text-emerald-300" :
                    todaySleep.quality === 'good' ? "bg-sky-500/30 text-sky-300" :
                    todaySleep.quality === 'fair' ? "bg-amber-500/30 text-amber-300" : "bg-rose-500/30 text-rose-300"
                  )}>
                    {qualityLabel[todaySleep.quality] ?? todaySleep.quality}
                  </span>
                )}
              </div>

              {todaySleep ? (
                <>
                  {(() => {
                    const sleepCheck = checkSleepHours(todaySleep.durationHours);
                    const displayHours = (sleepCheck.status === "invalid")
                      ? null
                      : Math.round(todaySleep.durationHours * 10) / 10;

                    return (
                      <>
                        <div className="flex items-baseline gap-2 mb-1">
                          {sleepCheck.status === "invalid" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-4xl font-black tracking-tight text-destructive line-through opacity-50">
                                {todaySleep.durationHours.toFixed(1)}
                              </span>
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 bg-destructive/20 border border-destructive/40 text-destructive text-[10px] font-black px-2 py-1 rounded-lg">
                                  <AlertTriangle className="w-3 h-3" /> {t("fitness_not_logical")}
                                </span>
                                <span className="text-indigo-200 text-[10px]">—</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className={cn(
                                "text-4xl font-black tracking-tight",
                                sleepCheck.status === "warning" ? "text-amber-400" : "text-white"
                              )}>
                                {displayHours}
                              </span>
                              <span className="text-sm font-medium text-indigo-200">{t("fitness_hours")}</span>
                              {sleepCheck.status === "warning" && (
                                <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                  <AlertTriangle className="w-3 h-3" /> {t("fitness_unusual")}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {sleepCheck.status !== "ok" && (
                          <div className={cn(
                            "mb-3 flex items-start gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] font-semibold",
                            sleepCheck.status === "invalid"
                              ? "bg-destructive/15 border-destructive/30 text-destructive"
                              : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                          )}>
                            {sleepCheck.status === "invalid" ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />} <span>{sleepCheck.reason}</span>
                            {sleepCheck.status === "invalid" && (
                              <span className="text-indigo-300/70 ms-1">{t("fitness_fix_hint")}</span>
                            )}
                          </div>
                        )}
                        {sleepCheck.status !== "invalid" && displayHours !== null && (
                          <>
                            <div className="space-y-1.5 mb-4">
                              {(() => {
                                const deepH = todaySleep.deepSleepHours ?? (displayHours * 0.25);
                                const lightH = todaySleep.lightSleepHours ?? (displayHours * 0.55);
                                const remH = todaySleep.remSleepHours ?? (displayHours * 0.20);
                                const deepPct = Math.round((deepH / displayHours) * 100);
                                const lightPct = Math.round((lightH / displayHours) * 100);
                                const remPct = 100 - deepPct - lightPct;
                                return (
                                  <>
                                    <div className="flex justify-between text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                                      <span>{t("fitness_deep")} {deepPct}%</span>
                                      <span>{t("fitness_light")} {lightPct}%</span>
                                      <span>{t("fitness_rem")} {remPct}%</span>
                                    </div>
                                    <div className="h-2 flex rounded-full overflow-hidden bg-indigo-950/60">
                                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${deepPct}%` }} />
                                      <div className="h-full bg-indigo-400 transition-all" style={{ width: `${lightPct}%` }} />
                                      <div className="h-full bg-indigo-300 transition-all" style={{ width: `${remPct}%` }} />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                  {sleepChartData.length > 0 && checkSleepHours(todaySleep.durationHours).status !== "invalid" && (
                    <div className="h-16 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sleepChartData.map(d => ({ ...d, hours: Math.max(0, d.hours) }))}>
                          <Line type="monotone" dataKey="hours" stroke="#a5b4fc" strokeWidth={3} dot={{ r: 3, fill: "#a5b4fc", strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4 pb-2">
                  <p className="text-sm text-indigo-200">{t("fitness_no_sleep")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogWorkoutDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", duration: "", calories: "", type: "strength", intensity: "moderate" });
  const [suggestions, setSuggestions] = useState<(WorkoutItem & { isHistory?: boolean })[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const qc = useQueryClient();
  const { toast } = useToast();
  const logWorkout = useLogWorkout();
  const { t } = useLang();

  const typeLabel: Record<string, string> = {
    strength: t("fitness_strength"), cardio: t("fitness_cardio"), hiit: t("fitness_hiit"),
    yoga: t("fitness_yoga"), flexibility: t("fitness_flexibility"), other: t("fitness_other"),
  };
  const intensityLabel: Record<string, string> = {
    low: t("fitness_low"), moderate: t("fitness_moderate"), high: t("fitness_high"),
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWorkoutNameChange = (value: string) => {
    setForm(f => ({ ...f, name: value }));
    if (value.trim().length >= 1) {
      const historyResults = searchWorkoutHistory(value, 2).map(h => ({ ...h, isHistory: true as const }));
      const dbResults = searchWorkouts(value, 5).filter(d => !historyResults.some(h => h.name.toLowerCase() === d.name.toLowerCase())).map(d => ({ ...d, isHistory: false as const }));
      const merged = [...historyResults, ...dbResults];
      setSuggestions(merged);
      setShowSuggestions(merged.length > 0);
    } else if (value.trim().length === 0) {
      const recent = getWorkoutHistory().slice(0, 4).map(h => ({ ...h, isHistory: true as const }));
      setSuggestions(recent);
      setShowSuggestions(recent.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const applyWorkoutSuggestion = (w: WorkoutItem) => {
    setForm({
      name: w.name,
      type: w.type,
      intensity: w.intensity,
      duration: String(w.durationMinutes),
      calories: String(w.caloriesBurned),
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const typeEmoji: Record<string, string> = {
    strength: "🏋️", cardio: "🏃", hiit: "🔥", yoga: "🧘", flexibility: "🤸", other: "⚡"
  };

  const durFormCheck = checkWorkoutDuration(form.duration ? Number(form.duration) : undefined);
  const calFormCheck = checkWorkoutCalories(
    form.calories ? Number(form.calories) : undefined,
    form.duration ? Number(form.duration) : undefined
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.duration || !form.calories) return;
    if (durFormCheck.status === "invalid" || calFormCheck.status === "invalid") return;
    logWorkout.mutate({
      data: {
        name: form.name,
        type: form.type as any,
        durationMinutes: Number(form.duration),
        caloriesBurned: Number(form.calories),
        intensity: form.intensity as any
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWorkoutsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetFitnessSummaryQueryKey() });
        saveWorkoutToHistory({
          name: form.name,
          emoji: typeEmoji[form.type] ?? "⚡",
          type: form.type as any,
          intensity: form.intensity as any,
          durationMinutes: Number(form.duration),
          caloriesBurned: Number(form.calories),
        });
        setOpen(false);
        toast({ title: t("fitness_workout_logged") });
        setForm({ name: "", duration: "", calories: "", type: "strength", intensity: "moderate" });
        setSuggestions([]);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSuggestions([]); setShowSuggestions(false); setForm({ name: "", duration: "", calories: "", type: "strength", intensity: "moderate" }); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> {t("fitness_add_workout")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] rounded-2xl">
        <DialogHeader><DialogTitle>{t("fitness_log_workout")}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 pt-2">
          {/* Workout Name with autocomplete */}
          <div ref={searchRef} className="relative">
            <Label className="text-xs">{t("fitness_workout_name")}</Label>
            <Input
              value={form.name}
              onChange={e => handleWorkoutNameChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) { setShowSuggestions(true); return; }
                const recent = getWorkoutHistory().slice(0, 4).map(h => ({ ...h, isHistory: true as const }));
                if (recent.length > 0) { setSuggestions(recent); setShowSuggestions(true); }
              }}
              placeholder={t("fitness_search_placeholder")}
              className="mt-1"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                    {suggestions.some(s => s.isHistory) ? t("fitness_recent_db") : t("fitness_workout_library")}
                  </span>
                  {suggestions.some(s => s.isHistory) && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {t("fitness_your_history")}</span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {suggestions.map((w, i) => {
                    const WorkoutIcon = WORKOUT_TYPE_ICONS[w.type] ?? Dumbbell;
                    return (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => applyWorkoutSuggestion(w)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="shrink-0 w-8 h-8 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                          <WorkoutIcon className="w-4 h-4 text-secondary" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold truncate">{w.name}</p>
                            {w.isHistory && <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded shrink-0">{t("fitness_recent")}</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {typeLabel[w.type] ?? w.type} · {intensityLabel[w.intensity] ?? w.intensity} · {w.durationMinutes}{t("unit_min")} · {w.caloriesBurned} {t("unit_kcal")}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-secondary shrink-0 bg-secondary/10 px-1.5 py-0.5 rounded-full capitalize">{typeLabel[w.type] ?? w.type}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20">
                  <p className="text-[9px] text-muted-foreground">{t("fitness_autofill_hint")}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("fitness_type")}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">{t("fitness_strength")}</SelectItem>
                  <SelectItem value="cardio">{t("fitness_cardio")}</SelectItem>
                  <SelectItem value="hiit">{t("fitness_hiit")}</SelectItem>
                  <SelectItem value="yoga">{t("fitness_yoga")}</SelectItem>
                  <SelectItem value="flexibility">{t("fitness_flexibility")}</SelectItem>
                  <SelectItem value="other">{t("fitness_other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("fitness_intensity")}</Label>
              <Select value={form.intensity} onValueChange={v => setForm(f => ({ ...f, intensity: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("fitness_low")}</SelectItem>
                  <SelectItem value="moderate">{t("fitness_moderate")}</SelectItem>
                  <SelectItem value="high">{t("fitness_high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("fitness_duration")}</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className={cn("mt-1", form.duration && durFormCheck.status === "invalid" && "border-destructive")}
              />
              {form.duration && durFormCheck.status !== "ok" && (
                <p className={cn("text-[10px] font-bold mt-1", durFormCheck.status === "invalid" ? "text-destructive" : "text-amber-500")}>
                  {durFormCheck.status === "invalid" ? <Ban className="inline w-3 h-3 me-1" /> : <AlertTriangle className="inline w-3 h-3 me-1" />} {durFormCheck.reason}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs">{t("fitness_est_cal")}</Label>
              <Input
                type="number"
                value={form.calories}
                onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
                className={cn("mt-1",
                  form.calories && calFormCheck.status === "invalid" && "border-destructive",
                  form.calories && calFormCheck.status === "warning" && "border-amber-500"
                )}
              />
              {form.calories && calFormCheck.status !== "ok" && (
                <p className={cn("text-[10px] font-bold mt-1", calFormCheck.status === "invalid" ? "text-destructive" : "text-amber-500")}>
                  {calFormCheck.status === "invalid" ? <Ban className="inline w-3 h-3 me-1" /> : <AlertTriangle className="inline w-3 h-3 me-1" />} {calFormCheck.reason}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={logWorkout.isPending || durFormCheck.status === "invalid" || calFormCheck.status === "invalid"}
          >
            {logWorkout.isPending ? t("fitness_logging") : t("fitness_log_btn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LogSleepDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bedtime: "22:30", wakeTime: "06:30", quality: "good" });
  
  const qc = useQueryClient();
  const { toast } = useToast();
  const logSleep = useLogSleep();
  const { t } = useLang();

  // Live calculation of sleep duration
  const calcPreview = (): { hours: number; isOvernight: boolean } => {
    const [bH, bM] = form.bedtime.split(":").map(Number);
    const [wH, wM] = form.wakeTime.split(":").map(Number);
    const bedMins = (bH ?? 0) * 60 + (bM ?? 0);
    const wakeMins = (wH ?? 0) * 60 + (wM ?? 0);
    let diffMins = wakeMins - bedMins;
    const isOvernight = diffMins <= 0;
    if (isOvernight) diffMins += 24 * 60;
    return { hours: Math.round((diffMins / 60) * 10) / 10, isOvernight };
  };

  const preview = calcPreview();
  const previewCheck = checkSleepHours(preview.hours);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewCheck.status === "invalid") return;

    const today = new Date().toISOString().split('T')[0];
    const prevDay = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const btDate = preview.isOvernight ? prevDay : today;
    
    logSleep.mutate({
      data: {
        bedtime: `${btDate}T${form.bedtime}:00`,
        wakeTime: `${today}T${form.wakeTime}:00`,
        quality: form.quality as any
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSleepLogsQueryKey({ limit: 7 }) });
        qc.invalidateQueries({ queryKey: getGetSleepLogsQueryKey() });
        setOpen(false);
        toast({ title: `${t("fitness_sleep_logged")} — ${preview.hours}${t("unit_hr")}!` });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs font-bold border-border/50">
          <Moon className="w-3.5 h-3.5" /> {t("fitness_log_sleep")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] rounded-2xl">
        <DialogHeader><DialogTitle>{t("fitness_log_sleep")}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("fitness_bedtime")}</Label>
              <Input type="time" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t("fitness_wake")}</Label>
              <Input type="time" value={form.wakeTime} onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))} className="mt-1" />
            </div>
          </div>

          {/* Live preview */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold",
            previewCheck.status === "invalid"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : previewCheck.status === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
              : "bg-primary/8 border-primary/20 text-primary"
          )}>
            <Moon className="w-4 h-4 shrink-0" />
            <span>
              {previewCheck.status === "invalid"
                ? <><AlertTriangle className="inline w-3 h-3 me-1" />{previewCheck.reason}</>
                : <>
                    {preview.hours}{t("unit_hr")} {t("fitness_sleep_label")}
                    {preview.isOvernight && <span className="text-muted-foreground font-normal text-xs ms-1">({t("fitness_overnight")})</span>}
                    {previewCheck.status === "warning" && <span className="text-xs ms-1">— {previewCheck.reason}</span>}
                  </>
              }
            </span>
          </div>

          <div>
            <Label className="text-xs">{t("fitness_quality")}</Label>
            <Select value={form.quality} onValueChange={v => setForm(f => ({ ...f, quality: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="poor">{t("fitness_poor")}</SelectItem>
                <SelectItem value="fair">{t("fitness_fair")}</SelectItem>
                <SelectItem value="good">{t("fitness_good")}</SelectItem>
                <SelectItem value="excellent">{t("fitness_excellent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={logSleep.isPending || previewCheck.status === "invalid"}
          >
            {logSleep.isPending ? t("fitness_logging") : `${t("fitness_save_sleep")} · ${preview.hours}${t("unit_hr")}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FitnessSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-[220px] w-full rounded-2xl shimmer" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl shimmer" />
        <Skeleton className="h-24 rounded-2xl shimmer" />
      </div>
      <Skeleton className="h-[120px] w-full rounded-2xl shimmer" />
      <Skeleton className="h-[250px] w-full rounded-2xl shimmer" />
    </div>
  );
}