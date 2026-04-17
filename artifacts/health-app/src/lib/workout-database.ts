export type WorkoutItem = {
  name: string;
  emoji: string;
  type: "strength" | "cardio" | "hiit" | "yoga" | "flexibility" | "other";
  intensity: "low" | "moderate" | "high";
  durationMinutes: number;
  caloriesBurned: number;
  tags: string[];
};

export const WORKOUT_DATABASE: WorkoutItem[] = [
  // ── Strength ───────────────────────────────────────────────────────
  { name: "Upper Body Strength", emoji: "💪", type: "strength", intensity: "moderate", durationMinutes: 45, caloriesBurned: 220, tags: ["upper", "chest", "shoulders", "arms"] },
  { name: "Lower Body Strength", emoji: "🦵", type: "strength", intensity: "moderate", durationMinutes: 45, caloriesBurned: 240, tags: ["lower", "legs", "quads", "glutes"] },
  { name: "Full Body Strength", emoji: "🏋️", type: "strength", intensity: "high", durationMinutes: 60, caloriesBurned: 300, tags: ["full", "compound", "total"] },
  { name: "Chest & Triceps", emoji: "🏋️", type: "strength", intensity: "moderate", durationMinutes: 40, caloriesBurned: 200, tags: ["chest", "push", "triceps", "bench"] },
  { name: "Back & Biceps", emoji: "💪", type: "strength", intensity: "moderate", durationMinutes: 40, caloriesBurned: 200, tags: ["back", "pull", "biceps", "lats"] },
  { name: "Shoulder Press", emoji: "🏋️", type: "strength", intensity: "moderate", durationMinutes: 30, caloriesBurned: 150, tags: ["shoulders", "overhead", "press"] },
  { name: "Leg Day", emoji: "🦵", type: "strength", intensity: "high", durationMinutes: 60, caloriesBurned: 320, tags: ["legs", "squats", "deadlift", "glutes"] },
  { name: "Deadlifts", emoji: "🏋️", type: "strength", intensity: "high", durationMinutes: 35, caloriesBurned: 220, tags: ["deadlift", "lower back", "hamstrings", "compound"] },
  { name: "Squats", emoji: "🦵", type: "strength", intensity: "high", durationMinutes: 30, caloriesBurned: 200, tags: ["squat", "quads", "glutes", "compound"] },
  { name: "Bench Press", emoji: "🏋️", type: "strength", intensity: "moderate", durationMinutes: 30, caloriesBurned: 160, tags: ["bench", "chest", "compound"] },
  { name: "Pull Day (Pull-ups & Rows)", emoji: "💪", type: "strength", intensity: "high", durationMinutes: 45, caloriesBurned: 230, tags: ["pull", "back", "biceps"] },
  { name: "Push Day (Push-ups & Dips)", emoji: "🏋️", type: "strength", intensity: "moderate", durationMinutes: 40, caloriesBurned: 200, tags: ["push", "chest", "triceps"] },
  { name: "Core & Abs", emoji: "🔥", type: "strength", intensity: "moderate", durationMinutes: 25, caloriesBurned: 130, tags: ["core", "abs", "plank", "crunch"] },
  { name: "Bodyweight Circuit", emoji: "💪", type: "strength", intensity: "moderate", durationMinutes: 35, caloriesBurned: 190, tags: ["bodyweight", "circuit", "no-equipment"] },
  { name: "Dumbbell Workout", emoji: "🏋️", type: "strength", intensity: "moderate", durationMinutes: 40, caloriesBurned: 210, tags: ["dumbbells", "free weights", "home"] },

  // ── Cardio ─────────────────────────────────────────────────────────
  { name: "5k Run", emoji: "🏃", type: "cardio", intensity: "moderate", durationMinutes: 30, caloriesBurned: 300, tags: ["run", "5k", "outdoor", "road"] },
  { name: "10k Run", emoji: "🏃", type: "cardio", intensity: "high", durationMinutes: 60, caloriesBurned: 600, tags: ["run", "10k", "outdoor", "long"] },
  { name: "Treadmill Run", emoji: "🏃", type: "cardio", intensity: "moderate", durationMinutes: 30, caloriesBurned: 280, tags: ["treadmill", "indoor", "run", "gym"] },
  { name: "Outdoor Walk", emoji: "🚶", type: "cardio", intensity: "low", durationMinutes: 45, caloriesBurned: 180, tags: ["walk", "outdoor", "casual", "steps"] },
  { name: "Cycling (Outdoor)", emoji: "🚴", type: "cardio", intensity: "moderate", durationMinutes: 45, caloriesBurned: 360, tags: ["bike", "cycling", "outdoor", "road"] },
  { name: "Stationary Bike", emoji: "🚴", type: "cardio", intensity: "moderate", durationMinutes: 30, caloriesBurned: 260, tags: ["bike", "indoor", "cycling", "gym"] },
  { name: "Elliptical", emoji: "⚡", type: "cardio", intensity: "moderate", durationMinutes: 30, caloriesBurned: 280, tags: ["elliptical", "low-impact", "gym"] },
  { name: "Swimming", emoji: "🏊", type: "cardio", intensity: "moderate", durationMinutes: 40, caloriesBurned: 350, tags: ["swim", "pool", "low-impact", "full body"] },
  { name: "Rowing Machine", emoji: "🚣", type: "cardio", intensity: "high", durationMinutes: 25, caloriesBurned: 280, tags: ["row", "machine", "gym", "full body"] },
  { name: "Jump Rope", emoji: "🪱", type: "cardio", intensity: "high", durationMinutes: 20, caloriesBurned: 220, tags: ["jump rope", "skipping", "cardio"] },
  { name: "Stair Climber", emoji: "🪜", type: "cardio", intensity: "high", durationMinutes: 25, caloriesBurned: 260, tags: ["stairs", "climb", "gym", "glutes"] },

  // ── HIIT ───────────────────────────────────────────────────────────
  { name: "HIIT Circuit", emoji: "🔥", type: "hiit", intensity: "high", durationMinutes: 25, caloriesBurned: 320, tags: ["hiit", "circuit", "intense", "fat burn"] },
  { name: "Tabata", emoji: "⚡", type: "hiit", intensity: "high", durationMinutes: 20, caloriesBurned: 280, tags: ["tabata", "intervals", "intense", "20/10"] },
  { name: "Burpee Workout", emoji: "🔥", type: "hiit", intensity: "high", durationMinutes: 20, caloriesBurned: 290, tags: ["burpees", "bodyweight", "intense"] },
  { name: "Sprint Intervals", emoji: "🏃", type: "hiit", intensity: "high", durationMinutes: 25, caloriesBurned: 310, tags: ["sprint", "intervals", "run", "speed"] },
  { name: "HIIT Bike", emoji: "🚴", type: "hiit", intensity: "high", durationMinutes: 20, caloriesBurned: 300, tags: ["bike", "intervals", "intense", "spin"] },
  { name: "Kickboxing", emoji: "🥊", type: "hiit", intensity: "high", durationMinutes: 45, caloriesBurned: 400, tags: ["kickbox", "boxing", "martial arts", "cardio"] },
  { name: "CrossFit WOD", emoji: "🔥", type: "hiit", intensity: "high", durationMinutes: 35, caloriesBurned: 380, tags: ["crossfit", "wod", "functional", "intense"] },

  // ── Yoga / Flexibility ─────────────────────────────────────────────
  { name: "Morning Yoga", emoji: "🧘", type: "yoga", intensity: "low", durationMinutes: 30, caloriesBurned: 100, tags: ["yoga", "morning", "stretch", "calm"] },
  { name: "Vinyasa Flow", emoji: "🧘", type: "yoga", intensity: "moderate", durationMinutes: 45, caloriesBurned: 170, tags: ["yoga", "vinyasa", "flow", "breath"] },
  { name: "Power Yoga", emoji: "🧘", type: "yoga", intensity: "high", durationMinutes: 50, caloriesBurned: 230, tags: ["yoga", "power", "strength", "hot"] },
  { name: "Yin Yoga", emoji: "🧘", type: "yoga", intensity: "low", durationMinutes: 45, caloriesBurned: 90, tags: ["yoga", "yin", "stretch", "deep", "relax"] },
  { name: "Pilates", emoji: "🤸", type: "flexibility", intensity: "moderate", durationMinutes: 45, caloriesBurned: 180, tags: ["pilates", "core", "flexibility", "control"] },
  { name: "Full Body Stretch", emoji: "🤸", type: "flexibility", intensity: "low", durationMinutes: 20, caloriesBurned: 60, tags: ["stretch", "flexibility", "recovery", "cool down"] },
  { name: "Mobility Routine", emoji: "🤸", type: "flexibility", intensity: "low", durationMinutes: 25, caloriesBurned: 70, tags: ["mobility", "joints", "flexibility", "warmup"] },

  // ── Sports / Other ─────────────────────────────────────────────────
  { name: "Football (Soccer)", emoji: "⚽", type: "cardio", intensity: "high", durationMinutes: 60, caloriesBurned: 480, tags: ["football", "soccer", "sport", "team"] },
  { name: "Basketball", emoji: "🏀", type: "cardio", intensity: "high", durationMinutes: 60, caloriesBurned: 450, tags: ["basketball", "sport", "team", "court"] },
  { name: "Tennis", emoji: "🎾", type: "cardio", intensity: "high", durationMinutes: 60, caloriesBurned: 400, tags: ["tennis", "sport", "court", "racket"] },
  { name: "Martial Arts / MMA", emoji: "🥋", type: "other", intensity: "high", durationMinutes: 60, caloriesBurned: 500, tags: ["mma", "martial arts", "karate", "boxing"] },
  { name: "Rock Climbing", emoji: "🧗", type: "other", intensity: "high", durationMinutes: 60, caloriesBurned: 420, tags: ["climb", "rock", "bouldering", "grip"] },
  { name: "Dance Workout", emoji: "💃", type: "cardio", intensity: "moderate", durationMinutes: 40, caloriesBurned: 300, tags: ["dance", "zumba", "fun", "cardio"] },
  { name: "Home Workout", emoji: "🏠", type: "other", intensity: "moderate", durationMinutes: 30, caloriesBurned: 180, tags: ["home", "no-equipment", "bodyweight"] },
];

export function searchWorkouts(query: string, limit = 6): WorkoutItem[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const scored = WORKOUT_DATABASE.map(w => {
    let score = 0;
    if (w.name.toLowerCase().startsWith(q)) score += 100;
    else if (w.name.toLowerCase().includes(q)) score += 60;
    if (w.tags.some(t => t.includes(q))) score += 30;
    if (w.type.includes(q)) score += 20;
    return { w, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(x => x.w);
}

// ── Personal Workout History (localStorage) ───────────────────────────
export type WorkoutHistoryItem = {
  name: string;
  emoji: string;
  type: WorkoutItem["type"];
  intensity: WorkoutItem["intensity"];
  durationMinutes: number;
  caloriesBurned: number;
  loggedAt: number;
};

const HISTORY_KEY = "bodylogic:workout_history";
const MAX_HISTORY = 20;

export function getWorkoutHistory(): WorkoutHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveWorkoutToHistory(item: Omit<WorkoutHistoryItem, "loggedAt">) {
  try {
    const history = getWorkoutHistory().filter(h => h.name.toLowerCase() !== item.name.toLowerCase());
    history.unshift({ ...item, loggedAt: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {}
}

export function searchWorkoutHistory(query: string, limit = 3): WorkoutHistoryItem[] {
  const history = getWorkoutHistory();
  if (!query.trim()) return history.slice(0, limit);
  const q = query.toLowerCase();
  return history.filter(h => h.name.toLowerCase().includes(q)).slice(0, limit);
}
