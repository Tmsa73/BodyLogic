import { useState, useEffect } from "react";
import { useGetDashboard, useGetAiInsights, useGetWaterIntake, useGetSteps, useUpdateSteps, useGetProgress, useGetLifeBalance, useGetNotifications, useMarkNotificationRead, useLogWater, useLogMeal, getGetWaterIntakeQueryKey, getGetDashboardQueryKey, getGetNotificationsQueryKey, getGetNutritionSummaryQueryKey, getGetMealsQueryKey, getGetStepsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Droplets, Footprints, Moon, Flame, Zap, Dumbbell, Utensils, Sparkles, Brain, X, Trophy, Crown, ChevronRight, Coins, Sword, CheckCheck, Star, BedDouble, Activity, Clock } from "lucide-react";
import { Link } from "wouter";
import { getActiveTitle, calcLevel, calcMomentumScore, getStoredTitleId } from "@/lib/gamification";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/hooks/use-lang";
import { MealIqQuiz } from "@/components/meal-iq-quiz";
import { MorningBriefCard } from "@/components/morning-brief-card";
import { playGamificationSound } from "@/lib/sounds";
import { getFoodHistory, saveFoodToHistory, type FoodHistoryItem } from "@/lib/food-database";

export default function Home() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const { data: dashboard, isLoading } = useGetDashboard();
  const { data: insights } = useGetAiInsights();
  const { data: water } = useGetWaterIntake();
  const { data: steps } = useGetSteps();
  const { data: progress } = useGetProgress();
  const { data: balance } = useGetLifeBalance();
  const { data: notifications } = useGetNotifications();
  const markRead = useMarkNotificationRead();
  const logWater = useLogWater();
  const updateSteps = useUpdateSteps();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t, lang } = useLang();

  const logMeal = useLogMeal();
  const [recentFoods] = useState<FoodHistoryItem[]>(() => getFoodHistory().slice(0, 4));
  const [quickLoggedIds, setQuickLoggedIds] = useState<Set<number>>(new Set());
  const [editingSteps, setEditingSteps] = useState(false);
  const [stepsDraft, setStepsDraft] = useState("");

  const commitSteps = () => {
    const raw = stepsDraft.trim();
    if (raw === "") { setEditingSteps(false); return; }
    const val = Number(raw.replace(/[^\d]/g, ""));
    if (!Number.isFinite(val) || val < 0 || val > 200000) {
      toast({ title: t("home_steps_invalid"), variant: "destructive" });
      return;
    }
    updateSteps.mutate(
      { data: { steps: val } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetStepsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast({ title: t("home_steps_saved") });
          setEditingSteps(false);
        },
        onError: () => toast({ title: t("home_steps_failed"), variant: "destructive" }),
      }
    );
  };

  const quickLogFood = (food: FoodHistoryItem, idx: number) => {
    if (quickLoggedIds.has(idx)) return;
    logMeal.mutate({
      data: {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        sugar: food.sugar,
        mealType: food.mealType as any,
      }
    }, {
      onSuccess: () => {
        saveFoodToHistory(food);
        qc.invalidateQueries({ queryKey: getGetNutritionSummaryQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMealsQueryKey({ date: new Date().toISOString().split("T")[0]! }) });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setQuickLoggedIds(prev => new Set([...prev, idx]));
        toast({ title: food.name, description: `${food.calories} ${t("unit_kcal")}` });
        playGamificationSound("xp");
      }
    });
  };

  const [acceptedChallenges] = useState<{id: string; title: string; icon: string; read: boolean}[]>(() => {
    try { return JSON.parse(localStorage.getItem("bodylogic-accepted-challenges") ?? "[]"); } catch { return []; }
  });
  const [localChallengeRead, setLocalChallengeRead] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("bodylogic-challenge-read") ?? "[]")); } catch { return new Set(); }
  });

  const unreadCount = (notifications?.filter(n => !n.read).length ?? 0) + acceptedChallenges.filter(c => !localChallengeRead.has(c.id)).length;

  const addWater = (ml: number) => {
    logWater.mutate({ data: { amountMl: ml } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWaterIntakeQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        toast({ title: `+${ml}${t("home_water_added")}`, description: t("home_water_updated") });
        playGamificationSound("xp");
      }
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(i => i + 1);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !dashboard) return <HomeSkeleton />;

  const levelInfo = progress ? calcLevel(progress.xp) : null;
  const calPct = Math.min(100, Math.round((dashboard.todayCalories / dashboard.calorieGoal) * 100));
  const stepsPct = Math.min(100, Math.round(((steps?.todaySteps ?? dashboard.todaySteps) / (steps?.stepGoal ?? dashboard.stepGoal)) * 100));
  const waterPct = Math.min(100, Math.round(((water?.totalMl ?? dashboard.waterMl) / (water?.goalMl ?? dashboard.waterGoalMl)) * 100));

  const todayMealCount = (dashboard.recentActivity ?? []).filter((a: any) => a.type === "meal").length;
  const inferredMealsToday = todayMealCount > 0
    ? todayMealCount
    : (dashboard.todayCalories >= 1500 ? 3 : dashboard.todayCalories >= 800 ? 2 : dashboard.todayCalories > 0 ? 1 : 0);
  const momentumData = calcMomentumScore({
    currentStreak: progress?.stats?.currentStreak ?? 0,
    totalWorkoutsThisWeek: dashboard.weeklyWorkouts ?? 0,
    mealsLoggedToday: inferredMealsToday,
    waterGoalMet: waterPct >= 100,
    sleepHoursLast: dashboard.lastSleepHours,
    stepsPct,
  });

  const getBalanceGradeColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-destructive";
  };

  const getMealIQColor = (score: number | null | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 22) return "text-primary";
    if (score >= 16) return "text-yellow-400";
    if (score >= 10) return "text-orange-400";
    return "text-destructive";
  };

  const getMealIQGrade = (score: number | null | undefined) => {
    if (!score) return "N/A";
    if (score >= 25) return "A+";
    if (score >= 22) return "A";
    if (score >= 19) return "B+";
    if (score >= 16) return "B";
    if (score >= 13) return "C+";
    return "C";
  };

  const tips = insights?.tips ?? [];
  const tip = tips.length > 0 ? tips[tipIndex % tips.length] : null;
  const tipColors: Record<string, string> = {
    nutrition: "from-primary/20 to-primary/5 border-primary/30",
    fitness: "from-secondary/20 to-secondary/5 border-secondary/30",
    sleep: "from-accent/20 to-accent/5 border-accent/30",
    water: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    general: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
  };
  const tipIconColors: Record<string, string> = {
    nutrition: "text-primary", fitness: "text-secondary", sleep: "text-accent", water: "text-blue-400", general: "text-yellow-400"
  };

  const circumference = 2 * Math.PI * 45;
  const activeTitle = progress ? getActiveTitle(progress.level, getStoredTitleId()) : null;
  const streak = progress?.stats?.currentStreak ?? 0;

  const pillars = [
    { label: t("home_meal"), score: calPct, color: "bg-primary", icon: Utensils },
    { label: t("nav_fitness"), score: stepsPct, color: "bg-secondary", icon: Dumbbell },
    { label: t("home_sleep_label"), score: Math.min(100, Math.round((dashboard.lastSleepHours / 8) * 100)), color: "bg-accent", icon: Moon },
    { label: t("home_water_label"), score: waterPct, color: "bg-blue-400", icon: Droplets },
    { label: t("home_habit"), score: Math.min(100, Math.round((streak / 7) * 100)), color: "bg-yellow-400", icon: Flame },
  ];

  // Overall score = average of the visible pillars so the number always matches what the user sees
  const balanceScore = Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);
  const strokeDashoffset = circumference - (balanceScore / 100) * circumference;

  const getPillarTag = (s: number) =>
    s >= 70 ? { label: t("grade_pro"), key: "Pro", cls: "text-primary" } :
    s >= 40 ? { label: t("grade_good"), key: "Good", cls: "text-yellow-400" } :
    { label: t("grade_low"), key: "Low", cls: "text-muted-foreground" };

  const gradeKey = balanceScore >= 75 ? "Pro" : balanceScore >= 40 ? "Good" : "Low";
  const gradeLevel = gradeKey === "Pro" ? t("grade_pro") : gradeKey === "Good" ? t("grade_good") : t("grade_low");
  const gradeStyle: Record<string, string> = {
    "Pro": "bg-primary/15 text-primary border-primary/30",
    "Good": "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
    "Low": "bg-muted/50 text-muted-foreground border-border/30",
  };

  const streakPts = streak >= 7 ? 30 : streak >= 3 ? 20 : streak >= 1 ? 10 : 0;
  const weeklyWk = dashboard.weeklyWorkouts ?? 0;
  const workoutPts = weeklyWk >= 5 ? 25 : weeklyWk >= 3 ? 15 : weeklyWk >= 1 ? 8 : 0;
  const stepsFitnessPts = Math.round((stepsPct / 100) * 25);
  const fitnessPts = Math.max(workoutPts, stepsFitnessPts);
  const mealPts = inferredMealsToday >= 3 ? 20 : inferredMealsToday >= 2 ? 12 : inferredMealsToday >= 1 ? 5 : 0;
  const waterPts = waterPct >= 100 ? 15 : Math.round((waterPct / 100) * 15);
  const sleepPts = dashboard.lastSleepHours >= 7 ? 10 : dashboard.lastSleepHours >= 6 ? 5 : 0;
  const factors = [
    { label: t("home_streak_short"), pts: streakPts, max: 30, icon: Flame, color: "bg-orange-400" },
    { label: t("nav_fitness"), pts: fitnessPts, max: 25, icon: Dumbbell, color: "bg-secondary" },
    { label: t("home_meal"), pts: mealPts, max: 20, icon: Utensils, color: "bg-primary" },
    { label: t("home_water_label"), pts: waterPts, max: 15, icon: Droplets, color: "bg-blue-400" },
    { label: t("home_sleep_label"), pts: sleepPts, max: 10, icon: Moon, color: "bg-accent" },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Notification Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-[88%] max-w-[360px] bg-card border-l border-border/50 z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-gradient-to-r from-card to-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-black text-sm leading-tight">{t("home_notifications")}</h2>
                    <p className="text-[10px] text-primary font-bold mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} ${t("home_unread")}` : t("home_all_caught")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notification list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {(!notifications?.length && !acceptedChallenges.length) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-muted/40 flex items-center justify-center mb-4">
                      <Bell className="w-7 h-7 opacity-20" />
                    </div>
                    <p className="font-black text-sm">{t("home_no_notif")}</p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-70">{t("home_no_notif_sub")}</p>
                  </div>
                ) : (
                  <>
                    {/* Challenge notifications */}
                    {acceptedChallenges.map(c => {
                      const isRead = localChallengeRead.has(c.id);
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          onClick={() => {
                            const next = new Set(localChallengeRead);
                            next.add(c.id);
                            setLocalChallengeRead(next);
                            try { localStorage.setItem("bodylogic-challenge-read", JSON.stringify([...next])); } catch {}
                          }}
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.98]",
                            isRead
                              ? "bg-muted/15 border-border/20 opacity-50"
                              : "bg-destructive/8 border-destructive/20 hover:bg-destructive/12"
                          )}
                        >
                          <div className="w-10 h-10 rounded-2xl bg-destructive/12 border border-destructive/20 flex items-center justify-center shrink-0 text-lg">
                            {c.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-sm font-black truncate">{t("home_challenge_accepted")}</p>
                              {!isRead && <div className="w-2 h-2 rounded-full bg-destructive shrink-0 animate-pulse" />}
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                              "{c.title}" {t("home_challenge_active")}
                            </p>
                            <span className="inline-flex mt-1.5 items-center gap-1 bg-destructive/10 text-destructive text-[9px] font-black px-1.5 py-0.5 rounded-full border border-destructive/20">
                              <Sword className="w-2.5 h-2.5" /> BOSS CHALLENGE
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* API notifications */}
                    {notifications?.map((n, i) => {
                      type NotifType = "water" | "meal" | "workout" | "achievement" | "sleep" | "system";
                      const typeConfig: Record<NotifType, { icon: typeof Bell; bg: string; iconColor: string; border: string; badge: string; badgeCls: string; dot: string }> = {
                        water:       { icon: Droplets,  bg: "bg-blue-500/8",    iconColor: "text-blue-400",   border: "border-blue-400/20",   badge: "HYDRATION",   badgeCls: "bg-blue-400/10 text-blue-400 border-blue-400/20",   dot: "bg-blue-400" },
                        meal:        { icon: Utensils,  bg: "bg-primary/8",     iconColor: "text-primary",    border: "border-primary/20",    badge: "NUTRITION",   badgeCls: "bg-primary/10 text-primary border-primary/20",       dot: "bg-primary" },
                        workout:     { icon: Dumbbell,  bg: "bg-orange-400/8",  iconColor: "text-orange-400", border: "border-orange-400/20", badge: "FITNESS",     badgeCls: "bg-orange-400/10 text-orange-400 border-orange-400/20", dot: "bg-orange-400" },
                        achievement: { icon: Trophy,    bg: "bg-yellow-400/8",  iconColor: "text-yellow-400", border: "border-yellow-400/20", badge: "ACHIEVEMENT", badgeCls: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", dot: "bg-yellow-400" },
                        sleep:       { icon: BedDouble, bg: "bg-accent/8",      iconColor: "text-accent",     border: "border-accent/20",     badge: "SLEEP",       badgeCls: "bg-accent/10 text-accent border-accent/20",           dot: "bg-accent" },
                        system:      { icon: Activity,  bg: "bg-secondary/8",   iconColor: "text-secondary",  border: "border-secondary/20",  badge: "SYSTEM",      badgeCls: "bg-secondary/10 text-secondary border-secondary/20",   dot: "bg-secondary" },
                      };
                      const cfg = typeConfig[n.type as NotifType] ?? typeConfig.system;
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => { if (!n.read) { markRead.mutate({ id: n.id }); qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }); } }}
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.98]",
                            n.read
                              ? "bg-muted/15 border-border/20 opacity-50"
                              : cn("hover:opacity-90", cfg.bg, cfg.border)
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                            n.read ? "bg-muted/30 border-border/20" : cn(cfg.bg, cfg.border)
                          )}>
                            <Icon className={cn("w-4.5 h-4.5", n.read ? "text-muted-foreground/50" : cfg.iconColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className={cn("text-sm font-black leading-tight truncate", n.read && "text-muted-foreground")}>{n.title}</p>
                              {!n.read && <div className={cn("w-2 h-2 rounded-full shrink-0 animate-pulse", cfg.dot)} />}
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{n.message}</p>
                            <span className={cn("inline-flex mt-1.5 items-center text-[9px] font-black px-1.5 py-0.5 rounded-full border", cfg.badgeCls)}>
                              {cfg.badge}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Mark all read footer */}
              {(notifications?.some(n => !n.read) || acceptedChallenges.some(c => !localChallengeRead.has(c.id))) && (
                <div className="p-4 border-t border-border/40 bg-card">
                  <button
                    onClick={() => {
                      notifications?.filter(n => !n.read).forEach(n => { markRead.mutate({ id: n.id }); });
                      qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
                      const allIds = acceptedChallenges.map(c => c.id);
                      const next = new Set(allIds);
                      setLocalChallengeRead(next);
                      try { localStorage.setItem("bodylogic-challenge-read", JSON.stringify(allIds)); } catch {}
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/15 text-xs font-bold text-primary transition-colors active:scale-[0.98]"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {t("home_mark_all_read")}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="p-5 pb-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <img src="/bodylogic-logo.png" alt="BodyLogic" className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            <span className="font-black text-lg gradient-text">BodyLogic</span>
          </div>
          <div className="flex items-center gap-2">
            {progress && levelInfo && (
              <Link href="/achievements" className="press-scale">
                <div className="relative w-10 h-10">
                  <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke="url(#xpGrad)" strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 16}
                      strokeDashoffset={(2 * Math.PI * 16) * (1 - levelInfo.progressPct / 100)}
                      className="transition-all duration-1000" />
                    <defs>
                      <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#EF4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-yellow-400 leading-none">{progress.level}</span>
                  </div>
                </div>
              </Link>
            )}
            <button onClick={() => setNotifOpen(true)} className="relative p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors press-scale">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">{(() => {
            const h = new Date().getHours();
            if (h < 12) return t("home_greeting_morning");
            if (h < 18) return t("home_greeting_afternoon");
            return t("home_greeting_evening");
          })()} 👋</h1>
          {activeTitle && (
            <p className={cn("text-sm font-bold mt-0.5", activeTitle.color)}>{activeTitle.name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{t("home_snapshot")}</p>
        </div>

        {/* Morning Brief */}
        <MorningBriefCard />

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-1 bg-card rounded-2xl p-3 border border-border/50 hover-elevate">
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-lg font-black text-foreground leading-none">{dashboard.todayCalories}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("home_kcal")}</p>
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${calPct}%` }} />
            </div>
          </div>
          <div className="col-span-1 bg-card rounded-2xl p-3 border border-border/50 relative">
            <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center mb-2">
              <Footprints className="w-4 h-4 text-secondary" />
            </div>
            {editingSteps ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={200000}
                  autoFocus
                  value={stepsDraft}
                  onChange={(e) => setStepsDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitSteps(); }
                    else if (e.key === "Escape") { setEditingSteps(false); }
                  }}
                  onBlur={() => { if (!updateSteps.isPending) commitSteps(); }}
                  className="w-full bg-transparent text-lg font-black leading-none outline-none border-b border-secondary text-foreground p-0"
                  aria-label={t("home_steps_edit")}
                  data-testid="input-steps"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const cur = steps?.todaySteps ?? dashboard.todaySteps ?? 0;
                  setStepsDraft(String(cur || ""));
                  setEditingSteps(true);
                }}
                className="text-left w-full press-scale"
                aria-label={t("home_steps_edit")}
                data-testid="button-edit-steps"
              >
                <p className="text-lg font-black leading-none">{(steps?.todaySteps ?? dashboard.todaySteps).toLocaleString()}</p>
              </button>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("home_steps")}</p>
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${stepsPct}%` }} />
            </div>
          </div>
          <div className="col-span-1 bg-card rounded-2xl p-3 border border-border/50 hover-elevate">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center mb-2">
              <Droplets className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-lg font-black leading-none">{((water?.totalMl ?? dashboard.waterMl) / 1000).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("home_water")}</p>
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${waterPct}%` }} />
            </div>
          </div>
          <div className="col-span-1 bg-card rounded-2xl p-3 border border-border/50 hover-elevate">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center mb-2">
              <Moon className="w-4 h-4 text-accent" />
            </div>
            <p className="text-lg font-black leading-none">{dashboard.lastSleepHours.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("home_sleep")}</p>
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(100, (dashboard.lastSleepHours / 8) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Life Balance + Momentum Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Life Balance */}
          <div className="bg-card rounded-2xl p-4 border border-border/50 hover-elevate">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-foreground uppercase tracking-wider">{t("home_life_balance")}</span>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border", gradeStyle[gradeKey])}>
                {gradeLevel}
              </span>
            </div>
            <div className="flex items-center justify-center py-1">
              <svg width="76" height="76" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
                <circle cx="50" cy="50" r="45" fill="none"
                  stroke={gradeKey === "Pro" ? "hsl(var(--primary))" : gradeKey === "Good" ? "#eab308" : "hsl(var(--muted-foreground))"}
                  strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform="rotate(-90 50 50)" className="transition-all duration-1000" />
                <text x="50" y="47" textAnchor="middle" style={{ fill: "hsl(var(--foreground))", fontSize: "20px", fontWeight: "900" }}>{balanceScore}</text>
                <text x="50" y="62" textAnchor="middle" style={{ fill: "hsl(var(--muted-foreground))", fontSize: "9px", fontWeight: "700" }}>/ 100</text>
              </svg>
            </div>
            <div className="space-y-1.5 mt-2">
              {pillars.map(p => {
                const tag = getPillarTag(p.score);
                const PIcon = p.icon;
                return (
                  <div key={p.label} className="flex items-center gap-1.5">
                    <PIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-[9px] text-muted-foreground w-8 shrink-0 truncate">{p.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", p.color)} style={{ width: `${p.score}%` }} />
                    </div>
                    <span className={cn("text-[9px] font-black w-6 text-right shrink-0", tag.cls)}>{tag.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Momentum */}
          <div className="bg-card rounded-2xl p-4 border border-border/50 hover-elevate">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-foreground uppercase tracking-wider">{t("home_momentum")}</span>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border",
                momentumData.label === "Pro" ? "bg-primary/15 text-primary border-primary/30" :
                momentumData.label === "Good" ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30" :
                "bg-muted/50 text-muted-foreground border-border/30"
              )}>
                {momentumData.label === "Pro" ? t("grade_pro") : momentumData.label === "Good" ? t("grade_good") : t("grade_low")}
              </span>
            </div>
            <div className="flex items-center justify-center py-1">
              <svg width="76" height="76" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
                <circle cx="50" cy="50" r="45" fill="none"
                  stroke={momentumData.label === "Pro" ? "hsl(var(--primary))" : momentumData.label === "Good" ? "#eab308" : "hsl(var(--muted-foreground))"}
                  strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (momentumData.score / 100) * circumference}
                  transform="rotate(-90 50 50)" className="transition-all duration-1000" />
                <text x="50" y="47" textAnchor="middle" style={{ fill: "hsl(var(--foreground))", fontSize: "20px", fontWeight: "900" }}>{momentumData.score}</text>
                <text x="50" y="62" textAnchor="middle" style={{ fill: "hsl(var(--muted-foreground))", fontSize: "9px", fontWeight: "700" }}>/ 100</text>
              </svg>
            </div>
            <div className="space-y-1.5 mt-2">
              {factors.map(f => {
                const pct = Math.round((f.pts / f.max) * 100);
                const ftag = pct >= 70 ? { label: t("grade_pro"), cls: "text-primary" } : pct >= 40 ? { label: t("grade_good"), cls: "text-yellow-400" } : { label: t("grade_low"), cls: "text-muted-foreground" };
                const FIcon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-1.5">
                    <FIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-[9px] text-muted-foreground w-9 shrink-0 truncate">{f.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", f.color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={cn("text-[9px] font-black w-6 text-right shrink-0", ftag.cls)}>{ftag.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* XP + Coins Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/15 via-orange-500/10 to-yellow-500/15 border border-yellow-500/20 p-4">
          <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-400/10 rounded-full -translate-y-6 translate-x-6 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black text-yellow-500 dark:text-yellow-400 uppercase tracking-wider bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 rounded-md shrink-0">
                  {t("home_level_short") !== "home_level_short" ? t("home_level_short") : "LV"} {progress?.level ?? dashboard.level}
                </span>
                <p className="text-xs font-bold text-foreground truncate">
                  {lang === "ar" ? (activeTitle?.nameAr ?? progress?.title ?? activeTitle?.name ?? t("home_achiever")) : (progress?.title ?? activeTitle?.name ?? t("home_achiever"))}
                </p>
              </div>
              <Link href="/achievements" className="shrink-0">
                <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 px-2 py-1 rounded-full press-scale">
                  <Trophy className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                  <ChevronRight className="w-3 h-3 text-yellow-500 dark:text-yellow-400 rtl-flip" />
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                <span className="text-sm font-black text-yellow-600 dark:text-yellow-400">{(progress?.xp ?? dashboard.xp).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-yellow-600/70 dark:text-yellow-400/70 uppercase">{t("unit_xp")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                <span className="text-sm font-black text-yellow-600 dark:text-yellow-400">{progress?.coins ?? dashboard.coins}</span>
                <span className="text-[10px] font-bold text-yellow-600/70 dark:text-yellow-400/70 uppercase">{t("home_coins")}</span>
              </div>
            </div>
            <div className="h-1.5 bg-yellow-500/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo?.progressPct ?? 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Quick Add Water */}
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold">{t("home_quick_water")}</span>
            </div>
            <span className="text-xs text-muted-foreground">{(water?.totalMl ?? dashboard.waterMl).toLocaleString()}ml · {water?.glasses ?? Math.floor(dashboard.waterMl / 250)} {t("home_glasses")} · {waterPct}%</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[150, 250, 330, 500].map(ml => (
              <button key={ml} onClick={() => addWater(ml)} className="py-2.5 px-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold transition-all press-scale active:scale-95">
                +{ml}ml
              </button>
            ))}
          </div>
          {waterPct < 100 && (
            <p className="text-[10px] text-blue-400/70 mt-2 text-center">
              {((water?.goalMl ?? dashboard.waterGoalMl) - (water?.totalMl ?? dashboard.waterMl)).toLocaleString()} {t("home_remaining")}
            </p>
          )}
        </div>

        {/* Meal IQ + AI Tip Row */}
        <div className="grid grid-cols-2 gap-3">
          <MealIqQuiz score={dashboard.mealIqScore}>
            <button className="bg-card rounded-2xl p-4 border border-border/50 hover-elevate text-left press-scale w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("home_meal_iq")}</span>
              </div>
              <p className={cn("text-4xl font-black leading-none", getMealIQColor(dashboard.mealIqScore))}>
                {dashboard.mealIqScore ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("home_max_score")}</p>
              <div className={cn("mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold", getMealIQColor(dashboard.mealIqScore) === "text-primary" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                {t("home_grade_label")}: {getMealIQGrade(dashboard.mealIqScore)}
              </div>
            </button>
          </MealIqQuiz>

          <div className={cn("rounded-2xl p-4 border bg-gradient-to-br hover-elevate", tipColors[tip?.category ?? "general"] ?? tipColors.general)}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className={cn("w-4 h-4", tipIconColors[tip?.category ?? "general"])} />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("home_ai_tip")}</span>
            </div>
            <p className="text-xs font-bold text-foreground leading-snug line-clamp-3">{tip?.title ?? t("home_tip_fallback")}</p>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{tip?.description ?? t("home_tip_desc_fallback")}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("home_quick_log")}</h2>
          <div className="grid grid-cols-4 gap-2">
            <Link href="/nutrition" className="flex flex-col items-center gap-2 p-3 bg-primary/10 rounded-2xl border border-primary/20 press-scale hover:bg-primary/15 transition-colors">
              <Utensils className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-bold text-primary">{t("home_meal")}</span>
            </Link>
            <Link href="/fitness" className="flex flex-col items-center gap-2 p-3 bg-secondary/10 rounded-2xl border border-secondary/20 press-scale hover:bg-secondary/15 transition-colors">
              <Dumbbell className="w-5 h-5 text-secondary" />
              <span className="text-[10px] font-bold text-secondary">{t("home_workout")}</span>
            </Link>
            <button onClick={() => addWater(250)} className="flex flex-col items-center gap-2 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 press-scale hover:bg-blue-500/15 transition-colors">
              <Droplets className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400">{t("home_water_label")}</span>
            </button>
            <Link href="/fitness" className="flex flex-col items-center gap-2 p-3 bg-accent/10 rounded-2xl border border-accent/20 press-scale hover:bg-accent/15 transition-colors">
              <Moon className="w-5 h-5 text-accent" />
              <span className="text-[10px] font-bold text-accent">{t("home_sleep_label")}</span>
            </Link>
          </div>
        </div>

        {/* Recent Foods Quick Log */}
        {recentFoods.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {t("home_log_again")}</span>
              <Link href="/nutrition" className="text-[10px] font-bold text-primary">{t("home_all_meals_link")} →</Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {recentFoods.map((food, idx) => {
                const logged = quickLoggedIds.has(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => quickLogFood(food, idx)}
                    disabled={logged || logMeal.isPending}
                    className={cn(
                      "shrink-0 flex flex-col items-start gap-1 px-3 py-2.5 rounded-2xl border text-left transition-all press-scale min-w-[120px] max-w-[140px]",
                      logged
                        ? "bg-primary/10 border-primary/30 opacity-80"
                        : "bg-card border-border/50 hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <Utensils className="w-4 h-4 text-primary" />
                      {logged && <span className="text-[9px] font-black text-primary ml-auto inline-flex items-center gap-1"><CheckCheck className="w-3 h-3" /> {t("home_done_check")}</span>}
                    </div>
                    <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">{food.name}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{food.calories} {t("unit_kcal")}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Streak — improved UI */}
        {progress && (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-400/15 border border-orange-400/20 flex items-center justify-center">
                  <Flame className="w-4.5 h-4.5 text-orange-400" />
                </div>
                <div>
                  <p className="font-black text-sm leading-tight">{t("home_streak")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("home_streak_sub")}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5 bg-orange-400/12 border border-orange-400/20 px-3 py-1.5 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm font-black text-orange-400">{progress.stats?.currentStreak ?? 0}</span>
                  <span className="text-xs text-orange-400/70 font-semibold">{t("home_streak_days")}</span>
                </div>
                {(progress.stats?.longestStreak ?? 0) > 0 && (
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    {t("home_streak_best")}: {progress.stats?.longestStreak ?? 0}d
                  </span>
                )}
              </div>
            </div>

            {/* Calendar grid */}
            <div className="px-4 py-3">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const activityDates = new Set(
                  (dashboard.recentActivity ?? []).map((a: any) => {
                    const d = new Date(a.date ?? a.createdAt ?? "");
                    d.setHours(0, 0, 0, 0);
                    return d.getTime();
                  })
                );
                const currentStreak = progress.stats?.currentStreak ?? 0;
                const days = Array.from({ length: 35 }, (_, i) => {
                  const d = new Date(today);
                  d.setDate(today.getDate() - (34 - i));
                  const daysAgo = 34 - i;
                  const inStreak = daysAgo < currentStreak;
                  const hasActivity = activityDates.has(d.getTime()) || inStreak;
                  const isToday = daysAgo === 0;
                  const isFuture = daysAgo < 0;
                  return { date: d, hasActivity, inStreak, isToday, isFuture };
                });
                const weeks: typeof days[] = [];
                for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
                const locale = lang === "ar" ? "ar-SA" : "en-US";
                const dayLabels = Array.from({ length: 7 }, (_, i) =>
                  new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 7 + i))
                );
                const monthNames = Array.from({ length: 12 }, (_, i) =>
                  new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2024, i, 1))
                );
                return (
                  <div>
                    <div className="grid grid-cols-7 gap-1 mb-1.5">
                      {dayLabels.map((d, i) => (
                        <div key={i} className="text-center text-[9px] font-bold text-muted-foreground/50 uppercase">{d}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-1">
                          {week.map((day, di) => (
                            <div
                              key={di}
                              className={cn(
                                "relative flex flex-col items-center justify-center rounded-lg transition-all h-8",
                                day.isToday && "ring-2 ring-orange-400 ring-offset-1 ring-offset-card",
                                day.hasActivity && !day.isFuture
                                  ? "bg-gradient-to-br from-orange-400 to-orange-500 shadow-sm"
                                  : "bg-muted/25 border border-border/15"
                              )}
                            >
                              <span className={cn(
                                "text-[9px] font-black leading-none",
                                day.hasActivity && !day.isFuture ? "text-white" : "text-muted-foreground/50"
                              )}>
                                {day.date.getDate()}
                              </span>
                              {day.isToday && (
                                <div className={cn("w-1 h-1 rounded-full mt-0.5", day.hasActivity ? "bg-white/80" : "bg-orange-400")} />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/20">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {monthNames[new Date(today.getFullYear(), today.getMonth() - 1).getMonth()]} — {monthNames[today.getMonth()]}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-md bg-gradient-to-br from-orange-400 to-orange-500 shadow-sm" />
                          <span className="text-[9px] text-muted-foreground font-semibold">{t("home_streak_active")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-md bg-muted/25 border border-border/15" />
                          <span className="text-[9px] text-muted-foreground font-semibold">{t("home_streak_rest")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* AI Behavior Analysis */}
        {insights?.behaviorAnalysis && (
          <div className="bg-gradient-to-br from-secondary/10 to-accent/5 rounded-2xl p-4 border border-secondary/20">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-secondary" />
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">{t("home_ai_analysis")}</span>
            </div>
            <div className="space-y-2">
              {insights.behaviorAnalysis
                .split(/(?<=[.!?])\s+/)
                .filter((s: string) => s.trim().length > 5)
                .slice(0, 3)
                .map((sentence: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                    <p className="text-xs font-semibold text-foreground/80 leading-snug">{sentence.trim()}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {dashboard.recentActivity.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("home_recent")}</h2>
              <Link href="/history" className="text-xs text-primary font-semibold">{t("home_view_all")}</Link>
            </div>
            <div className="space-y-2">
              {dashboard.recentActivity.slice(0, 4).map((item) => {
                const iconMap: Record<string, typeof Utensils> = { meal: Utensils, workout: Dumbbell, sleep: Moon, water: Droplets, steps: Footprints };
                const colorMap: Record<string, string> = { meal: "text-primary bg-primary/10", workout: "text-secondary bg-secondary/10", sleep: "text-accent bg-accent/10", water: "text-blue-400 bg-blue-400/10", steps: "text-yellow-400 bg-yellow-400/10" };
                const Icon = iconMap[item.type] ?? Utensils;
                const colors = colorMap[item.type] ?? colorMap.meal;
                const time = new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover-elevate">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", colors)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="p-5 space-y-5 animate-pulse">
      <div className="flex items-center justify-between pt-2">
        <div className="h-8 w-32 bg-muted rounded-xl" />
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-muted rounded-xl" />
          <div className="h-10 w-10 bg-muted rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-xl" />
        <div className="h-3 w-64 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    </div>
  );
}
