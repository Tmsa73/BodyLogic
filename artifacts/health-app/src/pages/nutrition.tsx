import { useState, useRef, useEffect } from "react";
import {
  useGetNutritionSummary, useGetMeals, useLogMeal, useDeleteMeal, useGetMealStreak, useGetDailyMealIQ,
  getGetNutritionSummaryQueryKey, getGetMealsQueryKey, getGetMealStreakQueryKey, getGetDailyMealIQQueryKey
} from "@workspace/api-client-react";
import { useLang } from "@/contexts/language-context";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Flame, Brain, Trophy, Utensils, Camera, ImagePlus, Sparkles, CheckCircle2, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MealIqQuiz } from "@/components/meal-iq-quiz";
import { playGamificationSound } from "@/lib/sounds";
import { searchFoods, type FoodItem } from "@/lib/food-database";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat;
  const cx = 60; const cy = 60; const r = 48; const strokeW = 14;
  const circ = 2 * Math.PI * r;

  const segments = [
    { value: protein, color: "#00D4A0", label: "Protein", bg: "bg-[#00D4A0]" },
    { value: carbs,   color: "#4F8EF7", label: "Carbs",   bg: "bg-[#4F8EF7]" },
    { value: fat,     color: "#A855F7", label: "Fat",     bg: "bg-[#A855F7]" },
  ];

  let offset = 0;
  const arcs = segments.map(seg => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circ;
    const gap = circ - dash;
    const arc = { ...seg, pct, dashArray: `${dash} ${gap}`, dashOffset: circ - offset * circ };
    offset += pct;
    return arc;
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeW} />
          {total === 0 ? null : arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeW}
              strokeLinecap="butt"
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-1000"
            />
          ))}
          <text x={cx} y={cy - 5} textAnchor="middle" style={{ fill: "hsl(var(--foreground))", fontSize: "16px", fontWeight: "900" }}>{total}g</text>
          <text x={cx} y={cy + 10} textAnchor="middle" style={{ fill: "hsl(var(--muted-foreground))", fontSize: "9px" }}>total</text>
        </svg>
      </div>
      <div className="flex-1 space-y-2.5">
        {arcs.map(arc => (
          <div key={arc.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: arc.color }} />
                <span className="text-xs font-semibold text-foreground">{arc.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black" style={{ color: arc.color }}>{arc.value}g</span>
                <span className="text-[10px] text-muted-foreground">{total > 0 ? Math.round(arc.pct * 100) : 0}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${total > 0 ? arc.pct * 100 : 0}%`, backgroundColor: arc.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroGoalBar({ value, goal, color, label }: { value: number; goal: number; color: string; label: string }) {
  const pct = Math.min(100, goal > 0 ? Math.round((value / goal) * 100) : 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}g <span className="text-muted-foreground font-normal">/ {goal}g</span></span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Nutrition() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", mealType: "lunch" });
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ confidence: string; description: string } | null>(null);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsFromDb, setSuggestionsFromDb] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameChange = (value: string) => {
    setForm(f => ({ ...f, name: value }));
    if (value.trim().length >= 2) {
      const results = searchFoods(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSuggestionsFromDb(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsFromDb(false);
    }
  };

  const applyFoodSuggestion = (food: FoodItem) => {
    setForm({
      name: food.name,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
      fiber: String(food.fiber),
      sugar: String(food.sugar),
      mealType: food.mealType,
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionsFromDb(false);
    playGamificationSound("toggle");
  };
  const today = new Date().toISOString().split("T")[0]!;
  
  const { data: summary, isLoading } = useGetNutritionSummary();
  const { data: meals } = useGetMeals({ date: today }, { query: { queryKey: getGetMealsQueryKey({ date: today }) } });
  const { data: streak } = useGetMealStreak();
  const { data: mealIQ } = useGetDailyMealIQ();
  const logMeal = useLogMeal();
  const deleteMeal = useDeleteMeal();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();

  const handleAdd = () => {
    if (!form.name || !form.calories) return;
    logMeal.mutate({ data: {
      name: form.name,
      calories: Number(form.calories),
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      fiber: Number(form.fiber) || 0,
      sugar: Number(form.sugar) || 0,
      mealType: form.mealType as any,
    }}, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetNutritionSummaryQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMealsQueryKey({ date: today }) });
        qc.invalidateQueries({ queryKey: getGetMealStreakQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDailyMealIQQueryKey() });
        setOpen(false);
        setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", mealType: "lunch" });
        toast({ title: "Meal logged!", description: `${form.name} added to your log.` });
        playGamificationSound("xp");
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteMeal.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetNutritionSummaryQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMealsQueryKey({ date: today }) });
        toast({ title: "Meal removed" });
      }
    });
  };

  const handleImageScan = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Image too large", description: "Please use an image under 10MB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setScanPreview(dataUrl);
      setScanResult(null);
      setIsScanning(true);
      setOpen(true);
      try {
        const base64 = dataUrl.split(",")[1] ?? "";
        const mimeType = file.type || "image/jpeg";
        const res = await fetch(`${BASE_URL}/api/nutrition/analyze-food-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Analysis failed");
        const data = await res.json();
        setForm({
          name: data.name ?? "",
          calories: String(data.calories ?? ""),
          protein: String(data.protein ?? ""),
          carbs: String(data.carbs ?? ""),
          fat: String(data.fat ?? ""),
          fiber: String(data.fiber ?? ""),
          sugar: String(data.sugar ?? ""),
          mealType: data.mealType ?? "lunch",
        });
        setScanResult({ confidence: data.confidence ?? "medium", description: data.description ?? "" });
        toast({ title: "🤖 Food recognized!", description: data.name });
      } catch {
        toast({ title: "Could not analyze image", description: "Try a clearer photo", variant: "destructive" });
        setScanPreview(null);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading || !summary) return <NutritionSkeleton />;

  const calorieGoal = summary.calorieGoal;
  const calPct = Math.min(100, Math.round((summary.totalCalories / calorieGoal) * 100));
  const mealIQGrade = () => {
    const s = mealIQ?.score ?? 0;
    if (!s) return { grade: "N/A", color: "text-muted-foreground", bg: "bg-muted" };
    if (s >= 25) return { grade: "A+", color: "text-primary", bg: "bg-primary/15" };
    if (s >= 22) return { grade: "A", color: "text-primary", bg: "bg-primary/15" };
    if (s >= 19) return { grade: "B+", color: "text-yellow-400", bg: "bg-yellow-400/15" };
    if (s >= 16) return { grade: "B", color: "text-yellow-400", bg: "bg-yellow-400/15" };
    if (s >= 13) return { grade: "C+", color: "text-orange-400", bg: "bg-orange-400/15" };
    return { grade: "C", color: "text-destructive", bg: "bg-destructive/15" };
  };
  const iq = mealIQGrade();

  const mealTypeIcons: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
  const mealTypeColors: Record<string, string> = {
    breakfast: "bg-yellow-500/10 text-yellow-500",
    lunch: "bg-primary/10 text-primary",
    dinner: "bg-accent/10 text-accent",
    snack: "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="min-h-full bg-background pb-6">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight gradient-text">{t("nav_nutrition")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">{streak.currentStreak}d streak</span>
            </div>
          )}
        </div>

        {/* Calorie Ring */}
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
                <circle cx="55" cy="55" r="48" fill="none" stroke="hsl(var(--primary))" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={(2 * Math.PI * 48) - (calPct / 100) * (2 * Math.PI * 48)}
                  transform="rotate(-90 55 55)" className="transition-all duration-1000" />
                <text x="55" y="50" textAnchor="middle" style={{ fill: "hsl(var(--foreground))", fontSize: "20px", fontWeight: "900" }}>{summary.totalCalories}</text>
                <text x="55" y="66" textAnchor="middle" style={{ fill: "hsl(var(--muted-foreground))", fontSize: "10px" }}>kcal</text>
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">{t("nutrition_daily_goal")}</p>
                <p className="text-xl font-black">{calorieGoal} <span className="text-sm text-muted-foreground font-normal">kcal</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("nutrition_remaining")}</p>
                <p className="text-xl font-black text-primary">{Math.max(0, calorieGoal - summary.totalCalories)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("nutrition_burned")}</p>
                <p className="text-sm font-bold text-orange-400">—</p>
              </div>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">{t("nutrition_macros")}</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today's split</span>
          </div>

          {/* Split donut + legend */}
          <MacroDonut
            protein={Math.round(summary.totalProtein)}
            carbs={Math.round(summary.totalCarbs)}
            fat={Math.round(summary.totalFat)}
          />

          {/* Progress toward daily goals */}
          <div className="pt-2 border-t border-border/30 space-y-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goal progress</p>
            <MacroGoalBar value={Math.round(summary.totalProtein)} goal={Math.round(summary.calorieGoal * 0.3 / 4)} color="#00D4A0" label="Protein" />
            <MacroGoalBar value={Math.round(summary.totalCarbs)}   goal={Math.round(summary.calorieGoal * 0.45 / 4)} color="#4F8EF7" label="Carbs" />
            <MacroGoalBar value={Math.round(summary.totalFat)}     goal={Math.round(summary.calorieGoal * 0.25 / 9)} color="#A855F7" label="Fat" />
          </div>

          {/* Fiber & Sugar */}
          <div className="pt-2 border-t border-border/30 space-y-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fiber & Sugar</p>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Fiber</span>
                <span className="font-bold">{(summary as any).totalFiber?.toFixed(1) ?? 0}g <span className="text-muted-foreground font-normal">/ 25g</span></span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${Math.min(100, ((summary as any).totalFiber ?? 0) / 25 * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Sugar</span>
                <span className="font-bold">{(summary as any).totalSugar?.toFixed(1) ?? 0}g <span className="text-muted-foreground font-normal">/ 36g limit</span></span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", ((summary as any).totalSugar ?? 0) > 30 ? "bg-destructive" : "bg-orange-400")} style={{ width: `${Math.min(100, ((summary as any).totalSugar ?? 0) / 36 * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Meal IQ */}
        <MealIqQuiz score={mealIQ?.score}>
        <button className="bg-card rounded-2xl p-4 border border-border/50 w-full text-left press-scale hover-elevate">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">{t("nutrition_meal_iq")}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn("w-20 h-20 rounded-2xl flex flex-col items-center justify-center", iq.bg)}>
              <span className={cn("text-3xl font-black", iq.color)}>{mealIQ?.score ?? 0}</span>
              <span className="text-[10px] text-muted-foreground">/ 28</span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-black", iq.color)}>{iq.grade}</span>
                <span className="text-xs text-muted-foreground">{mealIQ?.mealsAnalyzed ?? 0} meals analyzed</span>
              </div>
              {mealIQ?.strengths?.slice(0, 2).map((s, i) => (
                <p key={i} className="text-xs text-primary flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary inline-block" />{s}
                </p>
              ))}
              {mealIQ?.improvements?.slice(0, 1).map((s, i) => (
                <p key={i} className="text-xs text-orange-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-orange-400 inline-block" />{s}
                </p>
              ))}
              {mealIQ?.suggestion && <p className="text-[10px] text-muted-foreground italic">{mealIQ.suggestion}</p>}
            </div>
          </div>
        </button>
        </MealIqQuiz>

        {/* Meals List */}
        <div>
          {/* Hidden inputs */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageScan(f); e.target.value = ""; }} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageScan(f); e.target.value = ""; }} />

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">{t("nutrition_meals")}</h3>
            <div className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setScanPreview(null); setScanResult(null); setSuggestions([]); setShowSuggestions(false); setSuggestionsFromDb(false); setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", mealType: "lunch" }); } }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9 gap-1.5 rounded-xl text-xs font-bold px-4">
                    <Plus className="w-3.5 h-3.5" /> {t("nutrition_add_meal")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] rounded-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="flex items-center gap-2">
                    {scanPreview ? <><Sparkles className="w-4 h-4 text-primary" /> AI Scan Result</> : t("nutrition_log_meal")}
                  </DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    {/* Quick scan options */}
                    {!scanPreview && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors press-scale">
                          <Camera className="w-4 h-4" /> Scan with Camera
                        </button>
                        <button onClick={() => galleryInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors press-scale">
                          <ImagePlus className="w-4 h-4" /> Upload Photo
                        </button>
                      </div>
                    )}
                    <div className="relative flex items-center gap-2">
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">or enter manually</span>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>
                    {/* Image preview + scan status */}
                    {scanPreview && (
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={scanPreview} alt="Food scan" className="w-full h-36 object-cover" />
                        {isScanning && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-white text-sm font-bold">Analyzing food...</p>
                          </div>
                        )}
                        {scanResult && !isScanning && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2 flex items-center gap-2">
                            {scanResult.confidence === "high" ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                            <p className="text-white text-[11px] leading-snug line-clamp-2">{scanResult.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {scanResult && !isScanning && (
                      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold", scanResult.confidence === "high" ? "bg-primary/10 text-primary" : scanResult.confidence === "medium" ? "bg-yellow-400/10 text-yellow-400" : "bg-orange-400/10 text-orange-400")}>
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        AI confidence: <span className="font-black capitalize">{scanResult.confidence}</span> — review values below and adjust if needed
                      </div>
                    )}
                    <div ref={searchRef} className="relative">
                      <Label className="text-xs">{t("nutrition_meal_name")}</Label>
                      <div className="relative mt-1">
                        <Input
                          value={form.name}
                          onChange={e => handleNameChange(e.target.value)}
                          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                          placeholder="Search food or type a name…"
                          className="pr-8"
                          autoComplete="off"
                        />
                        {form.name && suggestionsFromDb && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">DB</span>
                          </div>
                        )}
                      </div>
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden">
                          <div className="px-3 pt-2 pb-1">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Quick fill from database</span>
                          </div>
                          <div className="max-h-52 overflow-y-auto">
                            {suggestions.map((food, i) => (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={() => applyFoodSuggestion(food)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                              >
                                <span className="text-xl shrink-0 w-7 text-center">{food.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate">{food.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {food.calories} kcal · {food.protein}g protein · {food.carbs}g carbs · {food.fat}g fat
                                  </p>
                                </div>
                                <span className="text-[10px] font-bold text-primary shrink-0 bg-primary/10 px-1.5 py-0.5 rounded-full capitalize">{food.mealType}</span>
                              </button>
                            ))}
                          </div>
                          <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20">
                            <p className="text-[9px] text-muted-foreground">Tap a food to auto-fill all nutritional values</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t("nutrition_calories")}</Label>
                        <Input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} placeholder="500" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">{t("nutrition_meal_type")}</Label>
                        <Select value={form.mealType} onValueChange={v => setForm(f => ({ ...f, mealType: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["breakfast","lunch","dinner","snack"].map(mt => <SelectItem key={mt} value={mt} className="capitalize">{mt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[["Protein (g)", "protein"], ["Carbs (g)", "carbs"], ["Fat (g)", "fat"]].map(([l, k]) => (
                        <div key={k}>
                          <Label className="text-xs">{l}</Label>
                          <Input type="number" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder="0" className="mt-1" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[["Fiber (g)", "fiber"], ["Sugar (g)", "sugar"]].map(([l, k]) => (
                        <div key={k}>
                          <Label className="text-xs">{l}</Label>
                          <Input type="number" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder="0" className="mt-1" />
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" onClick={handleAdd} disabled={logMeal.isPending || isScanning}>
                      {logMeal.isPending ? t("nutrition_logging") : isScanning ? "Analyzing..." : t("nutrition_log_btn")}
                    </Button>
                    {/* Rescan options inside dialog */}
                    {scanPreview && !isScanning && (
                      <div className="flex gap-2">
                        <button onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-muted/50 text-muted-foreground border border-border/40 hover:bg-muted transition-colors">
                          <Camera className="w-3.5 h-3.5" /> Retake
                        </button>
                        <button onClick={() => galleryInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-muted/50 text-muted-foreground border border-border/40 hover:bg-muted transition-colors">
                          <ImagePlus className="w-3.5 h-3.5" /> New photo
                        </button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {!meals?.length ? (
            <div className="py-8 text-center bg-card rounded-2xl border border-dashed border-border">
              <Utensils className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t("nutrition_no_meals")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("nutrition_no_meals_hint")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {meals.map(meal => (
                <div key={meal.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover-elevate group">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0", mealTypeColors[meal.mealType] ?? mealTypeColors.snack)}>
                    {mealTypeIcons[meal.mealType] ?? "🍽️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-primary">{meal.calories}</span>
                    <button onClick={() => handleDelete(meal.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NutritionSkeleton() {
  return <div className="p-5 space-y-5">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl shimmer" />)}</div>;
}