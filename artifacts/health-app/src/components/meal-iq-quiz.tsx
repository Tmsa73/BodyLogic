import { useMemo, useState, useEffect } from "react";
import { Brain, CheckCircle2, RotateCcw, Sparkles, XCircle, Coins, Clock, Lock, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playGamificationSound } from "@/lib/sounds";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProgressQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useLang } from "@/contexts/language-context";

const QUIZ_COOLDOWN_KEY = "bodylogic-quiz-cooldown";
const COOLDOWN_MS = 60 * 60 * 1000;

async function awardGameReward(xp: number, source: string): Promise<void> {
  try {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    await fetch(`${base}/api/progress/award-game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xp, source }),
      credentials: "include",
    });
  } catch {}
}

function getLastPlayed(): number {
  try { return parseInt(localStorage.getItem(QUIZ_COOLDOWN_KEY) ?? "0", 10); } catch { return 0; }
}

function setLastPlayed() {
  try { localStorage.setItem(QUIZ_COOLDOWN_KEY, String(Date.now())); } catch {}
}

function getCooldownRemaining(): number {
  const last = getLastPlayed();
  if (!last) return 0;
  const remaining = COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

type Question = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

const BASE_QUESTIONS: Question[] = [
  { question: "Which plate is usually best for steady energy?", options: ["Mostly refined carbs", "Protein + fiber + colorful plants", "Only fruit juice", "Skipping meals"], correct: 1, explanation: "Protein, fiber, and plants slow digestion and keep energy more stable." },
  { question: "What raises Meal IQ most for a meal?", options: ["More sugar", "Balanced macros and micronutrients", "Eating very fast", "No water all day"], correct: 1, explanation: "Meal IQ rewards protein, fiber, healthy carbs/fats, and nutrient density." },
  { question: "A quick way to improve lunch is to add:", options: ["A sugary drink", "A lean protein source", "Extra fried toppings", "Nothing but bread"], correct: 1, explanation: "Lean protein supports fullness, muscle repair, and balanced calories." },
  { question: "Which snack is the smartest default?", options: ["Greek yogurt with berries", "Candy only", "Soda", "Plain chips"], correct: 0, explanation: "It combines protein, fiber, and micronutrients without a large sugar spike." },
  { question: "If dinner is low in fiber, add:", options: ["Leafy greens or beans", "More butter only", "A second dessert", "Skip water"], correct: 0, explanation: "Greens and beans are efficient ways to boost fiber and fullness." },
  { question: "For hydration, a good first step is:", options: ["Wait until night", "Drink water with meals", "Only drink caffeine", "Avoid fluids"], correct: 1, explanation: "Pairing water with meals makes hydration easier to remember." },
  { question: "Which cooking method preserves the most nutrients?", options: ["Deep frying", "Boiling for a long time", "Steaming or light sautéing", "Microwaving in oil"], correct: 2, explanation: "Steaming keeps water-soluble vitamins intact and uses minimal added fat." },
  { question: "What is the primary purpose of dietary fiber?", options: ["Builds muscle", "Supports digestion and gut health", "Provides quick energy", "Replaces protein"], correct: 1, explanation: "Fiber feeds good gut bacteria, slows sugar absorption, and improves digestion." },
  { question: "Which oil is best for heart health when cooking?", options: ["Coconut oil exclusively", "Lard", "Extra virgin olive oil", "Vegetable shortening"], correct: 2, explanation: "Olive oil is rich in monounsaturated fats linked to lower heart disease risk." },
  { question: "How many servings of vegetables are recommended daily?", options: ["1 serving", "2–3 servings", "5+ servings", "None if you take supplements"], correct: 2, explanation: "Most guidelines recommend at least 5 portions of fruits and vegetables per day." },
  { question: "Which food is highest in omega-3 fatty acids?", options: ["White bread", "Salmon", "White rice", "Cheese"], correct: 1, explanation: "Fatty fish like salmon are among the richest sources of anti-inflammatory omega-3s." },
  { question: "What happens when you eat too fast?", options: ["Better digestion", "You tend to overeat before feeling full", "More nutrients absorbed", "Nothing different"], correct: 1, explanation: "Hunger hormones take ~20 minutes to signal fullness — eating fast bypasses this." },
  { question: "Which breakfast choice provides the most sustained energy?", options: ["Sugary cereal", "Oats with nuts and fruit", "White toast only", "Energy drink"], correct: 1, explanation: "Oats have complex carbs + fiber; nuts add protein and fat for lasting fuel." },
  { question: "What does 'empty calories' mean?", options: ["Very low calorie food", "Calories with no nutritional value", "Calories from vegetables", "Negative calorie foods"], correct: 1, explanation: "Foods like soda or candy provide energy without vitamins, minerals, or fiber." },
  { question: "Which mineral is most important for bone health?", options: ["Iron", "Calcium", "Sodium", "Copper"], correct: 1, explanation: "Calcium is the primary building block of bones and teeth." },
  { question: "How does a Mediterranean diet reduce disease risk?", options: ["By eliminating all fats", "High sugar intake", "Rich in produce, whole grains, legumes, and olive oil", "Zero carbohydrates"], correct: 2, explanation: "The Med diet is associated with lower rates of heart disease, diabetes, and obesity." },
  { question: "Which vitamin requires sunlight for synthesis in the body?", options: ["Vitamin C", "Vitamin D", "Vitamin B12", "Vitamin A"], correct: 1, explanation: "Skin exposure to UVB rays triggers Vitamin D production — crucial for bones and immunity." },
  { question: "What is the role of protein at breakfast?", options: ["Increases sugar cravings", "Reduces hunger and helps muscle maintenance", "Slows metabolism", "No benefit at breakfast"], correct: 1, explanation: "Protein raises satiety hormones and reduces mid-morning energy crashes." },
  { question: "Which is a complete protein source?", options: ["White rice alone", "Eggs", "White bread", "Lettuce"], correct: 1, explanation: "Eggs contain all 9 essential amino acids your body cannot produce itself." },
  { question: "What is the glycemic index?", options: ["A measure of calories in food", "How quickly a food raises blood sugar", "Protein content of food", "Fat density ranking"], correct: 1, explanation: "High GI foods spike blood sugar fast; low GI foods cause a slower, steadier rise." },
  { question: "Which Arabian dish is traditionally high in protein?", options: ["Kunafa", "Kabsa with chicken", "Luqaimat", "Halwa"], correct: 1, explanation: "Kabsa with chicken or lamb provides significant protein alongside rice and spices." },
  { question: "What makes dates a smart snack?", options: ["Zero calories", "Natural sugars plus fiber, potassium, and magnesium", "No sugar at all", "High in fat"], correct: 1, explanation: "Dates are nutrient-dense with minerals and fiber, making them better than refined sweets." },
  { question: "Which nutrient is a primary source of energy for the brain?", options: ["Fat", "Protein", "Glucose (from carbs)", "Fiber"], correct: 2, explanation: "The brain runs primarily on glucose; consistent carb intake keeps cognition sharp." },
  { question: "What is a benefit of eating legumes (lentils, beans, chickpeas)?", options: ["Very low in nutrients", "High fiber and plant protein with low fat", "Cause blood sugar spikes", "Only suitable for weight gain"], correct: 1, explanation: "Legumes are one of the most nutrient-dense, budget-friendly foods you can eat." },
  { question: "How much water should most adults drink daily?", options: ["500ml total", "About 2–3 liters", "Only when very thirsty", "10+ liters"], correct: 1, explanation: "Around 2–3 liters per day (including food water) supports metabolism and organ function." },
  { question: "Which is a sign of a nutrient-dense meal?", options: ["Bright neon color from artificial dyes", "Short ingredient list of whole foods", "Many additives and preservatives", "Comes in individual candy wrappers"], correct: 1, explanation: "Whole foods with few ingredients tend to pack more vitamins and minerals per calorie." },
  { question: "What does 'eating the rainbow' mean?", options: ["Eating candy of every color", "Consuming a variety of colorful whole fruits and vegetables", "Drinking colored beverages", "Mixing food dyes in meals"], correct: 1, explanation: "Different pigments in produce represent different antioxidants and phytonutrients." },
  { question: "Which spice is known for its anti-inflammatory properties?", options: ["Plain salt", "Turmeric", "Sugar", "Artificial flavor"], correct: 1, explanation: "Curcumin in turmeric has strong anti-inflammatory and antioxidant effects." },
  { question: "What is the healthiest way to sweeten food?", options: ["White sugar in large amounts", "Fresh fruit or a small amount of raw honey", "Artificial sweeteners in excess", "High-fructose corn syrup"], correct: 1, explanation: "Natural fruit brings sweetness along with fiber and micronutrients — a better trade-off." },
  { question: "What does intermittent fasting primarily help with?", options: ["Building more fat reserves", "Calorie control and metabolic flexibility", "Eliminating all nutrients", "Only muscle gain"], correct: 1, explanation: "IF helps many people reduce overall calorie intake and improve insulin sensitivity." },
  { question: "Which macronutrient takes longest to digest?", options: ["Simple sugars", "Fat", "Refined carbs", "Plain water"], correct: 1, explanation: "Fat digestion is slow, which is why fatty meals keep you full longer." },
  { question: "What is a key benefit of fermented foods like yogurt and kefir?", options: ["Very high in saturated fat", "Support gut microbiome with probiotics", "Contain no calories", "Replace all protein needs"], correct: 1, explanation: "Probiotics in fermented foods promote a healthy gut and stronger immune response." },
  { question: "Which food group should form the base of a healthy meal?", options: ["Processed meats", "Vegetables and whole grains", "Fried snacks", "Sugary drinks"], correct: 1, explanation: "Non-starchy vegetables and whole grains provide fiber, vitamins, and minerals with fewer calories." },
  { question: "What is a hidden source of excess sodium in many diets?", options: ["Fresh vegetables", "Packaged and processed foods", "Plain water", "Fresh fruit"], correct: 1, explanation: "Most dietary sodium comes from processed foods, not added table salt." },
  { question: "Which Arabian food is a great source of complex carbohydrates?", options: ["Ghee only", "Whole wheat khubz (bread)", "Luqaimat fried dough", "Plain sugar tea"], correct: 1, explanation: "Whole wheat khubz provides fiber and complex carbs that release energy gradually." },
];

function pickQuestions() {
  return [...BASE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function MealIqQuiz({ children, score }: { children: React.ReactNode; score?: number | null }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(() => pickQuestions());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsAwarded, setCoinsAwarded] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(getCooldownRemaining);
  const qc = useQueryClient();
  const { t } = useLang();

  const current = questions[index]!;
  const answered = answers[index] !== undefined;
  const selected = answers[index];
  const correctCount = answers.reduce((sum, answer, i) => sum + (answer === questions[i]?.correct ? 1 : 0), 0);
  const complete = answers.length === questions.length;
  const onCooldown = cooldownRemaining > 0;

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      const rem = getCooldownRemaining();
      setCooldownRemaining(rem);
      if (rem === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const recommendation = useMemo(() => {
    if (!score) return "Log more meals to unlock more personalized nutrition questions.";
    if (score >= 22) return "Your Meal IQ is strong. Focus on consistency and variety.";
    if (score >= 16) return "You are close. Add protein and fiber to push your score higher.";
    return "Start simple: protein, vegetables, water, and fewer sugary extras.";
  }, [score]);

  const reset = () => {
    setQuestions(pickQuestions());
    setIndex(0);
    setAnswers([]);
    setCoinsEarned(0);
    setXpEarned(0);
    setCoinsAwarded(false);
    setCooldownRemaining(getCooldownRemaining());
  };

  const choose = async (answer: number) => {
    if (answered) return;
    const next = [...answers];
    next[index] = answer;
    setAnswers(next);
    playGamificationSound(answer === current.correct ? "xp" : "toggle");

    const newCorrect = next.reduce((sum, a, i) => sum + (a === questions[i]?.correct ? 1 : 0), 0);
    if (next.length === questions.length && !coinsAwarded) {
      if (!onCooldown) {
        const correctRatio = newCorrect / questions.length;
        const xp = correctRatio >= 1 ? 50 : correctRatio >= 0.8 ? 35 : correctRatio >= 0.6 ? 20 : 10;
        const coins = correctRatio >= 1 ? 15 : correctRatio >= 0.8 ? 10 : correctRatio >= 0.6 ? 5 : 2;
        setCoinsEarned(coins);
        setXpEarned(xp);
        setLastPlayed();
        setCooldownRemaining(COOLDOWN_MS);
        playGamificationSound("coins");
        await awardGameReward(xp, "meal_iq_quiz");
        qc.invalidateQueries({ queryKey: getGetProgressQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
      setCoinsAwarded(true);
    }
  };

  const scoreColor =
    correctCount === questions.length ? "text-primary" :
    correctCount >= questions.length - 1 ? "text-yellow-400" :
    correctCount >= 3 ? "text-orange-400" : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { reset(); setCooldownRemaining(getCooldownRemaining()); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 px-5 pt-5 pb-4 border-b border-border/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-black text-base leading-tight">{t("mealiq_title")}</p>
                {onCooldown && !complete && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-500 mt-0.5">
                    <Clock className="w-2.5 h-2.5" /> {t("home_play_for_fun")}
                  </span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Progress bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black text-primary uppercase tracking-wider">
                {t("mealiq_card")} {Math.min(index + 1, questions.length)} {t("mealiq_of")} {questions.length}
              </span>
              <span className="font-bold text-muted-foreground">{correctCount}/{questions.length} {t("mealiq_correct")}</span>
            </div>
            <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                style={{ width: `${(answers.length / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!complete ? (
            <>
              <div className="space-y-1">
                <p className="text-base font-black leading-snug">{current.question}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{recommendation}</p>
              </div>

              <div className="space-y-2">
                {current.options.map((option, i) => {
                  const isCorrect = i === current.correct;
                  const isSelected = selected === i;
                  const label = OPTION_LABELS[i];
                  return (
                    <button
                      key={option}
                      onClick={() => choose(i)}
                      className={cn(
                        "w-full p-3 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center gap-3 active:scale-[0.98]",
                        !answered && "bg-card border-border/50 hover:border-primary/40 hover:bg-primary/5",
                        answered && isCorrect && "bg-primary/10 border-primary/50 text-primary",
                        answered && isSelected && !isCorrect && "bg-destructive/10 border-destructive/40 text-destructive",
                        answered && !isSelected && !isCorrect && "bg-muted/30 border-border/20 text-muted-foreground opacity-60"
                      )}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all",
                        !answered && "bg-muted/60 text-muted-foreground",
                        answered && isCorrect && "bg-primary text-primary-foreground",
                        answered && isSelected && !isCorrect && "bg-destructive text-destructive-foreground",
                        answered && !isSelected && !isCorrect && "bg-muted/40 text-muted-foreground/50"
                      )}>
                        {answered && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                         answered && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                         label}
                      </span>
                      <span className="flex-1 leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="rounded-2xl bg-muted/40 border border-border/30 p-3.5 space-y-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80 leading-relaxed">{current.explanation}</p>
                  </div>
                  <Button className="w-full rounded-xl h-10 font-bold" onClick={() => setIndex(i => i + 1)}>
                    {index === questions.length - 1 ? t("mealiq_finish") : t("mealiq_next")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-1 space-y-4">
              <div className="relative inline-flex">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex flex-col items-center justify-center mx-auto">
                  <span className={cn("text-3xl font-black", scoreColor)}>{correctCount}</span>
                  <span className="text-xs text-muted-foreground font-semibold">/ {questions.length}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
              </div>

              <div>
                <p className="font-black text-lg">{t("mealiq_complete")}</p>
                <p className={cn("text-sm font-semibold mt-1", scoreColor)}>
                  {correctCount === questions.length ? t("mealiq_perfect") :
                   correctCount >= questions.length - 1 ? t("mealiq_great") :
                   correctCount >= 3 ? t("mealiq_good") :
                   t("mealiq_keep")}
                </p>
              </div>

              {coinsEarned > 0 ? (
                <div className="rounded-2xl bg-gradient-to-r from-yellow-500/15 to-orange-500/10 border border-yellow-500/30 p-4 space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <p className="text-xl font-black text-yellow-400">+{coinsEarned} {t("mealiq_coins_earned")}</p>
                  </div>
                  {xpEarned > 0 && (
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <p className="text-sm font-bold text-primary">+{xpEarned} XP added to your profile!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-muted/40 border border-border/40 p-4 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-black text-muted-foreground">{t("mealiq_cooldown")}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-sm font-black text-amber-500">
                      {t("mealiq_next_reward")} {formatRemaining(cooldownRemaining)}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t("mealiq_play_fun")}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" className="rounded-xl h-10" onClick={reset}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> {t("mealiq_replay")}
                </Button>
                <Button className="rounded-xl h-10" onClick={() => setOpen(false)}>
                  {t("mealiq_done")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
