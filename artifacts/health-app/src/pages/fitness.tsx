import { useState, useRef, useEffect } from "react";
import {
  useGetFitnessSummary, useGetWorkouts, useLogWorkout, useDeleteWorkout,
  useGetSleepLogs, useLogSleep, useGetSteps, useUpdateSteps,
  getGetWorkoutsQueryKey, getGetFitnessSummaryQueryKey, getGetSleepLogsQueryKey, getGetStepsQueryKey
} from "@workspace/api-client-react";
import { searchWorkouts, searchWorkoutHistory, saveWorkoutToHistory, getWorkoutHistory, type WorkoutItem } from "@/lib/workout-database";
import { useLang } from "@/contexts/language-context";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Plus, Timer, Flame, Moon, Zap, Activity, Trash2, Footprints, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";

export default function Fitness() {
  const [date] = useState(new Date().toISOString().split('T')[0]!);
  const { data: summary, isLoading: isLoadingSummary } = useGetFitnessSummary();
  const { data: workouts, isLoading: isLoadingWorkouts } = useGetWorkouts({ date });
  const { data: sleepLogs, isLoading: isLoadingSleep } = useGetSleepLogs({ limit: 7 });
  const { data: stepsData, isLoading: isLoadingSteps } = useGetSteps();
  const deleteWorkout = useDeleteWorkout();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();

  const isLoading = isLoadingSummary || isLoadingWorkouts || isLoadingSleep || isLoadingSteps;

  const handleDelete = (id: number) => {
    deleteWorkout.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWorkoutsQueryKey({ date }) });
        qc.invalidateQueries({ queryKey: getGetFitnessSummaryQueryKey() });
        toast({ title: "Workout removed" });
      }
    });
  };

  if (isLoading || !summary) return <FitnessSkeleton />;

  const todaySleep = sleepLogs?.[0];
  const sleepChartData = [...(sleepLogs || [])].reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString([], { weekday: 'short' }),
    hours: s.durationHours
  }));

  const stepsPct = Math.min(100, Math.round(((stepsData?.todaySteps ?? 0) / (stepsData?.stepGoal ?? 10000)) * 100));

  return (
    <div className="min-h-full bg-background pb-6">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end pt-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight gradient-text">{t("nav_fitness")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 hover-elevate">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("fitness_weekly")}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black">{summary.totalMinutes}</span>
                <span className="text-xs font-medium text-muted-foreground">min</span>
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
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">{summary.avgDuration}<span className="text-sm font-bold ml-0.5">m</span></p>
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
                      <span className="text-[10px] font-bold text-secondary uppercase bg-secondary/10 px-1.5 py-0.5 rounded">{workout.type}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">{workout.intensity}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-black">{workout.durationMinutes} <span className="text-xs font-medium text-muted-foreground font-normal">min</span></p>
                      <p className="text-xs font-bold text-orange-500 flex items-center justify-end gap-0.5 mt-0.5">
                        <Flame className="w-3 h-3" /> {workout.caloriesBurned}
                      </p>
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
                    {todaySleep.quality}
                  </span>
                )}
              </div>

              {todaySleep ? (
                <>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black tracking-tight text-white">{todaySleep.durationHours}</span>
                    <span className="text-sm font-medium text-indigo-200">hours</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                      <span>Deep 25%</span>
                      <span>Light 55%</span>
                      <span>REM 20%</span>
                    </div>
                    <div className="h-2 flex rounded-full overflow-hidden bg-indigo-950/60">
                      <div className="h-full bg-indigo-500" style={{ width: '25%' }} />
                      <div className="h-full bg-indigo-400" style={{ width: '55%' }} />
                      <div className="h-full bg-indigo-300" style={{ width: '20%' }} />
                    </div>
                  </div>
                  {sleepChartData.length > 0 && (
                    <div className="h-16 w-full mt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sleepChartData}>
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.duration || !form.calories) return;
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
        toast({ title: "Workout logged! 💪" });
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
              placeholder="Search or type workout name…"
              className="mt-1"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                    {suggestions.some(s => s.isHistory) ? "Recent & Database" : "Workout Library"}
                  </span>
                  {suggestions.some(s => s.isHistory) && (
                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">🕐 Your History</span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {suggestions.map((w, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => applyWorkoutSuggestion(w)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-xl shrink-0 w-7 text-center">{w.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold truncate">{w.name}</p>
                          {w.isHistory && <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded shrink-0">Recent</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {w.type} · {w.intensity} · {w.durationMinutes}min · {w.caloriesBurned} kcal
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-secondary shrink-0 bg-secondary/10 px-1.5 py-0.5 rounded-full capitalize">{w.type}</span>
                    </button>
                  ))}
                </div>
                <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20">
                  <p className="text-[9px] text-muted-foreground">Tap to auto-fill duration, calories & type</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="yoga">Yoga</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("fitness_intensity")}</Label>
              <Select value={form.intensity} onValueChange={v => setForm(f => ({ ...f, intensity: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t("fitness_duration")}</Label>
              <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t("fitness_est_cal")}</Label>
              <Input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={logWorkout.isPending}>
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const prevDay = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isYest = parseInt(form.bedtime.split(':')[0]!) > 18;
    const btDate = isYest ? prevDay : today;
    
    logSleep.mutate({
      data: {
        bedtime: `${btDate}T${form.bedtime}:00Z`,
        wakeTime: `${today}T${form.wakeTime}:00Z`,
        quality: form.quality as any
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSleepLogsQueryKey() });
        setOpen(false);
        toast({ title: "Sleep logged!" });
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
        <DialogHeader><DialogTitle>{t("fitness_last_sleep")}</DialogTitle></DialogHeader>
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
          <div>
            <Label className="text-xs">{t("fitness_quality")}</Label>
            <Select value={form.quality} onValueChange={v => setForm(f => ({ ...f, quality: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={logSleep.isPending}>
            {logSleep.isPending ? t("fitness_logging") : t("fitness_save_sleep")}
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