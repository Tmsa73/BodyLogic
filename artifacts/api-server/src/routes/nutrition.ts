import { Router, type IRouter } from "express";
import { eq, and, gte, lt, count } from "drizzle-orm";
import { db, mealsTable, profileTable, xpLogsTable } from "@workspace/db";
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

// Curated food reference list — used to ground AI image recognition to known items.
// Names here mirror the client-side food-database.ts so the UI can match exact entries.
const FOOD_REFERENCE_NAMES = [
  // Arabian / Gulf / Levantine
  "Kabsa with Chicken","Kabsa with Lamb","Mandi Chicken","Mandi Lamb","Machboos","Harees","Jareesh","Saleeg","Margoog","Maqluba","Mansaf","Biryani",
  "Shawarma Wrap (Chicken)","Shawarma Wrap (Meat)","Falafel Wrap","Falafel Plate","Hummus with Bread","Hummus with Olive Oil","Baba Ganoush",
  "Labneh with Za'atar","Fattoush Salad","Tabbouleh","Kibbeh (3 pieces)","Warak Dawali (Stuffed Vine Leaves)","Fatteh (Chickpea)",
  "Saloona (Chicken Stew)","Mutabbaq (Meat)","Samboosa (3 pieces)","Luqaimat","Dates","Knafeh","Baklava","Umm Ali","Muhallabia","Shakshuka","Ful Medames",
  "Arabic Bread (Khubz)","Whole Wheat Khubz","Za'atar Manakeesh","Halloumi","Dolma (Rice-stuffed)","Molokhia with Chicken","Koshari","Musakhan","Shish Tawook",
  "Mlukhiya","Sayadieh","Sahlab (Hot Milk Drink)","Jallab Drink","Tamarind Juice","Date Smoothie with Milk","Madhbi","Aseeda","Balaleet","Chebab","Khanfaroosh",
  "Qatayef","Basbousa","Ouzi","Freekeh","Mujadara","Foul","Manakish Cheese","Manakish Za'atar","Sambousek with Spinach",
  // Burgers / fast food / sandwiches
  "Hamburger","Cheeseburger","Double Cheeseburger","Chicken Burger","French Fries (Medium)","Sweet Potato Fries","Onion Rings","Hot Dog",
  "Chicken Nuggets (6 pcs)","Fried Chicken (2 pieces)","Buffalo Wings (6)","BBQ Ribs","Pulled Pork Sandwich","Club Sandwich","Tuna Sandwich",
  "Egg Salad Sandwich","BLT Sandwich",
  // Breakfast / pastries / sweets
  "Avocado Toast","Bagel with Cream Cheese","English Muffin","Pancakes (Stack of 3)","Waffles with Syrup","French Toast","Crepes (Sweet)",
  "Croissant Plain","Chocolate Croissant","Donut Glazed","Donut Chocolate","Cinnamon Roll","Blueberry Muffin","Chocolate Chip Cookie",
  "Brownie","Chocolate Cake Slice","Cheesecake Slice","Tiramisu","Ice Cream (2 scoops)","Frozen Yogurt","Apple Pie Slice",
  // Pizza / Italian
  "Pizza Margherita Slice","Pizza Pepperoni Slice","Pizza Hawaiian Slice","Calzone","Garlic Bread","Bruschetta (3 pieces)",
  "Pasta Carbonara","Pasta Bolognese","Pasta Alfredo","Spaghetti Marinara","Lasagna","Mac and Cheese","Risotto Mushroom",
  // Asian
  "Sushi Roll California (8 pcs)","Sushi Roll Salmon (8 pcs)","Sushi Roll Tuna (8 pcs)","Sashimi (Mixed)","Ramen Bowl","Udon Noodles",
  "Pho Bowl","Pad Thai","Pad See Ew","Green Curry Chicken","Red Curry","Tom Yum Soup",
  // Indian
  "Chicken Tikka Masala","Butter Chicken","Chicken Biryani","Lamb Vindaloo","Naan Bread","Garlic Naan","Samosa (2 pieces)",
  // Mexican
  "Tacos (2 pieces)","Burrito","Quesadilla","Nachos with Cheese","Guacamole with Chips",
  // Proteins / mains
  "Salmon Fillet Grilled","Tuna Steak","Shrimp Grilled","Lobster Tail","Calamari Fried","Steak Ribeye","Steak Sirloin","Filet Mignon",
  "Lamb Chops","Pork Chop","Roast Chicken (Quarter)","Turkey Slice (4 oz)",
  // Salads / bowls / healthy
  "Caesar Salad with Chicken","Greek Salad","Cobb Salad","Quinoa Bowl","Buddha Bowl","Acai Bowl","Smoothie Bowl",
  "Greek Yogurt with Honey","Granola with Milk","Oatmeal with Fruit","Overnight Oats","Protein Pancakes",
  "Egg White Omelet","Scrambled Eggs (3)","Boiled Eggs (2)","Eggs Benedict","Bacon (3 strips)","Sausage Links (2)","Hash Browns",
  // Fruits / snacks / nuts
  "Banana","Apple","Orange","Strawberries (1 cup)","Blueberries (1 cup)","Watermelon Slice","Grapes (1 cup)","Mango","Pineapple Slice",
  "Avocado (Half)","Almonds (1 oz)","Walnuts (1 oz)","Mixed Nuts","Peanut Butter (2 tbsp)","Protein Bar","Protein Shake","Energy Bar",
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

  const baseXP = 25;
  const protein = parsed.data.protein ?? 0;
  const fiber = parsed.data.fiber ?? 0;
  const sugar = parsed.data.sugar ?? 0;
  const calories = parsed.data.calories;
  let bonusXP = 0;
  if (protein >= 25) bonusXP += 10;
  if (fiber >= 5) bonusXP += 10;
  if (sugar <= 10) bonusXP += 5;
  if (calories > 0 && calories <= 600) bonusXP += 5;
  const totalXP = baseXP + bonusXP;
  const coinsEarned = Math.floor(totalXP / 10);

  await db.insert(xpLogsTable).values({ source: "meal_logged", amount: totalXP });

  res.status(201).json({ ...meal, xpEarned: totalXP, coinsEarned });
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
      model: "gpt-5.4",
      max_tokens: 800,
      response_format: { type: "json_object" },
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
