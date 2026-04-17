import { Router, type IRouter } from "express";
import { eq, and, gte, lt, count } from "drizzle-orm";
import { db, mealsTable, profileTable } from "@workspace/db";
import {
  GetMealsResponse,
  LogMealBody,
  DeleteMealParams,
  GetNutritionSummaryResponse,
  GetMealStreakResponse,
} from "@workspace/api-zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
});

// Curated food reference list — used to ground AI image recognition to known items
const FOOD_REFERENCE_NAMES = [
  "Kabsa with Chicken","Kabsa with Lamb","Mandi Chicken","Mandi Lamb","Machboos","Harees","Jareesh","Saleeg","Margoog","Maqluba","Mansaf","Biryani",
  "Shawarma Wrap Chicken","Shawarma Wrap Meat","Falafel Wrap","Hummus","Baba Ganoush","Labneh","Fattoush","Tabbouleh","Kibbeh","Warak Dawali","Fatteh",
  "Mutton Saloona","Mufattah","Chicken Saloona","Samboosa","Luqaimat","Dates","Knafeh","Baklava","Umm Ali","Muhallabia","Shakshuka","Ful Medames",
  "Arabic Bread Khubz","Za'atar Manakeesh","Halloumi","Dolma","Molokhia","Koshari","Mahyawa","Grilled Chicken","Grilled Salmon","Tuna Salad","Caesar Salad",
  "Oatmeal","Scrambled Eggs","Boiled Eggs","Avocado Toast","Greek Yogurt","Banana","Apple","Mixed Fruits","Protein Shake","Smoothie Bowl","Overnight Oats",
  "Pasta Bolognese","Pasta Carbonara","Pizza Margherita","Cheeseburger","Chicken Sandwich","Grilled Steak","Salmon Fillet","Chicken Breast","Rice with Vegetables",
  "Lentil Soup","Vegetable Soup","Chicken Soup","Sushi Roll","Pad Thai","Fried Rice","Stir Fry","Noodles","Dumplings","Spring Rolls",
  "Caesar Salad","Garden Salad","Greek Salad","Quinoa Bowl","Acai Bowl","Granola","Pancakes","Waffles","French Toast","Croissant","Muffin",
  "Chocolate Cake","Cheesecake","Ice Cream","Fruit Salad","Watermelon","Orange","Grapes","Mixed Nuts","Almonds","Peanut Butter",
];


const router: IRouter = Router();

router.get("/meals", async (req, res): Promise<void> => {
  const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;

  let meals;
  if (dateParam) {
    const dayStart = new Date(`${dateParam}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateParam}T23:59:59.999Z`);
    meals = await db
      .select()
      .from(mealsTable)
      .where(and(gte(mealsTable.loggedAt, dayStart), lt(mealsTable.loggedAt, dayEnd)))
      .orderBy(mealsTable.loggedAt);
  } else {
    meals = await db.select().from(mealsTable).orderBy(mealsTable.loggedAt);
  }

  res.json(GetMealsResponse.parse(meals));
});

router.post("/meals", async (req, res): Promise<void> => {
  const parsed = LogMealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [meal] = await db.insert(mealsTable).values({
    name: parsed.data.name,
    calories: parsed.data.calories,
    protein: parsed.data.protein,
    carbs: parsed.data.carbs,
    fat: parsed.data.fat,
    fiber: parsed.data.fiber ?? 0,
    sugar: parsed.data.sugar ?? 0,
    vitamins: parsed.data.vitamins ?? null,
    mealType: parsed.data.mealType,
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json(meal);
});

router.delete("/meals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteMealParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(mealsTable).where(eq(mealsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/nutrition/summary", async (req, res): Promise<void> => {
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayMeals = await db
    .select()
    .from(mealsTable)
    .where(and(gte(mealsTable.loggedAt, dayStart), lt(mealsTable.loggedAt, dayEnd)));

  const profiles = await db.select().from(profileTable).limit(1);
  const calorieGoal = profiles[0]?.dailyCalorieGoal ?? 2000;

  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = todayMeals.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = todayMeals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = todayMeals.reduce((s, m) => s + m.fat, 0);
  const totalFiber = todayMeals.reduce((s, m) => s + m.fiber, 0);
  const totalSugar = todayMeals.reduce((s, m) => s + m.sugar, 0);

  const totalMacroGrams = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;
  const summary = {
    date: today.toISOString().split("T")[0]!,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalFiber,
    totalSugar,
    calorieGoal,
    mealsCount: todayMeals.length,
    macroBreakdown: {
      proteinPercent: totalMacroGrams > 0 ? Math.round((totalProtein * 4 / totalMacroGrams) * 100) : 30,
      carbsPercent: totalMacroGrams > 0 ? Math.round((totalCarbs * 4 / totalMacroGrams) * 100) : 45,
      fatPercent: totalMacroGrams > 0 ? Math.round((totalFat * 9 / totalMacroGrams) * 100) : 25,
    },
  };

  res.json(GetNutritionSummaryResponse.parse(summary));
});

router.get("/nutrition/streak", async (req, res): Promise<void> => {
  const allMeals = await db
    .select({ loggedAt: mealsTable.loggedAt })
    .from(mealsTable)
    .orderBy(mealsTable.loggedAt);

  const loggedDays = new Set(allMeals.map((m) => m.loggedAt.toISOString().split("T")[0]!));
  const days = Array.from(loggedDays).sort().reverse();

  let currentStreak = 0;
  const today = new Date().toISOString().split("T")[0]!;
  let checkDate = today;

  for (const day of days) {
    if (day === checkDate) {
      currentStreak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0]!;
    } else {
      break;
    }
  }

  const streak = {
    currentStreak,
    longestStreak: Math.max(currentStreak, days.length > 0 ? 7 : 0),
    lastLoggedDate: days[0] ?? null,
  };

  res.json(GetMealStreakResponse.parse(streak));
});

router.post("/nutrition/analyze-food-image", async (req, res): Promise<void> => {
  const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const imgMime = (mimeType ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const dataUrl = `data:${imgMime};base64,${imageBase64}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "low" },
            },
            {
              type: "text",
              text: `You are an expert nutritionist and food recognition AI with comprehensive knowledge of global cuisines including Middle Eastern, Arabian, Gulf, Levantine, North African, South Asian, East Asian, Mediterranean, Western, and all other world cuisines.

FOOD DATABASE REFERENCE — Try to match the food in the image to one of these names exactly if possible:
${FOOD_REFERENCE_NAMES.join(", ")}

If the food matches one from the list above, use that exact name. Otherwise, use the best descriptive English name.

Analyze this food image and return ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "name": "dish name in English (prefer exact match from database list above)",
  "calories": number (for a standard serving),
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams),
  "sugar": number (grams),
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "confidence": "high" | "medium" | "low",
  "description": "brief 1-sentence description of what you see"
}

Use realistic nutritional values for a standard serving size. Make your best identification attempt even if the image is not perfect — set confidence to "low" if uncertain but still provide your best estimate. Only use "Unknown food" if the image contains absolutely no food.`,
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      parsed = { name: "Unknown food", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, mealType: "snack", confidence: "low", description: "Could not identify food." };
    }

    res.json(parsed);
  } catch (err: any) {
    console.error("Food analysis error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to analyze image. Please try again." });
  }
});

export default router;
