import { Router, type IRouter } from "express";
import { desc, gte, and, lt, eq } from "drizzle-orm";
import { db, aiMessagesTable, usersTable, profileTable, mealsTable, workoutsTable, sleepTable, waterLogsTable } from "@workspace/db";
import { getUserFromRequest } from "./auth";
import {
  GetAiMessagesResponse,
  SendAiMessageBody,
  SendAiMessageResponse,
  GetAiInsightsResponse,
} from "@workspace/api-zod";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
});

function isArabicRequest(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const value = Array.isArray(req.headers["accept-language"]) ? req.headers["accept-language"][0] : req.headers["accept-language"];
  return typeof value === "string" && value.toLowerCase().startsWith("ar");
}

const healthTips = [
  { id: 1, category: "nutrition" as const, title: "Stay Hydrated", description: "Drink at least 8 glasses of water today to support metabolism and energy levels.", priority: "high" as const },
  { id: 2, category: "fitness" as const, title: "Move Every Hour", description: "Take short breaks to walk or stretch — sitting for long periods reduces calorie burn by up to 20%.", priority: "medium" as const },
  { id: 3, category: "sleep" as const, title: "Consistent Sleep Schedule", description: "Going to bed at the same time each night improves sleep quality and hormone balance.", priority: "high" as const },
  { id: 4, category: "nutrition" as const, title: "Protein at Every Meal", description: "Including protein with each meal helps maintain muscle mass and keeps you feeling full longer.", priority: "medium" as const },
  { id: 5, category: "general" as const, title: "Mindful Eating", description: "Slow down and savor your meals — eating mindfully reduces overeating by up to 30%.", priority: "low" as const },
  { id: 6, category: "water" as const, title: "Morning Hydration", description: "Drinking 500ml of water first thing in the morning kickstarts your metabolism and improves focus.", priority: "medium" as const },
];

async function buildUserContext(userId?: number) {
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let userName = "there";
  let goal = "improve_fitness";
  let weight = 70;
  let activityLevel = "moderate";
  let age = 25;
  let calorieGoal = 2000;

  if (userId) {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (users[0]) {
      userName = users[0].name.split(" ")[0] ?? "there";
      goal = users[0].goal ?? "improve_fitness";
      weight = users[0].weight ?? 70;
      activityLevel = users[0].activityLevel ?? "moderate";
      age = users[0].age ?? 25;
    }
  }

  const profiles = await db.select().from(profileTable).limit(1);
  if (profiles[0]) {
    calorieGoal = profiles[0].dailyCalorieGoal;
  }

  const todayMeals = await db.select().from(mealsTable).where(and(gte(mealsTable.loggedAt, dayStart), lt(mealsTable.loggedAt, dayEnd)));
  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = todayMeals.reduce((s, m) => s + m.protein, 0);
  const totalFiber = todayMeals.reduce((s, m) => s + m.fiber, 0);

  const weekWorkouts = await db.select().from(workoutsTable).where(gte(workoutsTable.loggedAt, weekAgo));
  const recentSleep = await db.select().from(sleepTable).orderBy(desc(sleepTable.bedtime)).limit(3);
  const avgSleep = recentSleep.length > 0 ? recentSleep.reduce((s, sl) => s + sl.durationHours, 0) / recentSleep.length : 0;

  const todayWater = await db.select().from(waterLogsTable).where(and(gte(waterLogsTable.loggedAt, dayStart), lt(waterLogsTable.loggedAt, dayEnd)));
  const totalWaterMl = todayWater.reduce((s, w) => s + w.amountMl, 0);

  return {
    userName,
    goal: goal.replace(/_/g, " "),
    weight,
    activityLevel: activityLevel.replace(/_/g, " "),
    age,
    calorieGoal,
    todayCalories: totalCalories,
    todayProtein: totalProtein,
    todayFiber: totalFiber,
    mealsCount: todayMeals.length,
    weeklyWorkouts: weekWorkouts.length,
    avgSleepHours: Math.round(avgSleep * 10) / 10,
    waterTodayMl: totalWaterMl,
  };
}

function generatePersonalizedResponse(message: string, ctx: Awaited<ReturnType<typeof buildUserContext>>, lang: "en" | "ar" = "en"): string {
  const msg = message.toLowerCase();
  const name = ctx.userName;
  const simpleMode = ctx.age < 18 || ctx.age >= 55;
  const redirect = `${name}, I can help with nutrition, workouts, sleep, hydration, weight progress, and BodyLogic tracking. Ask me about one of those and I’ll keep it focused on your health goals.`;
  const redirectAr = `${name}، أستطيع مساعدتك في التغذية، التمارين، النوم، الترطيب، تقدم الوزن، وتتبع BodyLogic. اسألني عن أحد هذه المواضيع وسأبقي الإجابة مركزة على هدفك الصحي.`;
  const caloriesRemaining = ctx.calorieGoal - ctx.todayCalories;
  const waterGlasses = Math.round(ctx.waterTodayMl / 250);

  if (lang === "ar") {
    if (msg.includes("اكل") || msg.includes("أكل") || msg.includes("وجبة") || msg.includes("سعر") || msg.includes("calorie") || msg.includes("food")) return `${name}، سجّلت اليوم ${ctx.todayCalories} سعرة وبقي لديك ${Math.max(0, caloriesRemaining)} سعرة من هدفك ${ctx.calorieGoal}. ركّز على بروتين جيد، ألياف، وماء كافٍ.`;
    if (msg.includes("تمرين") || msg.includes("رياض") || msg.includes("gym") || msg.includes("workout")) return `${name}، سجّلت ${ctx.weeklyWorkouts} تمارين هذا الأسبوع. لزيادة التقدم نحو هدف ${ctx.goal}، أضف جلسة سهلة أو مشي 20 دقيقة اليوم.`;
    if (msg.includes("نوم") || msg.includes("تعب") || msg.includes("sleep")) return `${name}، متوسط نومك الأخير ${ctx.avgSleepHours || "غير مسجل"} ساعة. حاول تثبيت وقت النوم وتقليل الشاشة قبل النوم بساعة.`;
    if (msg.includes("ماء") || msg.includes("شرب") || msg.includes("water")) return `${name}، شربت تقريبًا ${waterGlasses} أكواب ماء اليوم. ابدأ بكوبين الآن وحافظ على الترطيب مع كل وجبة.`;
    if (msg.includes("وزن") || msg.includes("تقدم") || msg.includes("progress")) return `${name}، التقدم يأتي من تكرار العادات الصغيرة: تسجيل الوجبات، الحركة، الماء، والنوم. لديك ${ctx.weeklyWorkouts} تمارين هذا الأسبوع و${ctx.mealsCount} وجبات اليوم.`;
    return redirectAr;
  }

  if (msg.includes("nutrition") || msg.includes("food") || msg.includes("meal") || msg.includes("eat") || msg.includes("calorie")) {
    if (simpleMode) return `${name}, for food today: log each meal, add protein, drink water, and choose fruit or vegetables when you can. You have ${Math.max(0, caloriesRemaining)} calories left.`;
    if (ctx.mealsCount === 0) return `Hey ${name}! You haven't logged any meals today yet. Start by logging your breakfast — even a quick entry helps me give you personalized nutrition advice. Your calorie goal is ${ctx.calorieGoal} kcal.`;
    if (caloriesRemaining > 800) return `${name}, you've consumed ${ctx.todayCalories} kcal so far with ${caloriesRemaining} kcal remaining toward your ${ctx.calorieGoal} goal. You have room for ${ctx.mealsCount >= 2 ? "a good dinner" : "lunch and dinner"}. With your ${ctx.goal} goal, aim to hit your target with protein-rich, fiber-filled foods.`;
    if (caloriesRemaining < 0) return `${name}, you've exceeded your ${ctx.calorieGoal} kcal goal by ${Math.abs(caloriesRemaining)} kcal today. That's okay — one day won't derail your ${ctx.goal} journey. Tomorrow, try starting with a protein-packed breakfast to control appetite throughout the day.`;
    return `${name}, you're right on track with ${ctx.todayCalories} kcal consumed — ${caloriesRemaining} kcal remaining. Your protein is at ${ctx.todayProtein}g and fiber at ${ctx.todayFiber}g today. ${ctx.todayFiber < 15 ? "Consider adding more vegetables to boost your fiber intake." : "Fiber looks good — keep it up!"}`;
  }

  if (msg.includes("workout") || msg.includes("exercise") || msg.includes("gym") || msg.includes("training") || msg.includes("fitness")) {
    if (simpleMode) return `${name}, keep movement simple today: walk 20 minutes, stretch, or do an easy workout you can finish safely. You have logged ${ctx.weeklyWorkouts} workout${ctx.weeklyWorkouts !== 1 ? "s" : ""} this week.`;
    if (ctx.weeklyWorkouts === 0) return `${name}, you haven't logged any workouts this week. For your ${ctx.goal} goal, I recommend starting with 3 sessions per week. Even a 20-minute walk counts! What type of exercise do you enjoy most?`;
    if (ctx.weeklyWorkouts >= 5) return `${name}, you're crushing it with ${ctx.weeklyWorkouts} workouts this week! That's elite consistency. Make sure you're prioritizing recovery — adequate sleep and protein (you're at ${ctx.todayProtein}g today) are key for muscle repair and progress toward your ${ctx.goal} goal.`;
    return `${name}, you've logged ${ctx.weeklyWorkouts} workout${ctx.weeklyWorkouts > 1 ? "s" : ""} this week — solid effort! For your ${ctx.goal} goal at a ${ctx.activityLevel} activity level, aim for 4-5 sessions per week. Add one more session this week to stay on track.`;
  }

  if (msg.includes("sleep") || msg.includes("rest") || msg.includes("tired") || msg.includes("fatigue")) {
    if (simpleMode) return `${name}, aim for a calm bedtime, less screen time before sleep, and a consistent wake-up time. Your recent average is ${ctx.avgSleepHours || "not logged"} hours.`;
    if (ctx.avgSleepHours === 0) return `${name}, I don't see any sleep logs yet. Tracking your sleep is crucial — it directly impacts your ${ctx.goal} progress, hormone balance, and energy levels. Try logging your sleep tonight!`;
    if (ctx.avgSleepHours < 6.5) return `${name}, your average sleep is ${ctx.avgSleepHours} hours — that's below optimal. Poor sleep increases cortisol, reduces muscle recovery, and makes your ${ctx.goal} goal harder to achieve. Try a 10pm bedtime routine and avoid screens 1 hour before bed.`;
    if (ctx.avgSleepHours >= 7.5) return `${name}, your ${ctx.avgSleepHours}-hour average sleep is excellent! Quality sleep supports your ${ctx.goal} goal by optimizing hormone production, muscle recovery, and metabolism. Keep this up — it's one of your biggest strengths.`;
    return `${name}, your ${ctx.avgSleepHours}-hour average sleep is in a good range. To optimize it further, try to keep a consistent sleep schedule and ensure your room is dark and cool. This will support your ${ctx.goal} progress significantly.`;
  }

  if (msg.includes("water") || msg.includes("hydrat") || msg.includes("drink")) {
    if (simpleMode) return `${name}, drink water with each meal and keep a bottle nearby. You have logged about ${waterGlasses} glass${waterGlasses !== 1 ? "es" : ""} today.`;
    if (waterGlasses === 0) return `${name}, you haven't logged any water today! Hydration is foundational — dehydration reduces performance and slows metabolism. Start with 2 glasses now and aim for 8-10 throughout the day. Your body will thank you!`;
    if (waterGlasses >= 8) return `${name}, fantastic hydration — you've had ${waterGlasses} glasses today! Well-hydrated cells perform better, your joints are lubricated, and your metabolism is firing optimally. This definitely supports your ${ctx.goal} goal.`;
    return `${name}, you've had ${waterGlasses} glass${waterGlasses > 1 ? "es" : ""} of water today — keep going! Aim for ${10 - waterGlasses} more glasses to hit your daily target. Proper hydration boosts energy and supports your ${ctx.goal} journey.`;
  }

  if (msg.includes("weight") || msg.includes("progress") || msg.includes("result")) {
    if (simpleMode) return `${name}, progress comes from small daily wins: log meals, move your body, drink water, and sleep well. Keep it steady.`;
    return `${name}, progress toward ${ctx.goal} is a combination of consistent nutrition, movement, and recovery. At ${ctx.weight}kg with a ${ctx.activityLevel} activity level, your body responds best to sustainable changes. You've had ${ctx.weeklyWorkouts} workout${ctx.weeklyWorkouts !== 1 ? "s" : ""} this week and logged ${ctx.mealsCount} meal${ctx.mealsCount !== 1 ? "s" : ""} today — keep stacking those wins!`;
  }

  if (msg.includes("tip") || msg.includes("advice") || msg.includes("suggest") || msg.includes("help") || msg.includes("how")) {
    const tips = [];
    if (ctx.todayCalories < ctx.calorieGoal * 0.5 && ctx.mealsCount < 2) tips.push("Log your meals consistently — even estimating is better than skipping");
    if (ctx.weeklyWorkouts < 3) tips.push("Add one more workout this week to build your streak");
    if (ctx.avgSleepHours < 7) tips.push("Prioritize sleep — it's your #1 recovery tool");
    if (ctx.waterTodayMl < 1500) tips.push("Drink more water throughout the day");
    if (tips.length === 0) tips.push("Keep up your current routine — consistency is everything", "Consider increasing workout intensity by 10% this week", "Add more colorful vegetables to your meals for micronutrients");
    return `${name}, here are my top tips for you today:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nFocused on your ${ctx.goal} goal, these small actions compound into big results over time!`;
  }

  const greetings = ["hi", "hello", "hey", "morning", "good morning", "good evening"];
  if (greetings.some(g => msg.startsWith(g))) {
    return redirect;
  }

  const healthKeywords = ["body", "health", "habit", "goal", "coach", "track", "plan", "diet", "muscle", "fat", "energy", "routine", "steps"];
  if (!healthKeywords.some(k => msg.includes(k))) return redirect;

  return simpleMode
    ? `${name}, the best next step is one small health action today: log a meal, drink water, walk, or prepare for better sleep. Which one do you want help with?`
    : `${name}, that's a great question! Based on your ${ctx.goal} goal and your activity this week (${ctx.weeklyWorkouts} workouts, ${ctx.todayCalories} kcal today, ${ctx.avgSleepHours}h avg sleep), here's my take: consistency in tracking and small daily improvements will get you to your goal faster than any single big change. What specific area — nutrition, fitness, or sleep — would you like to dive deeper into?`;
}

router.get("/ai/messages", async (req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(aiMessagesTable)
    .orderBy(aiMessagesTable.createdAt)
    .limit(50);

  res.json(GetAiMessagesResponse.parse(messages));
});

router.post("/ai/messages", async (req, res): Promise<void> => {
  const parsed = SendAiMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(aiMessagesTable).values({
    role: "user",
    content: parsed.data.content,
  });

  const authUser = await getUserFromRequest(req);
  const ctx = await buildUserContext(authUser?.id);
  const ar = isArabicRequest(req);

  let responseContent: string;
  try {
    const recentMessages = await db
      .select()
      .from(aiMessagesTable)
      .orderBy(desc(aiMessagesTable.createdAt))
      .limit(10);
    const history = recentMessages.reverse().map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const systemPrompt = ar
      ? `أنت مدرب صحي ذكي ومحفز داخل تطبيق BodyLogic. أجب باللغة العربية، بنبرة ودودة وعملية.
ركّز فقط على: التغذية، التمارين، النوم، الترطيب، تقدم الوزن، والعادات الصحية.
استخدم بيانات المستخدم التالية (JSON) لتخصيص ردك بدقة:
${JSON.stringify(ctx, null, 2)}

قواعد:
- خاطب المستخدم باسم "${ctx.userName}" عند الحاجة.
- اجعل الرد قصيرًا (2-4 جمل) وعمليًا، مع نصيحة واحدة قابلة للتنفيذ.
- استخدم الأرقام من البيانات (سعرات، وجبات، تمارين، نوم، ماء) لجعل الإجابة شخصية.
- إذا كان السؤال غير صحي، أعد توجيه المحادثة بلطف نحو الصحة.`
      : `You are a smart, motivating health coach inside the BodyLogic app. Reply in English, friendly and practical.
Focus only on: nutrition, workouts, sleep, hydration, weight progress, and healthy habits.
Use the following user data (JSON) to personalize your reply precisely:
${JSON.stringify(ctx, null, 2)}

Rules:
- Address the user as "${ctx.userName}" when natural.
- Keep replies short (2-4 sentences) and practical, with one actionable tip.
- Use real numbers from the data (calories, meals, workouts, sleep, water) so it feels personal.
- If the question is off-topic from health, gently redirect.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 350,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(0, -1),
        { role: "user", content: parsed.data.content },
      ],
    });

    responseContent = completion.choices[0]?.message?.content?.trim()
      || generatePersonalizedResponse(parsed.data.content, ctx, ar ? "ar" : "en");
  } catch (err: any) {
    console.error("AI coach error:", err?.message ?? err);
    responseContent = generatePersonalizedResponse(parsed.data.content, ctx, ar ? "ar" : "en");
  }

  const [assistantMessage] = await db.insert(aiMessagesTable).values({
    role: "assistant",
    content: responseContent,
  }).returning();

  res.json(SendAiMessageResponse.parse(assistantMessage));
});

router.get("/ai/insights", async (req, res): Promise<void> => {
  const authUser = await getUserFromRequest(req);
  const ctx = await buildUserContext(authUser?.id);
  const ar = isArabicRequest(req);
  const behaviorAnalysis = ar
    ? (ctx.age < 18 || ctx.age >= 55
      ? "نمطك الأخير بسيط: الصباح أقوى من المساء. جرّب تسجيلًا صغيرًا في المساء ومشيًا سهلًا في نهاية الأسبوع للحفاظ على الزخم."
      : "تميل إلى تسجيل الوجبات صباحًا وتفويت تسجيل المساء. التمارين أقوى منتصف الأسبوع وتقل في نهايته؛ خطط لنشاط يوم السبت للحفاظ على الزخم.")
    : (ctx.age < 18 || ctx.age >= 55
      ? "Your recent pattern is simple: mornings are stronger than evenings. Try one small evening log and one easy weekend walk to keep momentum."
      : "You tend to log meals consistently in the mornings but skip evening logs. Your workout frequency peaks mid-week and drops on weekends. Consider scheduling a Saturday activity to maintain momentum.");
  const insights = {
    tips: ar ? [
      { id: 1, category: "nutrition" as const, title: "حافظ على الترطيب", description: "اشرب الماء بانتظام اليوم لدعم الطاقة والهضم.", priority: "high" as const },
      { id: 2, category: "fitness" as const, title: "تحرك كل ساعة", description: "خذ فواصل قصيرة للمشي أو التمدد لتقليل الخمول.", priority: "medium" as const },
      { id: 3, category: "sleep" as const, title: "ثبّت موعد النوم", description: "النوم في وقت ثابت يحسن جودة النوم والتعافي.", priority: "high" as const },
      { id: 4, category: "nutrition" as const, title: "بروتين مع كل وجبة", description: "إضافة البروتين تساعدك على الشبع والحفاظ على العضلات.", priority: "medium" as const },
    ] : healthTips.slice(0, 4),
    mealSuggestion: ar ? "جرّب وعاء كينوا مع دجاج مشوي، خضار مشوية وأفوكادو لوجبة متوازنة وغنية بالبروتين." : "Try a quinoa bowl with grilled chicken, roasted vegetables, and avocado for a balanced, nutrient-dense lunch packed with complete proteins.",
    workoutSuggestion: ar ? "جلسة HIIT لمدة 30 دقيقة مناسبة اليوم؛ تحرق سعرات بكفاءة وتناسب اليوم المزدحم، ثم أضف 10 دقائق تهدئة." : "A 30-minute HIIT session would be ideal today — it maximizes calorie burn while fitting into a busy schedule. Combine with a 10-minute cooldown stretch.",
    motivationalQuote: ar ? "كل خطوة صغيرة للأمام تُحسب. الاستمرارية أهم من المثالية." : "The only bad workout is the one that didn't happen. Every step forward counts, no matter how small.",
    behaviorAnalysis,
  };

  res.json(GetAiInsightsResponse.parse(insights));
});

router.get("/ai/morning-brief", async (req, res): Promise<void> => {
  const authUser = await getUserFromRequest(req);
  const today = new Date();
  const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const yesterdayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let userName = "there";
  let goal = "improve fitness";
  let calorieGoal = 2000;
  let waterGoalMl = 3000;

  if (authUser?.id) {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, authUser.id)).limit(1);
    if (users[0]) {
      userName = users[0].name.split(" ")[0] ?? "there";
      goal = (users[0].goal ?? "improve_fitness").replace(/_/g, " ");
    }
  }

  const profiles = await db.select().from(profileTable).limit(1);
  if (profiles[0]) {
    calorieGoal = profiles[0].dailyCalorieGoal;
    waterGoalMl = profiles[0].dailyWaterGoalMl;
  }

  const [yesterdayMeals, yesterdayWorkouts, lastSleep, yesterdayWater, weekWorkouts] = await Promise.all([
    db.select().from(mealsTable).where(and(gte(mealsTable.loggedAt, yesterdayStart), lt(mealsTable.loggedAt, yesterdayEnd))),
    db.select().from(workoutsTable).where(and(gte(workoutsTable.loggedAt, yesterdayStart), lt(workoutsTable.loggedAt, yesterdayEnd))),
    db.select().from(sleepTable).orderBy(desc(sleepTable.bedtime)).limit(1),
    db.select().from(waterLogsTable).where(and(gte(waterLogsTable.loggedAt, yesterdayStart), lt(waterLogsTable.loggedAt, yesterdayEnd))),
    db.select().from(workoutsTable).where(gte(workoutsTable.loggedAt, weekAgo)),
  ]);

  const yCals = yesterdayMeals.reduce((s, m) => s + m.calories, 0);
  const yProtein = yesterdayMeals.reduce((s, m) => s + m.protein, 0);
  const yWaterMl = yesterdayWater.reduce((s, w) => s + w.amountMl, 0);
  const yWorkoutMins = yesterdayWorkouts.reduce((s, w) => s + w.durationMinutes, 0);
  const sleepHours = lastSleep[0]?.durationHours ?? 0;
  const weeklyCount = weekWorkouts.length;
  const calDiff = yCals - calorieGoal;
  const waterGlasses = Math.round(yWaterMl / 250);

  // Build RECAP (what happened yesterday)
  let recap: string;
  let recapAr: string;

  if (yCals === 0 && yWorkoutMins === 0) {
    recap = `Yesterday was a quiet day — no meals or workouts logged. That's okay. What matters is what you do today.`;
    recapAr = `كان الأمس يومًا هادئًا — لم تُسجَّل وجبات أو تمارين. لا بأس. المهم ما ستفعله اليوم.`;
  } else if (calDiff > 300) {
    recap = `Yesterday you ate ${yCals} kcal — ${calDiff} over your ${calorieGoal} kcal goal. You also logged ${yWorkoutMins > 0 ? `${yWorkoutMins} min of exercise` : "no workouts"}. Protein: ${yProtein}g.`;
    recapAr = `تناولت أمس ${yCals} سعرة — أعلى من هدفك البالغ ${calorieGoal} بمقدار ${calDiff} سعرة. ${yWorkoutMins > 0 ? `سجّلت ${yWorkoutMins} دقيقة تمارين.` : "لم تُسجّل تمارين."} البروتين: ${yProtein}غ.`;
  } else if (calDiff < -400) {
    recap = `Yesterday you ate ${yCals} kcal — ${Math.abs(calDiff)} under your goal. ${yWorkoutMins > 0 ? `Combined with ${yWorkoutMins} min of training, your body is in recovery mode.` : "Make sure you're fueling properly."} Protein: ${yProtein}g.`;
    recapAr = `تناولت أمس ${yCals} سعرة — أقل من هدفك بـ${Math.abs(calDiff)} سعرة. ${yWorkoutMins > 0 ? `مع ${yWorkoutMins} دقيقة تمارين، جسمك في طور التعافي.` : "تأكد من تناول ما يكفي من الطاقة."} البروتين: ${yProtein}غ.`;
  } else {
    recap = `Yesterday you nailed it — ${yCals} kcal logged${yWorkoutMins > 0 ? `, ${yWorkoutMins} min of training` : ""}${sleepHours > 0 ? `, ${sleepHours}h sleep` : ""}. You're tracking exactly right.`;
    recapAr = `أبليت بلاءً حسنًا أمس — ${yCals} سعرة${yWorkoutMins > 0 ? `، ${yWorkoutMins} دقيقة تمارين` : ""}${sleepHours > 0 ? `، ${sleepHours} ساعات نوم` : ""}. أنت على المسار الصحيح تمامًا.`;
  }

  // Build PLAN (what to focus on today)
  const plans: string[] = [];
  const plansAr: string[] = [];

  if (sleepHours > 0 && sleepHours < 6.5) {
    plans.push("prioritize short rest breaks today — your sleep was short");
    plansAr.push("أعطِ جسمك استراحات قصيرة اليوم — كان نومك قصيرًا");
  }
  if (waterGlasses < 6) {
    plans.push(`drink at least 8 glasses of water — you had ${waterGlasses} yesterday`);
    plansAr.push(`اشرب 8 أكواب ماء على الأقل — شربت ${waterGlasses} أمس`);
  }
  if (weeklyCount < 3) {
    plans.push("a 30-min workout today would boost your weekly streak");
    plansAr.push("30 دقيقة تمارين اليوم ستعزز سلسلة أسبوعك");
  }
  if (yProtein < 80) {
    plans.push(`aim for more protein today — yesterday's ${yProtein}g was light`);
    plansAr.push(`ركّز على البروتين اليوم — ${yProtein}غ أمس كان قليلاً`);
  }
  if (plans.length === 0) {
    plans.push(`stay consistent with your ${goal} goal — you're building real momentum`);
    plansAr.push(`حافظ على ثباتك نحو هدف "${goal}" — أنت تبني زخمًا حقيقيًا`);
  }

  const plan = `Today's focus: ${plans.slice(0, 2).join(" and ")}.`;
  const planAr = `تركيزك اليوم: ${plansAr.slice(0, 2).join(" و")}.`;

  // Build INSIGHT (motivational + data-driven)
  const insights: Array<{ en: string; ar: string }> = [
    { en: `At ${weeklyCount} workouts this week, you're ${weeklyCount >= 4 ? "above average — keep that elite consistency" : "building your habit — every session compounds"}.`, ar: `بـ${weeklyCount} تمارين هذا الأسبوع، أنت ${weeklyCount >= 4 ? "فوق المتوسط — حافظ على هذا الثبات" : "تبني عادتك — كل جلسة لها أثر متراكم"}.` },
    { en: `${sleepHours >= 7 ? `Your ${sleepHours}h sleep is an asset — well-rested brains make better food choices.` : "Protecting your sleep is protecting your progress."}`, ar: `${sleepHours >= 7 ? `نومك ${sleepHours} ساعات ميزة حقيقية — العقل المرتاح يختار أفضل.` : "حماية نومك تعني حماية تقدمك."}` },
    { en: `Consistency beats intensity every time. Showing up daily is what separates long-term results from short bursts.`, ar: `الانتظام أقوى من الشدة دائمًا. الالتزام اليومي هو ما يصنع النتائج الحقيقية.` },
  ];
  const pick = insights[weeklyCount % insights.length] ?? insights[0]!;

  res.json({
    recap,
    recapAr,
    plan,
    planAr,
    insight: pick.en,
    insightAr: pick.ar,
    userName,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
