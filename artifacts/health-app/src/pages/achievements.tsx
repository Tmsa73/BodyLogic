import { useState } from "react";
import { useLang } from "@/hooks/use-lang";
import { useGetProgress, useGetProfileStats, useGetMissions } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap, Lock, CheckCircle2, Flame, Crown, Target, Shield, Brain, Sword, TrendingUp, Coins, Utensils, Dumbbell, Moon, Heart, Bot, Droplets, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandTag } from "@/components/brand-tag";
import { motion } from "framer-motion";
import {
  ALL_ACHIEVEMENTS,
  ALL_TITLES,
  TIER_CONFIG,
  CATEGORY_CONFIG,
  DAILY_MISSIONS,
  WEEKLY_MISSIONS,
  SMART_MISSIONS,
  BOSS_CHALLENGES,
  calcGamificationStats,
  getUnlockedAchievements,
  getActiveTitle,
  calcLevel,
  type AchievementCategory,
  type BadgeTier,
} from "@/lib/gamification";

type Tab = "achievements" | "titles" | "missions" | "bosses";
type MissionTab = "daily" | "weekly" | "smart";

const CATEGORY_TABS: { key: AchievementCategory | "all"; labelKey: string; icon: string }[] = [
  { key: "all", labelKey: "rewards_cat_all", icon: "🏆" },
  { key: "nutrition", labelKey: "rewards_cat_meals", icon: "🥗" },
  { key: "fitness", labelKey: "rewards_cat_fitness", icon: "💪" },
  { key: "ai", labelKey: "rewards_cat_ai", icon: "🤖" },
  { key: "milestones", labelKey: "rewards_cat_milestones", icon: "📈" },
  { key: "elite", labelKey: "rewards_cat_elite", icon: "👑" },
  { key: "lifestyle", labelKey: "rewards_cat_lifestyle", icon: "🌿" },
];

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", color: "text-primary bg-primary/15 border-primary/30" },
  medium: { label: "Medium", color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" },
  hard: { label: "Hard", color: "text-destructive bg-destructive/15 border-destructive/30" },
  legendary: { label: "Nightmare", color: "text-primary bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/40" },
};

export default function Achievements() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>("achievements");
  const [catFilter, setCatFilter] = useState<AchievementCategory | "all">("all");
  const [tierFilter, setTierFilter] = useState<BadgeTier | "all">("all");
  const [missionTab, setMissionTab] = useState<MissionTab>("daily");

  const { data: progress, isLoading: progLoading } = useGetProgress();
  const { data: stats, isLoading: statsLoading } = useGetProfileStats();
  const { data: serverMissions } = useGetMissions();

  const isLoading = progLoading || statsLoading;

  if (isLoading || !progress || !stats) return <AchievementsSkeleton />;

  const gamStats = calcGamificationStats({
    totalMeals: stats.totalMealsLogged,
    totalWorkouts: stats.totalWorkouts,
    totalSleepLogs: 0,
    totalWaterDays: 0,
    level: progress.level,
    totalXP: progress.xp,
    longestStreak: progress.stats?.longestStreak ?? 0,
    currentStreak: progress.stats?.currentStreak ?? 0,
    aiMessages: 0,
    daysActive: stats.totalWorkouts,
  });

  const unlocked = getUnlockedAchievements(gamStats);
  const unlockedIds = new Set(unlocked.map(a => a.id));
  const activeTitle = getActiveTitle(progress.level);
  const levelInfo = calcLevel(progress.xp);

  const filteredAchievements = ALL_ACHIEVEMENTS.filter(a => {
    const catOk = catFilter === "all" || a.category === catFilter;
    const tierOk = tierFilter === "all" || a.tier === tierFilter;
    return catOk && tierOk;
  });

  const unlockedCount = unlocked.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const completionPct = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="min-h-full bg-background pb-24">
      <div className="p-5 space-y-5">
        <BrandTag className="pt-2" />

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/30 p-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -translate-y-12 translate-x-12 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full translate-y-8 -translate-x-8 blur-2xl" />
          <div className="flex items-center gap-4 relative">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg glow-primary">
                <Crown className="w-8 h-8 text-background" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-background border-2 border-primary rounded-full px-1.5 py-0.5">
                <span className="text-[11px] font-black text-primary leading-none">{progress.level}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-base font-black", activeTitle.color)}>{lang === "ar" ? (activeTitle.nameAr ?? activeTitle.name) : activeTitle.name}</p>
              <p className="text-xs text-muted-foreground mb-2 truncate">{lang === "ar" ? (activeTitle.descAr ?? activeTitle.description) : activeTitle.description}</p>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progressPct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-bold text-primary">{progress.xp.toLocaleString()} {t("unit_xp")}</span>
                <span className="text-[10px] text-muted-foreground">{levelInfo.xpToNext.toLocaleString()} to Lv {progress.level + 1}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: t("rewards_unlocked"), value: unlockedCount, icon: CheckCircle2, color: "text-primary" },
              { label: "Total", value: totalCount, icon: Trophy, color: "text-secondary" },
              { label: "Coins", value: progress.coins, icon: Coins, color: "text-yellow-400" },
              { label: "Complete", value: `${completionPct}%`, icon: TrendingUp, color: "text-orange-400" },
            ].map(s => (
              <div key={s.label} className="bg-background/50 rounded-xl p-2 text-center border border-border/30">
                <s.icon className={cn("w-3.5 h-3.5 mx-auto mb-1", s.color)} />
                <div className="text-sm font-black">{s.value}</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Completion bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Overall completion</span>
              <span className="font-bold text-primary">{completionPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-secondary to-yellow-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl">
          {([
            { key: "achievements", label: "Badges", icon: Trophy },
            { key: "titles", label: "Titles", icon: Crown },
            { key: "missions", label: "Missions", icon: Target },
            { key: "bosses", label: "Boss", icon: Flame },
          ] as { key: Tab; label: string; icon: typeof Trophy }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-bold transition-all",
                tab === t.key ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ACHIEVEMENTS TAB ── */}
        {tab === "achievements" && (
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {CATEGORY_TABS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCatFilter(c.key as AchievementCategory | "all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all",
                    catFilter === c.key ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground border border-border/40"
                  )}
                >
                  {c.icon} {t(c.labelKey as any)}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setTierFilter("all")}
                className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap", tierFilter === "all" ? "bg-muted text-foreground" : "text-muted-foreground")}
              >
                All Tiers
              </button>
              {(["bronze", "silver", "gold", "platinum", "legendary"] as BadgeTier[]).map(tier => {
                const cfg = TIER_CONFIG[tier];
                return (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all", tierFilter === tier ? `${cfg.bg} ${cfg.border} ${cfg.textColor}` : "bg-muted/40 text-muted-foreground border-transparent")}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold">{filteredAchievements.filter(a => unlockedIds.has(a.id)).length} / {filteredAchievements.length} unlocked</span>
              <span>{Math.round((filteredAchievements.filter(a => unlockedIds.has(a.id)).length / Math.max(1, filteredAchievements.length)) * 100)}% complete</span>
            </div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredAchievements.map((achievement, i) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                const cfg = TIER_CONFIG[achievement.tier];
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className={cn(
                      "relative rounded-2xl p-4 border transition-all",
                      isUnlocked ? `${cfg.bg} ${cfg.border}` : "bg-muted/20 border-border/20 opacity-55"
                    )}
                  >
                    {isUnlocked && (
                      <>
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className={cn("w-3.5 h-3.5", cfg.textColor)} />
                        </div>
                        {achievement.tier === "legendary" && (
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
                        )}
                      </>
                    )}
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="text-3xl mb-2 leading-none">{achievement.icon}</div>
                    <p className={cn("text-xs font-black leading-tight mb-1", isUnlocked ? "text-foreground" : "text-muted-foreground")}>{lang === "ar" ? (achievement.nameAr ?? achievement.name) : achievement.name}</p>
                    <p className="text-[10px] text-muted-foreground/80 leading-tight mb-2">{lang === "ar" ? (achievement.descAr ?? achievement.description) : achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[9px] font-black uppercase tracking-wider", cfg.textColor)}>{cfg.label}</span>
                      <span className="text-[9px] font-bold text-yellow-400">+{achievement.xpReward} {t("unit_xp")}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TITLES TAB ── */}
        {tab === "titles" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{t("rewards_tap_equip")}. {t("rewards_active_label")}: <span className={cn("font-bold", activeTitle.color)}>{lang === "ar" ? (activeTitle.nameAr ?? activeTitle.name) : activeTitle.name}</span></p>
            {ALL_TITLES.map(title => {
              const titleName = lang === "ar" ? (title.nameAr ?? title.name) : title.name;
              const titleDescription = lang === "ar" ? (title.descAr ?? title.description) : title.description;
              const isUnlocked = progress.level >= title.minLevel;
              const isActive = title.id === activeTitle.id;
              return (
                <motion.div
                  key={title.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                    isActive ? "bg-primary/10 border-primary/40" : isUnlocked ? "bg-card border-border/40" : "bg-muted/20 border-border/20 opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isUnlocked ? "bg-gradient-to-br from-primary/20 to-secondary/20" : "bg-muted/40"
                  )}>
                    {CATEGORY_CONFIG[title.category] ? (
                      <span className="text-xl">{CATEGORY_CONFIG[title.category].icon}</span>
                    ) : <Crown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-black", isUnlocked ? title.color : "text-muted-foreground", title.glow && isUnlocked && "drop-shadow-[0_0_8px_currentColor]")}>{titleName}</p>
                      {isActive && <span className="text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{t("rewards_active_label")}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{titleDescription}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-muted-foreground/40" />
                        <div className="text-xs font-bold text-muted-foreground">Lv{title.minLevel}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── MISSIONS TAB ── */}
        {tab === "missions" && (
          <div className="space-y-5">
            {/* Mission Sub-tabs */}
            <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl">
              {([
                { key: "daily", label: t("mission_daily"), icon: Zap },
                { key: "weekly", label: t("mission_weekly"), icon: Shield },
                { key: "smart", label: t("mission_personal"), icon: Brain },
              ] as { key: MissionTab; label: string; icon: typeof Zap }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMissionTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all",
                    missionTab === tab.key ? "bg-background shadow text-primary" : "text-muted-foreground"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {missionTab === "daily" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black">{t("mission_daily")}</h3>
                  <span className="text-xs text-muted-foreground ml-auto">Resets midnight</span>
                </div>
                {DAILY_MISSIONS.map(m => {
                  const serverMission = serverMissions?.find(sm => sm.title === m.title);
                  const completed = serverMission?.completed ?? false;
                  const progress_ = serverMission?.progress ?? 0;
                  const target = serverMission?.target ?? 1;
                  const pct = Math.min(100, Math.round((progress_ / target) * 100));
                  return (
                    <div
                      key={m.id}
                      className={cn("flex items-center gap-3 p-3.5 rounded-xl border transition-all", completed ? "bg-primary/10 border-primary/30" : "bg-card border-border/30")}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0", completed ? "bg-primary/20" : "bg-muted/50")}>
                        {m.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-sm font-bold", completed && "line-through text-muted-foreground")}>{lang === "ar" ? (m.titleAr ?? m.title) : m.title}</p>
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <span className="text-xs font-bold text-yellow-400 shrink-0">+{m.xp} {t("unit_xp")}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5">{lang === "ar" ? (m.descAr ?? m.description) : m.description}</p>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-700", completed ? "bg-primary" : "bg-secondary")} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {missionTab === "weekly" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-secondary" />
                  <h3 className="text-sm font-black">{t("mission_weekly")}</h3>
                  <span className="text-xs text-muted-foreground ml-auto">Resets Monday</span>
                </div>
                {WEEKLY_MISSIONS.map(m => {
                  const serverMission = serverMissions?.find(sm => sm.type === "weekly");
                  const completed = serverMission?.completed ?? false;
                  return (
                    <div key={m.id} className={cn("flex items-center gap-3 p-3.5 rounded-xl border transition-all", completed ? "bg-secondary/10 border-secondary/30" : "bg-card border-border/30")}>
                      <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-xl shrink-0">{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">{lang === "ar" ? (m.titleAr ?? m.title) : m.title}</p>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-yellow-400">+{m.xp} {t("unit_xp")}</span>
                            <span className="text-[10px] text-muted-foreground ml-1 inline-flex items-center gap-1">+{m.coins}<Coins className="w-3 h-3 text-yellow-400" /></span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? (m.descAr ?? m.description) : m.description}</p>
                        <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: completed ? "100%" : "30%" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {missionTab === "smart" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-primary" />
                    <p className="text-sm font-black text-primary">{t("rewards_personal_title")}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("mission_personal_desc")}</p>
                </div>
                {SMART_MISSIONS.map(m => {
                  const diff = m.difficulty ?? "easy";
                  const diffCfg = DIFFICULTY_CONFIG[diff];
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-card border border-border/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0">
                          <MissionIcon icon={m.icon} className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-black">{lang === "ar" ? (m.titleAr ?? m.title) : m.title}</p>
                            <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full border", diffCfg.color)}>{diffCfg.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{lang === "ar" ? (m.descAr ?? m.description) : m.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-yellow-400">+{m.xp} {t("unit_xp")}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">+{m.coins}<Coins className="w-3 h-3 text-yellow-400" /></span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BOSS CHALLENGES TAB ── */}
        {tab === "bosses" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-destructive/15 to-orange-900/10 border border-destructive/30">
              <div className="flex items-center gap-2 mb-1.5">
                <Sword className="w-5 h-5 text-destructive" />
                <h3 className="text-base font-black text-destructive">{t("rewards_boss_title")}</h3>
                <span className="ml-auto text-[10px] font-black bg-destructive/15 text-destructive px-2 py-0.5 rounded-full border border-destructive/30">{BOSS_CHALLENGES.length} {t("rewards_bosses_count")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("rewards_boss_desc")}</p>
            </div>

            {BOSS_CHALLENGES.map((boss, i) => {
              const diffCfg = DIFFICULTY_CONFIG[boss.difficulty as keyof typeof DIFFICULTY_CONFIG];
              return (
                <motion.div
                  key={boss.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="relative overflow-hidden rounded-2xl p-4 border border-destructive/25 bg-gradient-to-br from-destructive/5 via-background to-orange-900/5"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full -translate-y-6 translate-x-6 blur-xl" />
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{boss.icon}</div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border", diffCfg.color)}>
                        {diffCfg.label.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{boss.days} {t("rewards_days")}</span>
                    </div>
                  </div>
                  <h4 className="text-base font-black mb-1">{lang === "ar" ? (boss.titleAr ?? boss.title) : boss.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{lang === "ar" ? (boss.descAr ?? boss.description) : boss.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-yellow-400">+{boss.xp} {t("unit_xp")}</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">+{boss.coins}<Coins className="w-3.5 h-3.5 text-yellow-400" /></span>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-destructive/15 text-destructive text-xs font-black border border-destructive/30 hover:bg-destructive/25 transition-colors press-scale">
                      {t("challenge_accept")}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MissionIcon({ icon, className }: { icon: string; className?: string }) {
  const iconMap: Record<string, typeof Target> = {
    nutrition: Utensils,
    fitness: Dumbbell,
    sleep: Moon,
    heart: Heart,
    ai: Bot,
    target: Target,
    water: Droplets,
    sun: Sun,
  };
  const Icon = iconMap[icon] ?? Target;
  return <Icon className={className} />;
}

function AchievementsSkeleton() {
  return (
    <div className="p-5 space-y-5 pb-24">
      <div className="pt-2">
        <Skeleton className="h-7 w-40 shimmer" />
        <Skeleton className="h-3 w-56 mt-1 shimmer" />
      </div>
      <Skeleton className="h-52 w-full rounded-3xl shimmer" />
      <Skeleton className="h-14 w-full rounded-xl shimmer" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-2xl shimmer" />)}
      </div>
    </div>
  );
}
