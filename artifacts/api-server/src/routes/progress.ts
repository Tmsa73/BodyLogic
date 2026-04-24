import { Router, type IRouter } from "express";
import { desc, count, gte, and, lt, eq } from "drizzle-orm";
import { db, xpLogsTable, mealsTable, workoutsTable, sleepTable, waterLogsTable, stepsTable, profileTable } from "@workspace/db";
import { GetProgressResponse, GetMissionsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2500, 4000, 6000, 9000, 13000];

function calcLevel(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= (LEVEL_THRESHOLDS[i] ?? Infinity)) level = i + 1;
    else break;
  }
  const xpToNext = (LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!) - xp;
  return { level, xpToNext: Math.max(0, xpToNext) };
}

const LEVEL_TITLES = ["Beginner", "Newcomer", "Learner", "Explorer", "Achiever", "Warrior", "Champion", "Elite", "Master", "Legend", "Immortal"];

const ALL_BADGES = [
  { id: "first_meal", name: "First Bite", description: "Log your first meal", icon: "utensils" },
  { id: "week_streak", name: "Week Warrior", description: "7-day logging streak", icon: "flame" },
  { id: "first_workout", name: "Iron Start", description: "Log your first workout", icon: "dumbbell" },
  { id: "ten_workouts", name: "Dedicated", description: "Complete 10 workouts", icon: "trophy" },
  { id: "hydrated", name: "Hydration Hero", description: "Hit water goal 3 days in a row", icon: "droplets" },
  { id: "sleep_master", name: "Sleep Master", description: "Log 7 nights of sleep", icon: "moon" },
  { id: "level5", name: "Rising Star", description: "Reach level 5", icon: "star" },
  { id: "meal_iq_pro", name: "Meal IQ Pro", description: "Score 20+ Meal IQ", icon: "brain" },
];

async function computeActivityStreak(): Promise<{ current: number; longest: number }> {
  const meals = await db.select({ d: mealsTable.loggedAt }).from(mealsTable);
  const workouts = await db.select({ d: workoutsTable.loggedAt }).from(workoutsTable);
  const sleeps = await db.select({ d: sleepTable.bedtime }).from(sleepTable);
  const waters = await db.select({ d: waterLogsTable.loggedAt }).from(waterLogsTable);
  const stepsRows = await db.select({ d: stepsTable.date, c: stepsTable.steps }).from(stepsTable);
  const days = new Set<string>();
  for (const r of [...meals, ...workouts, ...sleeps, ...waters]) {
    if (r.d) days.add(new Date(r.d).toISOString().split("T")[0]!);
  }
  for (const r of stepsRows) {
    if (r.d && Number(r.c ?? 0) > 0) days.add(String(r.d));
  }
  // Count account creation day as the first active day so a fresh user starts at streak = 1.
  const profiles = await db.select({ d: profileTable.createdAt }).from(profileTable).limit(1);
  if (profiles[0]?.d) days.add(new Date(profiles[0].d).toISOString().split("T")[0]!);
  if (days.size === 0) return { current: 0, longest: 0 };
  const today = new Date().toISOString().split("T")[0]!;
  let current = 0;
  let cursor = new Date(today);
  while (days.has(cursor.toISOString().split("T")[0]!)) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const cur = new Date(sorted[i]!);
    const diff = (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) { run++; longest = Math.max(longest, run); }
    else run = 1;
  }
  return { current, longest };
}

router.get("/progress", async (req, res): Promise<void> => {
  const xpLogs = await db.select().from(xpLogsTable).orderBy(desc(xpLogsTable.earnedAt));
  const totalXP = xpLogs.reduce((s, l) => s + l.amount, 0);
  const coins = Math.floor(totalXP / 10);

  const { level, xpToNext } = calcLevel(totalXP);
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]!;

  const [totalWorkoutsR] = await db.select({ count: count() }).from(workoutsTable);
  const [totalMealsR] = await db.select({ count: count() }).from(mealsTable);
  const totalWorkouts = Number(totalWorkoutsR?.count ?? 0);
  const totalMeals = Number(totalMealsR?.count ?? 0);
  const { current: currentStreak, longest: longestStreak } = await computeActivityStreak();

  const badges = ALL_BADGES.map(b => {
    let earned = false;
    if (b.id === "first_meal" && totalMeals >= 1) earned = true;
    if (b.id === "first_workout" && totalWorkouts >= 1) earned = true;
    if (b.id === "ten_workouts" && totalWorkouts >= 10) earned = true;
    if (b.id === "level5" && level >= 5) earned = true;
    return { ...b, earned, earnedAt: earned ? new Date().toISOString() : null };
  });

  const recentXpGains = xpLogs.slice(0, 5).map(l => ({
    source: l.source,
    amount: l.amount,
    earnedAt: l.earnedAt,
  }));

  const progress = {
    level,
    xp: totalXP,
    xpToNextLevel: xpToNext,
    coins,
    title,
    badges,
    recentXpGains,
    stats: {
      totalWorkouts,
      totalMealsLogged: totalMeals,
      longestStreak,
      currentStreak,
    },
  };

  res.json(GetProgressResponse.parse(progress));
});

router.post("/progress/award-game", async (req, res): Promise<void> => {
  const { xp = 0, source = "game" } = req.body ?? {};
  const safeXp = Math.min(Math.max(0, Number(xp)), 200);
  if (safeXp > 0) {
    await db.insert(xpLogsTable).values({ source: String(source), amount: safeXp });
  }
  const xpLogs = await db.select().from(xpLogsTable).orderBy(desc(xpLogsTable.earnedAt));
  const totalXP = xpLogs.reduce((s, l) => s + l.amount, 0);
  const coins = Math.floor(totalXP / 10);
  res.json({ xpAwarded: safeXp, totalXP, coins });
});

router.get("/progress/missions", async (req, res): Promise<void> => {
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [mealsTodayRows, workoutsTodayRows, workoutsWeekR, waterTodayRows, sleepTodayRows] = await Promise.all([
    db.select().from(mealsTable).where(and(gte(mealsTable.loggedAt, dayStart), lt(mealsTable.loggedAt, dayEnd))),
    db.select().from(workoutsTable).where(and(gte(workoutsTable.loggedAt, dayStart), lt(workoutsTable.loggedAt, dayEnd))),
    db.select({ c: count() }).from(workoutsTable).where(gte(workoutsTable.loggedAt, weekAgo)),
    db.select().from(waterLogsTable).where(and(gte(waterLogsTable.loggedAt, dayStart), lt(waterLogsTable.loggedAt, dayEnd))),
    db.select().from(sleepTable).where(gte(sleepTable.bedtime, weekAgo)),
  ]);

  const mealsToday = mealsTodayRows.length;
  const workoutsToday = workoutsTodayRows.length;
  const workoutsWeek = Number(workoutsWeekR[0]?.c ?? 0);
  const waterMlToday = waterTodayRows.reduce((s, w) => s + w.amountMl, 0);
  const lastSleep = sleepTodayRows.sort((a, b) => new Date(b.bedtime).getTime() - new Date(a.bedtime).getTime())[0];
  const lastSleepHours = lastSleep?.durationHours ?? 0;
  const waterGlasses = Math.floor(waterMlToday / 250);

  const missions = [
    {
      id: "log_3_meals",
      title: "Fuel Up",
      description: "Log 3 meals today",
      type: "daily" as const,
      category: "nutrition" as const,
      progress: Math.min(3, mealsToday),
      target: 3,
      xpReward: 50,
      coinReward: 5,
      completed: mealsToday >= 3,
      icon: "utensils",
    },
    {
      id: "drink_water",
      title: "Stay Hydrated",
      description: "Drink 8 glasses of water",
      type: "daily" as const,
      category: "water" as const,
      progress: Math.min(8, waterGlasses),
      target: 8,
      xpReward: 30,
      coinReward: 3,
      completed: waterGlasses >= 8,
      icon: "droplets",
    },
    {
      id: "log_workout",
      title: "Get Moving",
      description: "Complete a workout today",
      type: "daily" as const,
      category: "fitness" as const,
      progress: Math.min(1, workoutsToday),
      target: 1,
      xpReward: 75,
      coinReward: 8,
      completed: workoutsToday >= 1,
      icon: "dumbbell",
    },
    {
      id: "weekly_workouts",
      title: "Consistency King",
      description: "Complete 4 workouts this week",
      type: "weekly" as const,
      category: "fitness" as const,
      progress: Math.min(4, workoutsWeek),
      target: 4,
      xpReward: 200,
      coinReward: 20,
      completed: workoutsWeek >= 4,
      icon: "trophy",
    },
    {
      id: "sleep_7h",
      title: "Rest & Recover",
      description: "Get 7+ hours of sleep",
      type: "daily" as const,
      category: "sleep" as const,
      progress: lastSleepHours >= 7 ? 1 : 0,
      target: 1,
      xpReward: 40,
      coinReward: 4,
      completed: lastSleepHours >= 7,
      icon: "moon",
    },
    {
      id: "meal_iq_20",
      title: "Eat Smart",
      description: "Score 20+ Meal IQ this week",
      type: "weekly" as const,
      category: "nutrition" as const,
      progress: 0,
      target: 1,
      xpReward: 150,
      coinReward: 15,
      completed: false,
      icon: "brain",
    },
  ];

  res.json(GetMissionsResponse.parse(missions));
});

export default router;
