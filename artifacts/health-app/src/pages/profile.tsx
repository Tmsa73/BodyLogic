import { useEffect, useState, useRef, useMemo } from "react";
import {
  useGetProfile, useGetProfileStats, useUpdateProfile, useGetProgress,
  useGetMissions, useGetLifeBalance, getGetProfileQueryKey,
  useGetHistory, useGetSleepLogs, GetHistoryType, useGetBodyMeasurements,
  useCreateBodyMeasurement, getGetBodyMeasurementsQueryKey,
} from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import {
  User, Trophy, Settings, Edit2, Check, X, Moon, Flame, Zap,
  CheckCircle2, Dumbbell, Utensils, Crown, Activity, Calendar, Award,
  Target, Lock, TrendingUp, TrendingDown, Minus,
  Bot, Palette, Bell, Shield, Info, Globe, Volume2, Download,
  Trash2, Brain, Heart, AlertTriangle, ChevronRight, ChevronDown, ChevronUp, Sword, Lightbulb,
  Sun, Monitor, Camera, Coins, Ruler, Weight, Droplets, Clock, Percent, Plus, Save,
} from "lucide-react";
import {
  ALL_ACHIEVEMENTS, ALL_TITLES, TIER_CONFIG, CATEGORY_CONFIG,
  DAILY_MISSIONS, WEEKLY_MISSIONS, SMART_MISSIONS, BOSS_CHALLENGES,
  calcGamificationStats, getUnlockedAchievements, getActiveTitle, calcLevel,
  getStoredTitleId, setStoredTitleId,
  type AchievementCategory, type BadgeTier,
} from "@/lib/gamification";
import { UpdateProfileBodyGoal, UpdateProfileBodyActivityLevel } from "@workspace/api-client-react/src/generated/api.schemas";
import { cn } from "@/lib/utils";
import { exportAllDataCsv } from "@/lib/export-data";
import { BrandTag } from "@/components/brand-tag";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/hooks/use-lang";
import { areSoundEffectsEnabled, playGamificationSound, setSoundEffectsEnabled } from "@/lib/sounds";

// ── Types ──────────────────────────────────────────────────────────
type ProfileTab = "me" | "rewards" | "history" | "settings";
type RewardsTab = "achievements" | "titles" | "missions" | "bosses";
type MissionTab = "daily" | "weekly" | "smart";
type AiPersonality = "motivator" | "friendly" | "strict" | "silent" | "custom";
type DietType = "none" | "vegetarian" | "vegan" | "keto" | "pescatarian" | "paleo" | "mediterranean" | "custom";
type HealthCondition = "diabetes" | "heart" | "hypertension" | "obesity" | "allergies" | "thyroid" | "asthma" | "none" | "custom";
type Language = "en" | "ar";

// ── Config ─────────────────────────────────────────────────────────
const LIFE_BALANCE_ITEMS = [
  { id: "nutrition", labelKey: "lb_meals" as const, color: "bg-primary", icon: Utensils, iconColor: "text-primary" },
  { id: "fitness", labelKey: "lb_fit" as const, color: "bg-secondary", icon: Dumbbell, iconColor: "text-secondary" },
  { id: "sleep", labelKey: "lb_sleep" as const, color: "bg-accent", icon: Moon, iconColor: "text-accent" },
  { id: "hydration", labelKey: "lb_water" as const, color: "bg-blue-400", icon: Droplets, iconColor: "text-blue-400" },
  { id: "consistency", labelKey: "lb_habit" as const, color: "bg-yellow-400", icon: Flame, iconColor: "text-yellow-500" },
];

const CATEGORY_TABS: { key: AchievementCategory | "all"; labelKey: string; icon: string }[] = [
  { key: "all", labelKey: "rewards_cat_all", icon: "🏆" },
  { key: "nutrition", labelKey: "rewards_cat_meals", icon: "🥗" },
  { key: "fitness", labelKey: "rewards_cat_fitness", icon: "💪" },
  { key: "ai", labelKey: "rewards_cat_ai", icon: "🤖" },
  { key: "milestones", labelKey: "rewards_cat_xp", icon: "📈" },
  { key: "elite", labelKey: "rewards_cat_elite", icon: "👑" },
];

const DIFFICULTY_CONFIG = {
  easy: { labelKey: "rewards_easy", color: "text-primary bg-primary/15 border-primary/30" },
  medium: { labelKey: "rewards_medium", color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" },
  hard: { labelKey: "rewards_hard", color: "text-destructive bg-destructive/15 border-destructive/30" },
  legendary: { labelKey: "difficulty_nightmare", color: "text-primary bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/40" },
};

const AI_PERSONALITIES: { value: AiPersonality; labelKey: string; emoji: string; descKey: string; color: string }[] = [
  { value: "motivator", labelKey: "ai_personality_motivator", emoji: "🔥", descKey: "settings_motivator_desc", color: "border-orange-500 bg-orange-500/10 text-orange-400" },
  { value: "friendly", labelKey: "ai_personality_friendly", emoji: "😊", descKey: "settings_friendly_desc", color: "border-primary bg-primary/10 text-primary" },
  { value: "strict", labelKey: "ai_personality_strict", emoji: "💪", descKey: "settings_strict_desc", color: "border-destructive bg-destructive/10 text-destructive" },
  { value: "silent", labelKey: "ai_personality_silent", emoji: "🧘", descKey: "settings_silent_desc", color: "border-secondary bg-secondary/10 text-secondary" },
  { value: "custom", labelKey: "ai_personality_custom", emoji: "✍️", descKey: "settings_silent_desc", color: "border-accent bg-accent/10 text-accent" },
];

const DIET_OPTIONS: { value: DietType; labelKey: string; icon: string }[] = [
  { value: "none", labelKey: "diet_none", icon: "🍽️" },
  { value: "vegetarian", labelKey: "diet_vegetarian", icon: "🥦" },
  { value: "vegan", labelKey: "diet_vegan", icon: "🌿" },
  { value: "keto", labelKey: "diet_keto", icon: "🥑" },
  { value: "pescatarian", labelKey: "diet_pescatarian", icon: "🐟" },
  { value: "paleo", labelKey: "diet_paleo", icon: "🍖" },
  { value: "mediterranean", labelKey: "diet_mediterranean", icon: "🫒" },
  { value: "custom", labelKey: "diet_custom", icon: "✍️" },
];

const HEALTH_CONDITIONS: { value: HealthCondition; labelKey: string; icon: string }[] = [
  { value: "diabetes", labelKey: "health_diabetes", icon: "🩺" },
  { value: "heart", labelKey: "health_heart", icon: "❤️" },
  { value: "hypertension", labelKey: "health_hypertension", icon: "🫀" },
  { value: "obesity", labelKey: "health_obesity", icon: "⚖️" },
  { value: "allergies", labelKey: "health_allergies", icon: "🚫" },
  { value: "thyroid", labelKey: "health_thyroid", icon: "🦋" },
  { value: "asthma", labelKey: "health_asthma", icon: "💨" },
  { value: "none", labelKey: "health_none", icon: "✅" },
  { value: "custom", labelKey: "ai_personality_custom", icon: "✍️" },
];

const PROFILE_BANNERS = [
  { id: "starter",  name: "Starter",        emoji: "🌱", gradient: "from-slate-700/60 to-slate-900/60",                               unlocksAt: 0  },
  { id: "rising",   name: "Rising Star",    emoji: "⭐", gradient: "from-primary/50 to-secondary/40",                                  unlocksAt: 3  },
  { id: "warrior",  name: "Health Warrior", emoji: "⚔️", gradient: "from-orange-500/50 to-red-600/40",                                unlocksAt: 6  },
  { id: "champion", name: "Champion",       emoji: "🏆", gradient: "from-yellow-400/50 to-amber-600/40",                              unlocksAt: 9  },
  { id: "legend",   name: "Legend",         emoji: "👑", gradient: "from-purple-500/50 to-violet-700/40",                             unlocksAt: 12 },
  { id: "immortal", name: "Immortal",       emoji: "💎", gradient: "from-primary/60 via-secondary/40 to-accent/40",                   unlocksAt: 15 },
];

const THEME_OPTIONS = [
  { value: "dark", labelKey: "settings_dark", icon: Moon, preview: "bg-slate-900" },
  { value: "light", labelKey: "settings_light", icon: Sun, preview: "bg-green-50" },
  { value: "system", labelKey: "settings_system", icon: Monitor, preview: "bg-gradient-to-br from-slate-900 to-green-50" },
];

// ── Main Component ────────────────────────────────────────────────
export default function Profile() {
  const [tab, setTab] = useState<ProfileTab>("me");
  const { data: profile, isLoading: pLoad } = useGetProfile();
  const { data: stats, isLoading: sLoad } = useGetProfileStats();
  const { data: progress, isLoading: prLoad } = useGetProgress();
  const { data: missions, isLoading: mLoad } = useGetMissions();
  const { data: balance, isLoading: bLoad } = useGetLifeBalance();
  const { user } = useAuth();
  const { t } = useLang();

  const isLoading = pLoad || sLoad || prLoad || mLoad || bLoad;

  useEffect(() => {
    if (!progress) return;
    const previousLevel = Number(localStorage.getItem("bodylogic-last-level") || progress.level);
    if (progress.level > previousLevel) playGamificationSound("level");
    localStorage.setItem("bodylogic-last-level", String(progress.level));
    const earnedCount = progress.badges?.filter((b: any) => b.earned).length ?? 0;
    const previousBadges = Number(localStorage.getItem("bodylogic-last-badge-count") || earnedCount);
    if (earnedCount > previousBadges) playGamificationSound("achievement");
    localStorage.setItem("bodylogic-last-badge-count", String(earnedCount));
  }, [progress]);

  if (isLoading || !profile || !stats || !progress || !missions || !balance) {
    return <ProfileSkeleton />;
  }

  const activeTitle = getActiveTitle(progress.level, getStoredTitleId());
  const levelInfo = calcLevel(progress.xp);
  const bmi = profile.height > 0 ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : "0";
  const bmiNum = Number(bmi);
  const bmiLabel = bmiNum < 18.5 ? t("bmi_underweight") : bmiNum < 25 ? t("bmi_healthy") : bmiNum < 30 ? t("bmi_overweight") : t("bmi_obese");
  const bmiColor = bmiNum < 18.5 ? "text-blue-400" : bmiNum < 25 ? "text-primary" : bmiNum < 30 ? "text-yellow-400" : "text-destructive";
  const earnedBadges = progress.badges.filter(b => b.earned);
  const memberSince = new Date(profile.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const gamStats = calcGamificationStats({
    totalMeals: stats.totalMealsLogged,
    totalWorkouts: stats.totalWorkouts,
    totalSleepLogs: 0,
    totalWaterDays: 0,
    level: progress.level,
    totalXP: progress.xp,
    longestStreak: progress.stats?.longestStreak ?? 0,
    currentStreak: progress.stats?.currentStreak ?? 0,
  });
  const unlockedAchievements = getUnlockedAchievements(gamStats);
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

  const TABS: { key: ProfileTab; label: string; icon: typeof User }[] = [
    { key: "me", label: t("profile_tab_me"), icon: User },
    { key: "rewards", label: t("profile_tab_rewards"), icon: Trophy },
    { key: "history", label: t("nav_history"), icon: Clock },
    { key: "settings", label: t("profile_tab_settings"), icon: Settings },
  ];

  return (
    <div className="min-h-full bg-background pb-6">
      {/* Sticky header with sub-tabs */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <BrandTag className="mb-0.5" />
              <h1 className="text-xl font-black gradient-text">{t("profile_title")}</h1>
            </div>
            {tab === "me" && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary/20 via-yellow-400/15 to-secondary/20 border border-yellow-400/40 px-3 py-1.5 rounded-full shadow-sm shadow-yellow-400/20">
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[10px] font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent uppercase tracking-wide">Lv {progress.level}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 bg-muted/40 p-1 rounded-xl mb-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                  tab === t.key ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "me" && (
          <motion.div
            key="me"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <MeTab
              profile={profile} stats={stats} progress={progress} missions={missions}
              balance={balance} user={user} activeTitle={activeTitle} levelInfo={levelInfo}
              bmi={bmi} bmiLabel={bmiLabel} bmiColor={bmiColor} earnedBadges={earnedBadges}
              memberSince={memberSince}
            />
          </motion.div>
        )}

        {tab === "rewards" && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <RewardsTab
              progress={progress} missions={missions} levelInfo={levelInfo}
              activeTitle={activeTitle} unlockedIds={unlockedIds} unlockedCount={unlockedAchievements.length}
            />
          </motion.div>
        )}

        {tab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <HistoryTab />
          </motion.div>
        )}

        {tab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SettingsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ME TAB ────────────────────────────────────────────────────────
function MeTab({ profile, stats, progress, missions, balance, user, activeTitle, levelInfo, bmi, bmiLabel, bmiColor, earnedBadges, memberSince }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(() => localStorage.getItem("userAvatar"));
  const [displayName, setDisplayName] = useState<string>(() => localStorage.getItem("bodylogic-display-name") || user?.name || profile?.name || "");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, lang } = useLang();

  const level = progress?.level ?? 1;
  const unlockedTitlesCount = ALL_TITLES.filter(tl => level >= tl.minLevel).length;
  const activeBanner = PROFILE_BANNERS.filter(b => b.unlocksAt <= unlockedTitlesCount).at(-1) ?? PROFILE_BANNERS[0]!;
  const nextBanner = PROFILE_BANNERS.find(b => b.unlocksAt > unlockedTitlesCount);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    localStorage.setItem("bodylogic-display-name", trimmed);
    setEditingName(false);
    toast({ title: t("profile_name_updated") });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: t("profile_image_large"), description: t("profile_image_large_desc"), variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLocalAvatar(dataUrl);
      localStorage.setItem("userAvatar", dataUrl);
      toast({ title: t("profile_photo_updated") });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="px-4 pt-4 space-y-4">
      {/* Health Identity Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/25 via-secondary/10 to-primary/5 border border-primary/30 p-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -translate-y-10 translate-x-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full translate-y-8 -translate-x-8 blur-2xl" />

        <div className="flex items-start gap-4 relative">
          <div className="relative shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button onClick={() => fileInputRef.current?.click()} className="relative group block">
              <div className="w-20 h-20 rounded-2xl border-2 border-primary/30 shadow-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-3xl font-black overflow-hidden">
                {(localAvatar || profile.avatarUrl) ? (
                  <img src={localAvatar ?? profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1.5 mb-1">
                <input value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="flex-1 bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-sm font-black text-white outline-none" autoFocus />
                <button onClick={saveName} className="w-7 h-7 rounded-lg bg-primary/30 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></button>
                <button onClick={() => setEditingName(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-white" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-black leading-tight">{displayName}</h2>
                <button onClick={() => { setNameInput(displayName); setEditingName(true); }} className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Edit2 className="w-3 h-3 text-white/70" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5 mb-2">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span className={cn("text-sm font-black", activeTitle.color, activeTitle.glow && "drop-shadow-[0_0_8px_currentColor]")}>{lang === "ar" ? (activeTitle.nameAr ?? activeTitle.name) : activeTitle.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {profile.goal === "lose_weight" ? t("goal_lose") : profile.goal === "maintain_weight" ? t("goal_maintain") : profile.goal === "build_muscle" ? t("goal_muscle") : t("goal_fitness")}
              </span>
              <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2 py-0.5 rounded-full border border-secondary/20">
                {profile.activityLevel === "sedentary" ? t("activity_sedentary") : profile.activityLevel === "lightly_active" ? t("activity_light") : profile.activityLevel === "moderately_active" ? t("activity_moderate") : profile.activityLevel === "very_active" ? t("activity_very_active") : t("activity_active")}
              </span>
              <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t("profile_member_since")} {memberSince}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 relative">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-yellow-400 font-black">{progress.xp.toLocaleString()} {t("unit_xp")}</span>
            <span className="text-white/60">{levelInfo.xpToNext.toLocaleString()} to Level {progress.level + 1}</span>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progressPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: t("profile_streak_label"), value: `${stats.currentStreak}d`, icon: Flame, color: "text-orange-400" },
            { label: t("profile_workouts_label"), value: stats.totalWorkouts, icon: Dumbbell, color: "text-secondary" },
            { label: t("profile_meals_label"), value: stats.totalMealsLogged, icon: Utensils, color: "text-primary" },
            { label: t("home_coins"), value: progress.coins, icon: Coins, color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-black/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
              <s.icon className={cn("w-3.5 h-3.5 mx-auto mb-1", s.color)} />
              <p className="text-sm font-black leading-none">{s.value}</p>
              <p className="text-[8px] text-white/60 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-sm">
            <Activity className="w-3 h-3 text-white/70 light:text-foreground/70" />
            <span className="text-[10px] font-bold text-white/80">BMI {bmi}</span>
            <span className={cn("text-[10px] font-black", bmiColor)}>{bmiLabel}</span>
          </div>
          {(profile.age > 0 || (profile.gender && profile.gender !== "unspecified" && profile.gender !== "")) && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-sm">
              <Calendar className="w-3 h-3 text-white/70" />
              <span className="text-[10px] font-bold text-white/80">
                {profile.age > 0 ? `${profile.age}y` : ""}
                {profile.gender && profile.gender !== "unspecified" && profile.gender !== "" ? (profile.age > 0 ? ` • ${profile.gender}` : profile.gender) : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Life Balance */}
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("profile_life_balance")}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-primary">{balance.overallScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {LIFE_BALANCE_ITEMS.map(item => {
            const Icon = item.icon;
            const score = item.id === "nutrition" ? balance.breakdown.nutrition
              : item.id === "fitness" ? balance.breakdown.fitness
              : item.id === "sleep" ? balance.breakdown.sleep
              : item.id === "hydration" ? balance.breakdown.hydration
              : balance.breakdown.consistency;
            return (
              <div key={item.id} className="space-y-2">
                <div className="h-20 bg-muted rounded-2xl relative flex flex-col items-center justify-end overflow-hidden">
                  <motion.div
                    className={cn("w-full absolute bottom-0 rounded-b-2xl", item.color)}
                    initial={{ height: 0 }}
                    animate={{ height: `${score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <div className="absolute top-2 z-10">
                    <div className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                      <Icon className={cn("w-3.5 h-3.5", item.iconColor)} strokeWidth={2.5} />
                    </div>
                  </div>
                  <span className="relative z-10 text-[10px] font-black text-white drop-shadow mb-1.5">{score}%</span>
                </div>
                <p className="text-[10px] font-bold text-center text-muted-foreground uppercase">{t(item.labelKey)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Missions */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("profile_todays_missions")}</h3>
        <div className="space-y-2">
          {missions.filter((m: any) => m.type === "daily").slice(0, 4).map((mission: any) => (
            <div key={mission.id} className={cn("bg-card rounded-xl p-3 border flex items-center gap-3 transition-all", mission.completed ? "border-primary/30 bg-primary/5" : "border-border/50")}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", mission.completed ? "bg-primary/20" : "bg-muted")}>
                {mission.completed ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Target className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm font-bold truncate", mission.completed && "line-through text-muted-foreground")}>{mission.title}</p>
                  <span className="text-[10px] font-bold text-yellow-500 shrink-0 ml-2">+{mission.xpReward} {t("unit_xp")}</span>
                </div>
                <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", mission.completed ? "bg-primary" : "bg-secondary")} style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earned Badges preview */}
      {earnedBadges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("profile_badges")}</h3>
            <button onClick={() => {}} className="text-xs text-primary font-semibold">{earnedBadges.length} {t("profile_total")}</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {earnedBadges.slice(0, 8).map((b: any) => (
              <div key={b.id} className="aspect-square bg-gradient-to-br from-yellow-500/10 to-orange-500/5 rounded-2xl border border-yellow-500/20 flex flex-col items-center justify-center p-2 text-center">
                <Award className="w-6 h-6 text-yellow-400 mb-1 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                <span className="text-[8px] font-bold leading-tight text-foreground/80">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body Metrics */}
      <Card className="border border-border/50 shadow-none bg-card">
        <div className="px-4 py-3 flex justify-between items-center border-b border-border/50">
          <h3 className="text-sm font-bold">{t("profile_body_metrics")}</h3>
          {!isEditing && (
            <Button variant="ghost" size="sm" className="h-7 text-xs font-bold px-2 rounded-lg" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-3.5 h-3.5 mr-1" /> {t("profile_edit")}
            </Button>
          )}
        </div>
        <CardContent className="p-0">
          {isEditing ? (
            <EditProfileForm profile={profile} onCancel={() => setIsEditing(false)} />
          ) : (
            <div className="divide-y divide-border/50">
              <DetailRow label={t("profile_weight")} value={`${profile.weight} kg`} />
              <DetailRow label={t("profile_height")} value={`${profile.height} cm`} />
              <DetailRow label={t("profile_bmi")} value={<span className={bmiColor}>{bmi} ({bmiLabel})</span>} />
              <DetailRow label={t("profile_activity")} value={<span>{profile.activityLevel === "sedentary" ? t("activity_sedentary") : profile.activityLevel === "lightly_active" ? t("activity_light") : profile.activityLevel === "moderately_active" ? t("activity_moderate") : profile.activityLevel === "very_active" ? t("activity_very_active") : t("activity_active")}</span>} />
              <DetailRow label={t("profile_goal")} value={<span className="text-primary">{profile.goal === "lose_weight" ? t("goal_lose") : profile.goal === "maintain_weight" ? t("goal_maintain") : profile.goal === "build_muscle" ? t("goal_muscle") : t("goal_fitness")}</span>} />
              <DetailRow label={t("profile_calorie_goal")} value={`${profile.dailyCalorieGoal.toLocaleString()} ${t("unit_kcal")}`} />
            </div>
          )}
        </CardContent>
      </Card>

      </div>{/* end px-4 wrapper */}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _BodyMeasurementsCard_DEPRECATED() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: measurements = [] } = useGetBodyMeasurements();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ weight: "", waist: "", chest: "", hips: "", arm: "", bodyFat: "", notes: "" });
  const latest = measurements[0];
  const trend = measurements.slice(0, 8).reverse().map((m, i) => ({ index: i + 1, weight: m.weight ?? undefined, waist: m.waist ?? undefined }));
  const mutation = useCreateBodyMeasurement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBodyMeasurementsQueryKey() });
        setForm({ weight: "", waist: "", chest: "", hips: "", arm: "", bodyFat: "", notes: "" });
        setOpen(false);
        toast({ title: t("measurements_saved") });
      },
      onError: () => toast({ title: t("measurements_save_failed"), variant: "destructive" }),
    },
  });
  const setField = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const num = (value: string) => value.trim() === "" ? null : Number(value);
  const save = () => {
    mutation.mutate({ data: {
      weight: num(form.weight),
      waist: num(form.waist),
      chest: num(form.chest),
      hips: num(form.hips),
      arm: num(form.arm),
      bodyFat: num(form.bodyFat),
      notes: form.notes.trim() || null,
    } });
  };

  return (
    <Card className="border border-primary/20 shadow-none bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/10 to-secondary/5">
        <div>
          <h3 className="text-sm font-black flex items-center gap-2"><Ruler className="w-4 h-4 text-primary" />{t("measurements_title")}</h3>
          <p className="text-[11px] text-muted-foreground">{t("measurements_subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 rounded-xl text-xs font-bold"><Plus className="w-3.5 h-3.5 mr-1" />{t("measurements_add")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[92vw] rounded-3xl">
            <DialogHeader><DialogTitle>{t("measurements_add")}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["weight", t("profile_weight"), t("unit_kg"), Weight],
                ["waist", t("measurements_waist"), "cm", Ruler],
                ["chest", t("measurements_chest"), "cm", Ruler],
                ["hips", t("measurements_hips"), "cm", Ruler],
                ["arm", t("measurements_arm"), "cm", Ruler],
                ["bodyFat", t("measurements_body_fat"), "%", Percent],
              ].map(([key, label, unit, Icon]: any) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Icon className="w-3 h-3 text-primary" />{label}</Label>
                  <div className="relative">
                    <Input type="number" inputMode="decimal" value={form[key as keyof typeof form]} onChange={e => setField(key, e.target.value)} className="h-9 pr-10" placeholder={t("measurements_optional")} />
                    <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-bold">{unit}</span>
                  </div>
                </div>
              ))}
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">{t("measurements_note")}</Label>
                <Input value={form.notes} onChange={e => setField("notes", e.target.value)} className="h-9" placeholder={t("measurements_optional")} />
              </div>
            </div>
            <Button onClick={save} disabled={mutation.isPending} className="w-full rounded-xl font-bold"><Save className="w-4 h-4 mr-2" />{t("profile_save_changes")}</Button>
          </DialogContent>
        </Dialog>
      </div>
      <CardContent className="p-4 space-y-4">
        {latest ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                [t("profile_weight"), latest.weight, t("unit_kg"), Weight],
                [t("measurements_waist"), latest.waist, "cm", Ruler],
                [t("measurements_body_fat"), latest.bodyFat, "%", Percent],
              ].map(([label, value, unit, Icon]: any) => (
                <div key={label} className="rounded-2xl bg-muted/40 border border-border/40 p-3 text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-base font-black">{value ?? "--"}</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">{label} {value != null ? unit : ""}</p>
                </div>
              ))}
            </div>
            {trend.length > 1 && (
              <div className="h-28 rounded-2xl bg-muted/30 border border-border/40 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={2} />
                    <Area type="monotone" dataKey="waist" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.12)" strokeWidth={2} />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("measurements_history")}</p>
              {measurements.slice(0, 4).map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                  <span className="text-xs font-bold">{new Date(m.loggedAt).toLocaleDateString()}</span>
                  <span className="text-xs text-muted-foreground">{m.weight ? `${m.weight} ${t("unit_kg")}` : "--"} · {m.waist ? `${m.waist} cm` : "--"}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Ruler className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
            {t("measurements_none")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── REWARDS TAB ───────────────────────────────────────────────────
function RewardsTab({ progress, missions, levelInfo, activeTitle: _activeTitle, unlockedIds, unlockedCount }: {
  progress: any; missions: any[]; levelInfo: any; activeTitle: any; unlockedIds: Set<string>; unlockedCount: number;
}) {
  const [rewardsTab, setRewardsTab] = useState<RewardsTab>("achievements");
  const [catFilter, setCatFilter] = useState<AchievementCategory | "all">("all");
  const [tierFilter, setTierFilter] = useState<BadgeTier | "all">("all");
  const [missionTab, setMissionTab] = useState<MissionTab>("daily");
  const [activeTitleId, setActiveTitleId] = useState<string | null>(() => getStoredTitleId());
  const activeTitle = getActiveTitle(progress.level, activeTitleId);
  const [acceptedChallenges, setAcceptedChallenges] = useState<Set<string>>(() => {
    try {
      const stored: {id: string}[] = JSON.parse(localStorage.getItem("bodylogic-accepted-challenges") ?? "[]");
      return new Set(stored.map(c => c.id));
    } catch { return new Set(); }
  });

  const { t, lang } = useLang();
  const { toast } = useToast();
  const totalCount = ALL_ACHIEVEMENTS.length;
  const completionPct = Math.round((unlockedCount / totalCount) * 100);
  const circumference = 2 * Math.PI * 45;

  const filteredAchievements = ALL_ACHIEVEMENTS.filter(a => {
    const catOk = catFilter === "all" || a.category === catFilter;
    const tierOk = tierFilter === "all" || a.tier === tierFilter;
    return catOk && tierOk;
  });

  return (
    <div className="px-4 pt-4 space-y-4 pb-24">
      {/* Hero Progress Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/30 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-8 translate-x-8 blur-3xl" />
        <div className="flex items-center gap-4 relative">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg glow-primary">
              <Crown className="w-8 h-8 text-background" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-background rounded-full px-2 py-0.5 shadow-md">
              <span className="text-[10px] font-black text-background">{progress.level}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-base font-black", activeTitle.color)}>{lang === "ar" ? (activeTitle.nameAr ?? activeTitle.name) : activeTitle.name}</p>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mt-2">
              <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" initial={{ width: 0 }} animate={{ width: `${levelInfo.progressPct}%` }} transition={{ duration: 1.2 }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-bold text-primary">{progress.xp.toLocaleString()} {t("unit_xp")}</span>
              <span className="text-[10px] text-muted-foreground">{levelInfo.xpToNext.toLocaleString()} {t("home_to_level")} {progress.level + 1}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: t("rewards_unlocked"), value: unlockedCount, icon: CheckCircle2, color: "text-primary" },
            { label: t("home_coins"), value: progress.coins, icon: Coins, color: "text-yellow-400" },
            { label: t("rewards_progress"), value: `${completionPct}%`, icon: TrendingUp, color: "text-orange-400" },
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
          <div className="flex justify-between text-[10px] mb-1 text-muted-foreground">
            <span>{t("rewards_overall")}</span>
            <span className="font-bold text-primary">{completionPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary via-secondary to-yellow-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 1.5 }} />
          </div>
        </div>
      </div>

      {/* Rewards Sub-tabs */}
      <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl">
        {([
          { key: "achievements", labelKey: "rewards_tab_badges", icon: Trophy },
          { key: "titles", labelKey: "rewards_tab_titles", icon: Crown },
          { key: "missions", labelKey: "rewards_tab_missions", icon: Target },
          { key: "bosses", labelKey: "rewards_tab_boss", icon: Sword },
        ] as { key: RewardsTab; labelKey: string; icon: typeof Trophy }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setRewardsTab(tab.key)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-bold transition-all",
              rewardsTab === tab.key ? "bg-background shadow text-primary" : "text-muted-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {t(tab.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Badges */}
      {rewardsTab === "achievements" && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORY_TABS.map(c => (
              <button
                key={c.key}
                onClick={() => setCatFilter(c.key as AchievementCategory | "all")}
                className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all", catFilter === c.key ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground border border-border/40")}
              >
                {c.icon} {t(c.labelKey as any)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setTierFilter("all")} className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap", tierFilter === "all" ? "bg-muted text-foreground" : "text-muted-foreground")}>{t("rewards_all_tiers_label")}</button>
            {(["bronze", "silver", "gold", "platinum", "legendary"] as BadgeTier[]).map(tier => {
              const cfg = TIER_CONFIG[tier];
              return (
                <button key={tier} onClick={() => setTierFilter(tier)} className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all", tierFilter === tier ? `${cfg.bg} ${cfg.border} ${cfg.textColor}` : "bg-muted/40 text-muted-foreground border-transparent")}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground font-bold">{filteredAchievements.filter(a => unlockedIds.has(a.id)).length} / {filteredAchievements.length} {t("rewards_unlocked_of")}</p>
          <div className="grid grid-cols-2 gap-3">
            {filteredAchievements.map((achievement, i) => {
              const achievementName = lang === "ar" ? (achievement.nameAr ?? achievement.name) : achievement.name;
              const achievementDescription = lang === "ar" ? (achievement.descAr ?? achievement.description) : achievement.description;
              const isUnlocked = unlockedIds.has(achievement.id);
              const cfg = TIER_CONFIG[achievement.tier];
              return (
                <motion.div key={achievement.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={cn("relative rounded-2xl p-4 border transition-all", isUnlocked ? `${cfg.bg} ${cfg.border}` : "bg-muted/20 border-border/20 opacity-55")}>
                  {isUnlocked ? <CheckCircle2 className={cn("absolute top-2 right-2 w-3.5 h-3.5", cfg.textColor)} /> : <Lock className="absolute top-2 right-2 w-3 h-3 text-muted-foreground/40" />}
                  <div className="text-3xl mb-2 leading-none">{achievement.icon}</div>
                  <p className={cn("text-xs font-black leading-tight mb-1", isUnlocked ? "text-foreground" : "text-muted-foreground")}>{achievementName}</p>
                  <p className="text-[10px] text-muted-foreground/80 leading-tight mb-2">{achievementDescription}</p>
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

      {/* Titles */}
      {rewardsTab === "titles" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("rewards_active_label")}: <span className={cn("font-bold", activeTitle.color)}>{lang === "ar" ? (activeTitle.nameAr ?? activeTitle.name) : activeTitle.name}</span></p>
            <span className="text-[10px] text-muted-foreground">{t("rewards_tap_equip")}</span>
          </div>
          {ALL_TITLES.map(title => {
            const titleName = lang === "ar" ? (title.nameAr ?? title.name) : title.name;
            const titleDescription = lang === "ar" ? (title.descAr ?? title.description) : title.description;
            const isUnlocked = progress.level >= title.minLevel;
            const isActive = title.id === activeTitle.id;
            return (
              <motion.div key={title.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={cn("flex items-center gap-3 p-4 rounded-2xl border transition-all", isActive ? "bg-primary/10 border-primary/40" : isUnlocked ? "bg-card border-border/40" : "bg-muted/20 border-border/20 opacity-50")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isUnlocked ? "bg-gradient-to-br from-primary/20 to-secondary/20" : "bg-muted/40")}>
                  <span className="text-xl">{CATEGORY_CONFIG[title.category]?.icon ?? "👑"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-black", isUnlocked ? title.color : "text-muted-foreground", title.glow && isUnlocked && "drop-shadow-[0_0_8px_currentColor]")}>{titleName}</p>
                    {isActive && <span className="text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{titleDescription}</p>
                  {!isUnlocked && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t("rewards_unlocks_at")} {title.minLevel}</p>}
                </div>
                <div className="shrink-0">
                  {isUnlocked ? (
                    isActive ? (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveTitleId(title.id);
                          setStoredTitleId(title.id);
                          toast({ title: `${titleName} ${t("profile_equipped")}`, description: t("profile_title_updated") });
                          playGamificationSound("xp");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black border border-primary/30 hover:bg-primary/20 transition-colors press-scale"
                      >
                        {t("profile_equip")}
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-1"><Lock className="w-3 h-3 text-muted-foreground/40" /><div className="text-xs font-bold text-muted-foreground">Lv{title.minLevel}</div></div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Missions */}
      {rewardsTab === "missions" && (
        <div className="space-y-4">
          <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
            {([{ key: "daily", labelKey: "mission_daily" }, { key: "weekly", labelKey: "mission_weekly" }, { key: "smart", labelKey: "mission_personal" }] as { key: MissionTab; labelKey: string }[]).map(tab => (
              <button key={tab.key} onClick={() => setMissionTab(tab.key)} className={cn("flex-1 py-2 rounded-lg text-[11px] font-bold transition-all", missionTab === tab.key ? "bg-background shadow text-primary" : "text-muted-foreground")}>
                {t(tab.labelKey as any)}
              </button>
            ))}
          </div>

          {missionTab === "daily" && (
            <div className="space-y-2">
              {DAILY_MISSIONS.map(m => {
                const sm = missions.find((sm: any) => sm.title === m.title);
                const completed = sm?.completed ?? false;
                const prog = sm?.progress ?? 0;
                const targ = sm?.target ?? 1;
                const pct = Math.min(100, Math.round((prog / targ) * 100));
                return (
                  <div key={m.id} className={cn("flex items-center gap-3 p-3.5 rounded-xl border", completed ? "bg-primary/10 border-primary/30" : "bg-card border-border/30")}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0", completed ? "bg-primary/20" : "bg-muted/50")}>{m.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm font-bold", completed && "line-through text-muted-foreground")}>{lang === "ar" ? (m.titleAr ?? m.title) : m.title}</p>
                        {completed ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <span className="text-xs font-bold text-yellow-400 shrink-0">+{m.xp} {t("unit_xp")}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">{lang === "ar" ? (m.descAr ?? m.description) : m.description}</p>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", completed ? "bg-primary" : "bg-secondary")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {missionTab === "weekly" && (
            <div className="space-y-2">
              {WEEKLY_MISSIONS.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/30">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-xl shrink-0">{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{lang === "ar" ? (m.titleAr ?? m.title) : m.title}</p>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-yellow-400">+{m.xp} {t("unit_xp")}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 inline-flex items-center gap-0.5">+{m.coins}<Coins className="w-3 h-3 text-yellow-400" /></span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{lang === "ar" ? (m.descAr ?? m.description) : m.description}</p>
                    <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: "30%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {missionTab === "smart" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <p className="text-sm font-black text-primary">{t("rewards_personal_title")}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("mission_personal_desc")}</p>
              </div>
              {SMART_MISSIONS.map(m => {
                const diff = m.difficulty ?? "easy";
                const diffCfg = DIFFICULTY_CONFIG[diff];
                return (
                  <div key={m.id} className="p-4 rounded-2xl bg-card border border-border/30">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0">
                        <MissionIcon icon={m.icon} className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-black">{lang === "ar" ? (m.titleAr ?? m.title) : m.title}</p>
                          <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full border", diffCfg.color)}>{t(diffCfg.labelKey as any)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{lang === "ar" ? (m.descAr ?? m.description) : m.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-yellow-400">+{m.xp} {t("unit_xp")}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">+{m.coins}<Coins className="w-3 h-3 text-yellow-400" /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Boss Challenges */}
      {rewardsTab === "bosses" && (
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
            const isAccepted = acceptedChallenges.has(boss.id);
            return (
              <motion.div key={boss.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="relative overflow-hidden rounded-2xl p-4 border border-destructive/25 bg-gradient-to-br from-destructive/5 via-background to-orange-900/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{boss.icon}</div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border", diffCfg.color)}>{t(diffCfg.labelKey as any).toUpperCase()}</span>
                    <span className="text-[10px] text-muted-foreground">{boss.days} {t("rewards_days")}</span>
                  </div>
                </div>
                <h4 className="text-base font-black mb-1">{lang === "ar" ? (boss.titleAr ?? boss.title) : boss.title}</h4>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{lang === "ar" ? (boss.descAr ?? boss.description) : boss.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-yellow-400">+{boss.xp} {t("unit_xp")}</span>
                    <span className="text-sm text-muted-foreground inline-flex items-center gap-1">+{boss.coins}<Coins className="w-3.5 h-3.5 text-yellow-400" /></span>
                  </div>
                  <button
                    onClick={() => {
                      if (isAccepted) return;
                      const next = new Set(acceptedChallenges);
                      next.add(boss.id);
                      setAcceptedChallenges(next);
                      try {
                        const stored: any[] = JSON.parse(localStorage.getItem("bodylogic-accepted-challenges") ?? "[]");
                        stored.unshift({ id: boss.id, title: lang === "ar" ? (boss.titleAr ?? boss.title) : boss.title, icon: boss.icon, read: false });
                        localStorage.setItem("bodylogic-accepted-challenges", JSON.stringify(stored));
                      } catch {}
                      playGamificationSound("achievement");
                      toast({ title: `${boss.icon} ${t("home_challenge_accepted")}`, description: `"${lang === "ar" ? (boss.titleAr ?? boss.title) : boss.title}" — ${t("challenge_boss_accepted_desc")}` });
                    }}
                    disabled={isAccepted}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black border transition-colors press-scale",
                      isAccepted
                        ? "bg-primary/15 text-primary border-primary/30 opacity-70 cursor-default"
                        : "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25"
                    )}
                  >
                    {isAccepted ? t("challenge_accepted_label") : t("challenge_accept")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
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

// ── HISTORY TAB ───────────────────────────────────────────────────
function HistoryTab() {
  const { t } = useLang();
  const [filter, setFilter] = useState<GetHistoryType>("all");
  const [days, setDays] = useState<7 | 30>(7);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: history, isLoading } = useGetHistory({ type: filter, limit: 100, days });

  const stats = useMemo(() => {
    if (!history) return { meals: 0, workouts: 0, sleep: 0 };
    return {
      meals: history.filter(h => h.type === "meal").length,
      workouts: history.filter(h => h.type === "workout").length,
      sleep: history.filter(h => h.type === "sleep").length,
    };
  }, [history]);

  const chartData = useMemo(() => {
    if (!history) return [];
    const map: Record<string, { date: string; count: number }> = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString([], { month: "short", day: "numeric" });
      map[key] = { date: key, count: 0 };
    }
    history.forEach(h => {
      const key = new Date(h.date).toLocaleDateString([], { month: "short", day: "numeric" });
      if (map[key]) map[key].count++;
    });
    return Object.values(map);
  }, [history, days]);

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

  const TYPE_CFG = {
    meal: { icon: Utensils, color: "bg-primary", textColor: "text-primary", border: "border-primary/30" },
    workout: { icon: Dumbbell, color: "bg-secondary", textColor: "text-secondary", border: "border-secondary/30" },
    sleep: { icon: Moon, color: "bg-purple-500", textColor: "text-purple-400", border: "border-purple-500/30" },
    water: { icon: Droplets, color: "bg-blue-500", textColor: "text-blue-400", border: "border-blue-500/30" },
  };

  return (
    <div className="p-5 space-y-5 pb-24">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{t("history_journey")}</p>
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {([7, 30] as const).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all",
                days === d ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
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

      {/* Activity Trend Chart */}
      {chartData.some(d => d.count > 0) && (
        <div className="rounded-2xl bg-card border border-border/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("history_activity")}</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="profileAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={days === 7 ? 0 : 4} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "11px", padding: "6px 10px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 2" }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#profileAreaGrad)" dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "meal", "workout", "sleep"] as GetHistoryType[]).map(f => {
          const Icon = f === "all" ? Calendar : f === "meal" ? Utensils : f === "workout" ? Dumbbell : Moon;
          const label = f === "all" ? t("history_all") : f === "meal" ? t("history_meals") : f === "workout" ? t("history_workouts") : t("history_sleep");
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all inline-flex items-center gap-1.5",
                filter === f
                  ? f === "all" ? "bg-primary text-primary-foreground"
                    : f === "meal" ? "bg-primary text-primary-foreground"
                    : f === "workout" ? "bg-secondary text-secondary-foreground"
                    : "bg-purple-500 text-white"
                  : "bg-muted/60 text-muted-foreground border border-border/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* History list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl shimmer" />)}
        </div>
      ) : !history || history.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-bold text-muted-foreground">{t("history_no_records")}</p>
          <p className="text-xs text-muted-foreground/70">{t("history_no_records_hint")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([dayLabel, entries]) => (
            <div key={dayLabel}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{dayLabel}</span>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] font-bold text-muted-foreground/60">{entries.length}</span>
              </div>
              <div className="space-y-2">
                {entries.map(entry => {
                  const cfg = TYPE_CFG[entry.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.meal;
                  const isExpanded = expandedId === entry.id;
                  const timeStr = new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const hasExtra = entry.metadata && Object.keys(entry.metadata).length > 0;
                  return (
                    <div
                      key={entry.id}
                      className={cn("rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden transition-all cursor-pointer", isExpanded && "border-border/60")}
                      onClick={() => hasExtra && setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.color)}>
                          <cfg.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm leading-tight truncate">{entry.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground">{timeStr}</span>
                          {hasExtra && (isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />)}
                        </div>
                      </div>
                      {isExpanded && hasExtra && (
                        <div className="px-4 pb-3 pt-1 border-t border-border/30 flex flex-wrap gap-3">
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
  );
}

// ── SETTINGS TAB ─────────────────────────────────────────────────
function SettingsTab() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { lang, setLang, t } = useLang();

  const [notifications, setNotifications] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [soundEffects, setSoundEffectsState] = useState(() => areSoundEffectsEnabled());
  const [haptics, setHaptics] = useState(true);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [aiPersonality, setAiPersonality] = useState<AiPersonality>("motivator");
  const [customPersonality, setCustomPersonality] = useState("");
  const [diet, setDiet] = useState<DietType>("none");
  const [customDiet, setCustomDiet] = useState("");
  const [customCondition, setCustomCondition] = useState("");
  const [stepGoal, setStepGoal] = useState(10000);
  const [calGoal, setCalGoal] = useState(2000);
  const [waterGoal, setWaterGoal] = useState(2500);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [selectedConditions, setSelectedConditions] = useState<Set<HealthCondition>>(new Set(["none"]));

  const toggleCondition = (cond: HealthCondition) => {
    setSelectedConditions(prev => {
      const next = new Set(prev);
      if (cond === "none") return new Set(["none"]);
      next.delete("none");
      if (next.has(cond)) next.delete(cond); else next.add(cond);
      if (next.size === 0) next.add("none");
      return next;
    });
  };

  const handleSavePersonality = (p: AiPersonality) => {
    setAiPersonality(p);
    const found = AI_PERSONALITIES.find(x => x.value === p);
    toast({ title: `${found?.emoji} ${found ? t(found.labelKey as any) : ""} ${t("profile_mode_activated")}`, description: found ? t(found.descKey as any) : "" });
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEffectsState(enabled);
    setSoundEffectsEnabled(enabled);
    if (enabled) playGamificationSound("toggle");
  };

  return (
    <div className="px-4 pt-4 space-y-4 pb-24">

      {/* AI Personality */}
      <SettingsSection icon={<Bot className="w-4 h-4 text-primary" />} title={t("settings_ai_coach")} badge="🔥">
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">{t("settings_ai_choose")}</p>
          <div className="grid grid-cols-2 gap-2">
            {AI_PERSONALITIES.map(p => {
              const active = aiPersonality === p.value;
              return (
                <button key={p.value} onClick={() => handleSavePersonality(p.value)}
                  className={cn("flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 transition-all text-left", active ? p.color : "border-border/50 bg-muted/20")}>
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-xl">{p.emoji}</span>
                    <span className={cn("text-xs font-bold flex-1", !active && "text-foreground")}>{t(p.labelKey as any)}</span>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{t(p.descKey as any)}</p>
                </button>
              );
            })}
          </div>
          {aiPersonality === "custom" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-accent">{t("profile_describe_coach")}</p>
              <textarea value={customPersonality} onChange={e => setCustomPersonality(e.target.value)} placeholder={t("profile_ai_placeholder")} rows={3} className="w-full rounded-xl bg-muted/30 border border-accent/30 p-3 text-xs outline-none resize-none text-foreground placeholder:text-muted-foreground/50" />
              <button onClick={() => toast({ title: t("profile_custom_saved"), description: customPersonality.slice(0, 70) })} disabled={!customPersonality.trim()} className="w-full py-2 rounded-xl bg-accent/15 text-accent text-xs font-bold border border-accent/30 disabled:opacity-40">{t("profile_save_custom")}</button>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Diet Preferences */}
      <SettingsSection icon={<Utensils className="w-4 h-4 text-secondary" />} title={t("settings_diet")}>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map(d => {
              const active = diet === d.value;
              return (
                <button key={d.value} onClick={() => setDiet(d.value)}
                  className={cn("flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left relative", active ? "border-secondary bg-secondary/10" : "border-border/40 bg-muted/20")}>
                  {active && <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-secondary" />}
                  <span className="text-lg shrink-0">{d.icon}</span>
                  <span className={cn("text-xs font-bold truncate", active ? "text-secondary" : "text-foreground")}>{t(d.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
          {diet === "custom" && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-secondary">{t("profile_describe_diet")}</p>
              <textarea value={customDiet} onChange={e => setCustomDiet(e.target.value)} placeholder={t("profile_diet_placeholder")} rows={3} className="w-full rounded-xl bg-muted/30 border border-secondary/30 p-3 text-xs outline-none resize-none text-foreground placeholder:text-muted-foreground/50" />
              <button onClick={() => toast({ title: t("profile_custom_diet_saved"), description: customDiet.slice(0, 70) })} disabled={!customDiet.trim()} className="w-full py-2 rounded-xl bg-secondary/15 text-secondary text-xs font-bold border border-secondary/30 disabled:opacity-40">{t("profile_save_custom_diet")}</button>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Health Conditions */}
      <SettingsSection icon={<AlertTriangle className="w-4 h-4 text-orange-400" />} title={t("settings_health")}>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">{t("settings_health_desc")}</p>
          <div className="grid grid-cols-2 gap-2">
            {HEALTH_CONDITIONS.map(h => {
              const active = selectedConditions.has(h.value);
              return (
                <button key={h.value} onClick={() => toggleCondition(h.value)}
                  className={cn("flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left relative", active ? "border-orange-400/50 bg-orange-400/10" : "border-border/40 bg-muted/20")}>
                  {active && <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-orange-400" />}
                  <span className="text-base">{h.icon}</span>
                  <span className={cn("text-xs font-bold truncate", active ? "text-orange-400" : "text-muted-foreground")}>{t(h.labelKey as any)}</span>
                </button>
              );
            })}
          </div>
          {selectedConditions.has("custom") && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-orange-400">{t("profile_describe_condition")}</p>
              <textarea value={customCondition} onChange={e => setCustomCondition(e.target.value)} placeholder={t("profile_condition_placeholder")} rows={3} className="w-full rounded-xl bg-muted/30 border border-orange-400/30 p-3 text-xs outline-none resize-none text-foreground placeholder:text-muted-foreground/50" />
            </div>
          )}
          <button onClick={() => toast({ title: t("profile_health_saved") })} className="w-full py-2.5 rounded-xl bg-orange-400/15 text-orange-400 text-sm font-bold border border-orange-400/30 hover:bg-orange-400/25 transition-colors press-scale">
            {t("settings_health_save")}
          </button>
        </div>
      </SettingsSection>

      {/* Goals */}
      <SettingsSection icon={<Target className="w-4 h-4 text-yellow-400" />} title={t("settings_goals")}>
        <div className="p-4 space-y-4">
          <GoalSlider label={t("settings_steps")} value={stepGoal} min={2000} max={20000} step={500} onChange={setStepGoal} unit={t("common_steps")} textColor="text-primary" />
          <GoalSlider label={t("settings_calories_goal")} value={calGoal} min={1200} max={4000} step={100} onChange={setCalGoal} unit={t("unit_kcal")} textColor="text-secondary" />
          <GoalSlider label={t("settings_water_goal")} value={waterGoal} min={1000} max={5000} step={250} onChange={setWaterGoal} unit={t("unit_ml")} textColor="text-blue-400" />
          <GoalSlider label={t("settings_sleep_goal")} value={sleepGoal} min={5} max={12} step={0.5} onChange={setSleepGoal} unit={t("unit_hrs")} textColor="text-accent" />
          <button onClick={() => toast({ title: t("profile_goals_saved") })} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 press-scale transition-all">
            {t("settings_save_goals")}
          </button>
        </div>
      </SettingsSection>

      {/* Language — wired to global context */}
      <SettingsSection icon={<Globe className="w-4 h-4 text-cyan-400" />} title={t("settings_language")}>
        <div className="p-4">
          <div className="flex gap-2">
            {([{ value: "en" as const, label: "English", flag: "🇬🇧" }, { value: "ar" as const, label: "العربية", flag: "🇸🇦", rtl: true }]).map(l => (
              <button key={l.value} onClick={() => setLang(l.value)}
                className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all", lang === l.value ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" : "border-border bg-muted/30 text-muted-foreground")}>
                <span className="text-lg">{l.flag}</span>
                <span className="text-sm font-bold">{l.label}</span>
                {l.rtl && <span className="text-[9px] opacity-60">RTL</span>}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection icon={<Palette className="w-4 h-4 text-purple-400" />} title={t("settings_appearance")}>
        <div className="p-4">
          <div className="flex gap-2">
            {[
              { value: "dark", labelKey: "settings_dark" as const, icon: Moon, preview: "bg-slate-900" },
              { value: "light", labelKey: "settings_light" as const, icon: Sun, preview: "bg-green-50" },
              { value: "system", labelKey: "settings_system" as const, icon: Monitor, preview: "bg-gradient-to-br from-slate-900 to-green-50" },
            ].map(opt => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button key={opt.value} onClick={() => setTheme(opt.value)}
                  className={cn("flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all", active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground")}>
                  <div className={cn("w-10 h-10 rounded-lg border-2 overflow-hidden", active ? "border-primary" : "border-border/40")}>
                    <div className={cn("w-full h-full", opt.preview)} />
                  </div>
                  <p className="text-[10px] font-bold">{t(opt.labelKey)}</p>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* Units */}
      <SettingsSection icon={<Ruler className="w-4 h-4 text-secondary" />} title={t("settings_units")}>
        <div className="p-4">
          <div className="flex gap-2">
            {(["metric", "imperial"] as const).map(u => (
              <button key={u} onClick={() => setUnits(u)} className={cn("flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all", units === u ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground")}>
                {u === "metric" ? <Ruler className="w-5 h-5" /> : <Weight className="w-5 h-5" />}
                <span>{u === "metric" ? t("settings_metric") : t("settings_imperial")}</span>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={<Bell className="w-4 h-4 text-yellow-400" />} title={t("settings_notifications")}>
        <div className="divide-y divide-border/50">
          <ToggleRow label={t("settings_all_notif")} desc={t("settings_all_notif_desc")} value={notifications} onChange={setNotifications} />
          <ToggleRow label={t("settings_water_notif")} desc={t("settings_water_notif_desc")} value={waterReminders} onChange={setWaterReminders} disabled={!notifications} />
          <ToggleRow label={t("settings_meal_notif")} desc={t("settings_meal_notif_desc")} value={mealReminders} onChange={setMealReminders} disabled={!notifications} />
          <ToggleRow label={t("settings_workout_notif")} desc={t("settings_workout_notif_desc")} value={workoutReminders} onChange={setWorkoutReminders} disabled={!notifications} />
          <ToggleRow label={t("settings_weekly_report")} desc={t("settings_weekly_report_desc")} value={weeklyReport} onChange={setWeeklyReport} disabled={!notifications} />
        </div>
      </SettingsSection>

      {/* Sound & Haptics */}
      <SettingsSection icon={<Volume2 className="w-4 h-4 text-green-400" />} title={t("settings_sound")}>
        <div className="divide-y divide-border/50">
          <ToggleRow label={t("settings_achievement_sounds")} desc={t("settings_achievement_sounds_desc")} value={soundEffects} onChange={handleSoundToggle} />
          <ToggleRow label={t("settings_haptics")} desc={t("settings_haptics_desc")} value={haptics} onChange={setHaptics} />
        </div>
      </SettingsSection>

      {/* Data & Privacy */}
      <SettingsSection icon={<Shield className="w-4 h-4 text-destructive" />} title={t("settings_privacy")}>
        <div className="divide-y divide-border/50">
          <ActionRow label={t("settings_export")} desc={t("settings_export_desc")} icon={<Download className="w-4 h-4 text-muted-foreground" />} onClick={() => exportAllDataCsv(toast)} />
          <ActionRow label={t("settings_cache")} desc={t("settings_cache_desc")} icon={<Trash2 className="w-4 h-4 text-muted-foreground" />} onClick={() => { try { Object.keys(localStorage).filter(k => k.startsWith("bodylogic-cache-")).forEach(k => localStorage.removeItem(k)); } catch {} toast({ title: t("settings_cache_cleared") }); }} />
          <ActionRow
            label={t("settings_reset")}
            desc={t("settings_reset_desc")}
            icon={<Trash2 className="w-4 h-4 text-destructive" />}
            danger
            onClick={async () => {
              if (!window.confirm(t("settings_reset_confirm"))) return;
              try {
                const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
                const res = await fetch(`${BASE}/api/profile/reset`, { method: "POST", credentials: "include" });
                if (!res.ok) throw new Error("Reset failed");
                try {
                  Object.keys(localStorage).forEach((k) => {
                    if (k.startsWith("bodylogic-") || k === "userAvatar") localStorage.removeItem(k);
                  });
                } catch {}
                toast({ title: t("settings_reset_done") });
                setTimeout(() => window.location.reload(), 600);
              } catch (e: any) {
                toast({ title: t("settings_reset_fail"), description: e.message, variant: "destructive" });
              }
            }}
          />
          <ActionRow label={t("settings_delete")} desc={t("settings_delete_desc")} icon={<Trash2 className="w-4 h-4 text-destructive" />} onClick={() => toast({ title: t("settings_delete_confirm"), variant: "destructive" })} danger />
        </div>
      </SettingsSection>

      {/* About */}
      <SettingsSection icon={<Info className="w-4 h-4 text-muted-foreground" />} title={t("settings_about")}>
        <div className="divide-y divide-border/50">
          <div className="px-4 py-3 flex justify-between"><span className="text-sm">{t("settings_version")}</span><span className="text-sm text-muted-foreground font-mono">Beta</span></div>
          <div className="px-4 py-3 flex justify-between"><span className="text-sm">{t("settings_build")}</span><span className="text-sm text-muted-foreground font-mono">2026.04</span></div>
        </div>
      </SettingsSection>

      {/* Logout */}
      <button onClick={logout} className="w-full py-3 rounded-2xl border border-destructive/40 text-destructive text-sm font-bold hover:bg-destructive/10 transition-colors press-scale">
        {t("settings_signout")}
      </button>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────

function GoalSlider({ label, value, min, max, step, onChange, unit, textColor }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit: string; textColor: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <p className="text-sm font-medium">{label}</p>
        <span className={cn("text-sm font-black", textColor)}>{value.toLocaleString()} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

function SettingsSection({ icon, title, badge, children }: { icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/50">
        <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
        <span className="text-sm font-bold text-foreground flex-1">{title}</span>
        {badge && <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange, disabled }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={cn("px-4 py-3 flex items-center justify-between gap-3", disabled && "opacity-40")}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => !disabled && onChange(!value)} className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0", value && !disabled ? "bg-primary" : "bg-muted")}>
        <motion.div animate={{ x: value ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}

function ActionRow({ label, desc, icon, onClick, danger }: { label: string; desc: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors text-left">
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", danger ? "text-destructive" : "text-foreground")}>{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {icon}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 text-sm">
      <span className="text-muted-foreground font-semibold">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}

function EditProfileForm({ profile, onCancel }: { profile: any; onCancel: () => void }) {
  const { t } = useLang();
  const [age, setAge] = useState(profile.age ? profile.age.toString() : "");
  const [height, setHeight] = useState(profile.height ? profile.height.toString() : "");
  const [weight, setWeight] = useState(profile.weight.toString());
  const [gender, setGender] = useState(profile.gender ?? "unspecified");
  const [goal, setGoal] = useState<UpdateProfileBodyGoal>(profile.goal);
  const [activity, setActivity] = useState<UpdateProfileBodyActivityLevel>(profile.activityLevel);
  const [calories, setCalories] = useState(profile.dailyCalorieGoal.toString());
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateProfile({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetProfileQueryKey() }); toast({ title: t("profile_updated") }); onCancel(); },
      onError: () => toast({ title: t("profile_update_failed"), variant: "destructive" }),
    },
  });
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ data: {
      age: age ? Number(age) : undefined,
      height: height ? Number(height) : undefined,
      weight: Number(weight),
      gender: gender || undefined,
      goal,
      activityLevel: activity,
      dailyCalorieGoal: Number(calories),
    } });
  };
  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">{t("profile_age")} ({t("unit_years")})</Label><Input type="number" min={5} max={120} value={age} onChange={e => setAge(e.target.value)} className="h-9" placeholder="e.g. 25" /></div>
        <div className="space-y-1.5"><Label className="text-xs">{t("profile_height")} (cm)</Label><Input type="number" min={50} max={280} value={height} onChange={e => setHeight(e.target.value)} className="h-9" placeholder="e.g. 175" /></div>
        <div className="space-y-1.5"><Label className="text-xs">{t("profile_weight")} ({t("unit_kg")})</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="h-9" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("profile_gender")}</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unspecified">{t("profile_prefer_not")}</SelectItem>
              <SelectItem value="male">{t("profile_male")}</SelectItem>
              <SelectItem value="female">{t("profile_female")}</SelectItem>
              <SelectItem value="other">{t("profile_other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">{t("profile_calorie_goal_label")}</Label><Input type="number" value={calories} onChange={e => setCalories(e.target.value)} className="h-9" /></div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">{t("profile_main_goal")}</Label>
        <Select value={goal} onValueChange={(v: UpdateProfileBodyGoal) => setGoal(v)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="lose_weight">{t("profile_goal_lose_weight")}</SelectItem>
            <SelectItem value="maintain">{t("profile_goal_maintain")}</SelectItem>
            <SelectItem value="build_muscle">{t("profile_goal_build_muscle")}</SelectItem>
            <SelectItem value="improve_fitness">{t("profile_goal_improve_fitness")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">{t("profile_activity_level")}</Label>
        <Select value={activity} onValueChange={(v: UpdateProfileBodyActivityLevel) => setActivity(v)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sedentary">{t("activity_sedentary")}</SelectItem>
            <SelectItem value="light">{t("activity_light")}</SelectItem>
            <SelectItem value="moderate">{t("activity_moderate")}</SelectItem>
            <SelectItem value="active">{t("activity_active")}</SelectItem>
            <SelectItem value="very_active">{t("activity_very_active")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1 rounded-xl h-10" onClick={onCancel} disabled={update.isPending}><X className="w-4 h-4 mr-1" /> {t("common_cancel")}</Button>
        <Button type="submit" className="flex-1 rounded-xl h-10" disabled={update.isPending}><Check className="w-4 h-4 mr-1" /> {update.isPending ? t("common_saving") : t("common_save")}</Button>
      </div>
    </form>
  );
}

function ProfileSkeleton() {
  return (
    <div className="p-5 space-y-5 pb-24">
      <div className="pt-2 space-y-2">
        <Skeleton className="h-6 w-32 shimmer" />
        <Skeleton className="h-12 w-full rounded-xl shimmer" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl shimmer" />
      <Skeleton className="h-40 w-full rounded-2xl shimmer" />
      <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl shimmer" />)}</div>
    </div>
  );
}
