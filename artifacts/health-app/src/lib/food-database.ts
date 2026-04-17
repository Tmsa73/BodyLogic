export type FoodItem = {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  tags: string[];
};

export const FOOD_DATABASE: FoodItem[] = [
  // ── Arabian / Gulf Foods ──────────────────────────────────────────
  { name: "Kabsa with Chicken", emoji: "🍗", calories: 520, protein: 38, carbs: 58, fat: 12, fiber: 2, sugar: 3, mealType: "lunch", tags: ["arabian", "gulf", "rice", "chicken"] },
  { name: "Kabsa with Lamb", emoji: "🍖", calories: 620, protein: 42, carbs: 58, fat: 20, fiber: 2, sugar: 3, mealType: "lunch", tags: ["arabian", "gulf", "rice", "lamb"] },
  { name: "Mandi Chicken", emoji: "🍗", calories: 480, protein: 40, carbs: 50, fat: 10, fiber: 1, sugar: 2, mealType: "dinner", tags: ["arabian", "yemen", "rice", "chicken"] },
  { name: "Mandi Lamb", emoji: "🍖", calories: 590, protein: 44, carbs: 50, fat: 18, fiber: 1, sugar: 2, mealType: "dinner", tags: ["arabian", "yemen", "rice", "lamb"] },
  { name: "Machboos", emoji: "🍛", calories: 560, protein: 35, carbs: 62, fat: 15, fiber: 2, sugar: 4, mealType: "lunch", tags: ["bahrain", "gulf", "rice", "spiced"] },
  { name: "Harees", emoji: "🥣", calories: 310, protein: 20, carbs: 42, fat: 6, fiber: 2, sugar: 1, mealType: "breakfast", tags: ["arabian", "wheat", "meat", "ramadan"] },
  { name: "Jareesh", emoji: "🥣", calories: 280, protein: 14, carbs: 48, fat: 5, fiber: 3, sugar: 2, mealType: "breakfast", tags: ["saudi", "wheat", "traditional"] },
  { name: "Saleeg", emoji: "🍚", calories: 420, protein: 22, carbs: 55, fat: 12, fiber: 1, sugar: 2, mealType: "dinner", tags: ["saudi", "rice", "milk"] },
  { name: "Margoog", emoji: "🍲", calories: 390, protein: 28, carbs: 45, fat: 10, fiber: 3, sugar: 3, mealType: "dinner", tags: ["gulf", "meat", "vegetables", "stew"] },
  { name: "Maqluba", emoji: "🍛", calories: 500, protein: 30, carbs: 58, fat: 14, fiber: 3, sugar: 4, mealType: "lunch", tags: ["levantine", "palestine", "jordan", "rice"] },
  { name: "Mansaf", emoji: "🍖", calories: 680, protein: 48, carbs: 52, fat: 26, fiber: 1, sugar: 2, mealType: "dinner", tags: ["jordan", "lamb", "jameed", "rice"] },
  { name: "Biryani", emoji: "🍛", calories: 490, protein: 28, carbs: 62, fat: 12, fiber: 2, sugar: 3, mealType: "lunch", tags: ["south-asian", "rice", "spiced", "arabic"] },
  { name: "Shawarma Wrap (Chicken)", emoji: "🌯", calories: 420, protein: 30, carbs: 38, fat: 14, fiber: 2, sugar: 4, mealType: "lunch", tags: ["arabian", "street-food", "wrap"] },
  { name: "Shawarma Wrap (Meat)", emoji: "🌯", calories: 480, protein: 32, carbs: 38, fat: 18, fiber: 2, sugar: 4, mealType: "lunch", tags: ["arabian", "street-food", "wrap"] },
  { name: "Falafel Wrap", emoji: "🌯", calories: 380, protein: 14, carbs: 48, fat: 14, fiber: 6, sugar: 3, mealType: "lunch", tags: ["levantine", "vegetarian", "street-food"] },
  { name: "Falafel Plate", emoji: "🧆", calories: 320, protein: 12, carbs: 38, fat: 14, fiber: 6, sugar: 2, mealType: "lunch", tags: ["levantine", "vegetarian"] },
  { name: "Hummus with Bread", emoji: "🫘", calories: 280, protein: 10, carbs: 32, fat: 12, fiber: 6, sugar: 2, mealType: "snack", tags: ["levantine", "chickpea", "dip", "arabic"] },
  { name: "Hummus with Olive Oil", emoji: "🫘", calories: 240, protein: 9, carbs: 24, fat: 13, fiber: 5, sugar: 2, mealType: "snack", tags: ["levantine", "chickpea", "dip"] },
  { name: "Baba Ganoush", emoji: "🍆", calories: 130, protein: 4, carbs: 12, fat: 8, fiber: 4, sugar: 5, mealType: "snack", tags: ["levantine", "eggplant", "dip", "arabic"] },
  { name: "Fattoush Salad", emoji: "🥗", calories: 190, protein: 5, carbs: 26, fat: 8, fiber: 4, sugar: 6, mealType: "lunch", tags: ["levantine", "salad", "arabic"] },
  { name: "Tabbouleh", emoji: "🥗", calories: 150, protein: 4, carbs: 20, fat: 6, fiber: 4, sugar: 3, mealType: "lunch", tags: ["levantine", "parsley", "salad", "arabic"] },
  { name: "Fatteh (Chickpea)", emoji: "🥣", calories: 380, protein: 16, carbs: 48, fat: 14, fiber: 5, sugar: 4, mealType: "breakfast", tags: ["levantine", "arabic", "yogurt"] },
  { name: "Shakshuka", emoji: "🍳", calories: 280, protein: 16, carbs: 18, fat: 16, fiber: 4, sugar: 8, mealType: "breakfast", tags: ["north-african", "arabic", "eggs", "tomato"] },
  { name: "Ful Medames", emoji: "🫘", calories: 260, protein: 14, carbs: 38, fat: 5, fiber: 10, sugar: 2, mealType: "breakfast", tags: ["arabic", "north-african", "beans"] },
  { name: "Labneh with Za'atar", emoji: "🧀", calories: 220, protein: 12, carbs: 8, fat: 16, fiber: 1, sugar: 4, mealType: "breakfast", tags: ["levantine", "yogurt", "cheese", "arabic"] },
  { name: "Mutabbaq (Meat)", emoji: "🥙", calories: 480, protein: 24, carbs: 44, fat: 22, fiber: 2, sugar: 3, mealType: "lunch", tags: ["arabic", "pastry", "stuffed"] },
  { name: "Samboosa (3 pieces)", emoji: "🥟", calories: 320, protein: 12, carbs: 30, fat: 18, fiber: 2, sugar: 2, mealType: "snack", tags: ["gulf", "fried", "pastry", "snack"] },
  { name: "Kibbeh (3 pieces)", emoji: "🥩", calories: 390, protein: 22, carbs: 28, fat: 20, fiber: 2, sugar: 1, mealType: "lunch", tags: ["levantine", "lamb", "bulgur"] },
  { name: "Warak Dawali (Stuffed Vine Leaves)", emoji: "🌿", calories: 260, protein: 10, carbs: 32, fat: 10, fiber: 3, sugar: 2, mealType: "lunch", tags: ["levantine", "stuffed", "rice"] },
  { name: "Molokhia with Chicken", emoji: "🍲", calories: 340, protein: 28, carbs: 20, fat: 12, fiber: 5, sugar: 2, mealType: "lunch", tags: ["arabic", "egyptian", "leafy-green"] },
  { name: "Koshari", emoji: "🍝", calories: 420, protein: 14, carbs: 72, fat: 8, fiber: 8, sugar: 5, mealType: "lunch", tags: ["egyptian", "vegetarian", "rice", "lentil"] },
  { name: "Dolma (Rice-stuffed)", emoji: "🌿", calories: 220, protein: 5, carbs: 34, fat: 8, fiber: 3, sugar: 2, mealType: "lunch", tags: ["middle-eastern", "stuffed", "rice"] },
  { name: "Saloona (Chicken Stew)", emoji: "🍲", calories: 310, protein: 30, carbs: 22, fat: 10, fiber: 4, sugar: 4, mealType: "dinner", tags: ["gulf", "stew", "chicken"] },
  { name: "Arabic Bread (Khubz)", emoji: "🫓", calories: 260, protein: 8, carbs: 52, fat: 2, fiber: 2, sugar: 1, mealType: "lunch", tags: ["arabic", "bread", "flatbread"] },
  { name: "Whole Wheat Khubz", emoji: "🫓", calories: 240, protein: 9, carbs: 46, fat: 2, fiber: 5, sugar: 1, mealType: "breakfast", tags: ["arabic", "bread", "whole-grain"] },
  { name: "Dates (5 pieces)", emoji: "🌴", calories: 140, protein: 1, carbs: 37, fat: 0, fiber: 4, sugar: 32, mealType: "snack", tags: ["arabic", "fruit", "natural-sugar", "ramadan"] },
  { name: "Luqaimat (6 pieces)", emoji: "🍩", calories: 360, protein: 5, carbs: 52, fat: 16, fiber: 1, sugar: 20, mealType: "snack", tags: ["gulf", "fried", "sweet", "dessert"] },
  { name: "Knafeh", emoji: "🧁", calories: 480, protein: 12, carbs: 60, fat: 22, fiber: 1, sugar: 30, mealType: "snack", tags: ["levantine", "dessert", "cheese", "sweet"] },
  { name: "Baklava (3 pieces)", emoji: "🍯", calories: 380, protein: 6, carbs: 44, fat: 20, fiber: 2, sugar: 28, mealType: "snack", tags: ["arabic", "dessert", "nuts", "pastry"] },
  { name: "Umm Ali", emoji: "🥮", calories: 520, protein: 12, carbs: 58, fat: 28, fiber: 2, sugar: 30, mealType: "snack", tags: ["egyptian", "dessert", "bread-pudding"] },
  { name: "Muhallabia", emoji: "🍮", calories: 220, protein: 6, carbs: 38, fat: 6, fiber: 0, sugar: 28, mealType: "snack", tags: ["arabic", "dessert", "milk-pudding"] },
  { name: "Arabic Coffee with Dates", emoji: "☕", calories: 80, protein: 1, carbs: 20, fat: 0, fiber: 2, sugar: 18, mealType: "snack", tags: ["arabic", "coffee", "dates", "traditional"] },
  { name: "Karak Tea with Milk", emoji: "🧋", calories: 130, protein: 4, carbs: 18, fat: 4, fiber: 0, sugar: 14, mealType: "snack", tags: ["gulf", "tea", "drink", "milk"] },
  { name: "Lentil Soup", emoji: "🍵", calories: 180, protein: 10, carbs: 28, fat: 3, fiber: 8, sugar: 3, mealType: "lunch", tags: ["arabic", "soup", "lentil", "vegetarian"] },
  { name: "Harira Soup", emoji: "🍵", calories: 220, protein: 12, carbs: 32, fat: 5, fiber: 6, sugar: 4, mealType: "dinner", tags: ["moroccan", "soup", "ramadan"] },
  { name: "Grilled Hammour Fish", emoji: "🐟", calories: 280, protein: 38, carbs: 0, fat: 12, fiber: 0, sugar: 0, mealType: "dinner", tags: ["gulf", "fish", "grilled", "protein"] },
  { name: "Safi Fish (Grilled)", emoji: "🐟", calories: 250, protein: 34, carbs: 0, fat: 11, fiber: 0, sugar: 0, mealType: "dinner", tags: ["gulf", "fish", "grilled"] },
  { name: "Chicken Machboos", emoji: "🍗", calories: 540, protein: 36, carbs: 60, fat: 14, fiber: 2, sugar: 4, mealType: "dinner", tags: ["bahrain", "gulf", "rice"] },
  { name: "Maamoul (Date Cookie)", emoji: "🍪", calories: 180, protein: 3, carbs: 28, fat: 7, fiber: 2, sugar: 16, mealType: "snack", tags: ["levantine", "cookie", "dates", "eid"] },
  { name: "Gahwa (Arabic Coffee)", emoji: "☕", calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0, sugar: 0, mealType: "snack", tags: ["arabic", "coffee", "drink"] },
  { name: "Za'atar Bread", emoji: "🫓", calories: 290, protein: 9, carbs: 44, fat: 10, fiber: 3, sugar: 1, mealType: "breakfast", tags: ["levantine", "bread", "thyme", "arabic"] },
  { name: "Cheese Sambousek", emoji: "🥟", calories: 280, protein: 10, carbs: 26, fat: 15, fiber: 1, sugar: 2, mealType: "snack", tags: ["levantine", "pastry", "cheese"] },
  { name: "Grilled Kofta", emoji: "🍢", calories: 330, protein: 28, carbs: 8, fat: 20, fiber: 1, sugar: 2, mealType: "dinner", tags: ["arabic", "grilled", "minced-meat"] },
  { name: "Rice with Vermicelli", emoji: "🍚", calories: 280, protein: 6, carbs: 56, fat: 5, fiber: 1, sugar: 1, mealType: "lunch", tags: ["arabic", "rice", "side-dish"] },
  { name: "Spinach Fatayer (3 pieces)", emoji: "🥙", calories: 240, protein: 8, carbs: 32, fat: 10, fiber: 4, sugar: 2, mealType: "snack", tags: ["levantine", "pastry", "spinach", "baked"] },
  { name: "Meat Fatayer (3 pieces)", emoji: "🥙", calories: 290, protein: 14, carbs: 30, fat: 13, fiber: 2, sugar: 2, mealType: "snack", tags: ["levantine", "pastry", "meat", "baked"] },
  { name: "Chicken Kabab", emoji: "🍢", calories: 290, protein: 32, carbs: 6, fat: 14, fiber: 1, sugar: 2, mealType: "dinner", tags: ["arabic", "grilled", "chicken", "skewer"] },
  { name: "Lamb Chops (Grilled)", emoji: "🍖", calories: 380, protein: 36, carbs: 0, fat: 24, fiber: 0, sugar: 0, mealType: "dinner", tags: ["arabic", "grilled", "lamb"] },
  { name: "Mufattah Lamb", emoji: "🍖", calories: 640, protein: 46, carbs: 52, fat: 24, fiber: 2, sugar: 2, mealType: "dinner", tags: ["saudi", "lamb", "traditional"] },
  { name: "Chicken with Vegetables Saloona", emoji: "🍲", calories: 320, protein: 28, carbs: 24, fat: 12, fiber: 5, sugar: 5, mealType: "dinner", tags: ["gulf", "stew", "vegetables"] },
  { name: "Grilled Shrimp", emoji: "🍤", calories: 200, protein: 28, carbs: 2, fat: 8, fiber: 0, sugar: 0, mealType: "dinner", tags: ["gulf", "seafood", "grilled"] },
  { name: "Avocado Hummus", emoji: "🥑", calories: 210, protein: 7, carbs: 18, fat: 14, fiber: 7, sugar: 2, mealType: "snack", tags: ["arabic-fusion", "dip", "healthy"] },

  // ── Salads & Light ─────────────────────────────────────────────
  { name: "Caesar Salad", emoji: "🥗", calories: 340, protein: 18, carbs: 20, fat: 22, fiber: 3, sugar: 4, mealType: "lunch", tags: ["western", "salad"] },
  { name: "Greek Salad", emoji: "🥗", calories: 220, protein: 8, carbs: 14, fat: 16, fiber: 4, sugar: 8, mealType: "lunch", tags: ["mediterranean", "salad"] },
  { name: "Garden Salad", emoji: "🥗", calories: 80, protein: 3, carbs: 10, fat: 3, fiber: 3, sugar: 5, mealType: "lunch", tags: ["salad", "light", "vegetables"] },
  { name: "Chicken Salad", emoji: "🥗", calories: 280, protein: 30, carbs: 8, fat: 14, fiber: 3, sugar: 4, mealType: "lunch", tags: ["protein", "salad", "chicken"] },
  { name: "Tuna Salad", emoji: "🥗", calories: 220, protein: 26, carbs: 6, fat: 10, fiber: 2, sugar: 3, mealType: "lunch", tags: ["protein", "salad", "tuna"] },
  { name: "Quinoa Salad", emoji: "🥗", calories: 320, protein: 12, carbs: 42, fat: 12, fiber: 5, sugar: 4, mealType: "lunch", tags: ["healthy", "salad", "quinoa"] },

  // ── Breakfast Foods ────────────────────────────────────────────
  { name: "Oatmeal with Honey", emoji: "🥣", calories: 280, protein: 8, carbs: 52, fat: 5, fiber: 6, sugar: 14, mealType: "breakfast", tags: ["healthy", "breakfast", "oats"] },
  { name: "Oatmeal with Berries", emoji: "🥣", calories: 300, protein: 9, carbs: 54, fat: 5, fiber: 7, sugar: 16, mealType: "breakfast", tags: ["healthy", "breakfast", "oats"] },
  { name: "Scrambled Eggs (3)", emoji: "🍳", calories: 260, protein: 18, carbs: 2, fat: 20, fiber: 0, sugar: 1, mealType: "breakfast", tags: ["protein", "eggs", "breakfast"] },
  { name: "Boiled Eggs (2)", emoji: "🥚", calories: 160, protein: 12, carbs: 1, fat: 10, fiber: 0, sugar: 1, mealType: "breakfast", tags: ["protein", "eggs", "breakfast"] },
  { name: "Avocado Toast", emoji: "🥑", calories: 320, protein: 8, carbs: 34, fat: 18, fiber: 7, sugar: 3, mealType: "breakfast", tags: ["healthy", "breakfast", "avocado"] },
  { name: "Greek Yogurt with Fruit", emoji: "🍓", calories: 180, protein: 14, carbs: 24, fat: 2, fiber: 2, sugar: 18, mealType: "breakfast", tags: ["protein", "yogurt", "breakfast"] },
  { name: "Banana Smoothie", emoji: "🍌", calories: 220, protein: 6, carbs: 44, fat: 3, fiber: 3, sugar: 28, mealType: "breakfast", tags: ["smoothie", "breakfast", "fruit"] },
  { name: "Protein Smoothie", emoji: "🥛", calories: 280, protein: 30, carbs: 24, fat: 6, fiber: 3, sugar: 12, mealType: "breakfast", tags: ["protein", "smoothie", "workout"] },
  { name: "Whole Wheat Toast with Peanut Butter", emoji: "🍞", calories: 320, protein: 12, carbs: 36, fat: 16, fiber: 4, sugar: 6, mealType: "breakfast", tags: ["breakfast", "bread", "peanut-butter"] },
  { name: "Pancakes (3 medium)", emoji: "🥞", calories: 380, protein: 10, carbs: 58, fat: 12, fiber: 2, sugar: 14, mealType: "breakfast", tags: ["breakfast", "sweet"] },
  { name: "Cheese Omelette", emoji: "🍳", calories: 310, protein: 22, carbs: 4, fat: 22, fiber: 0, sugar: 2, mealType: "breakfast", tags: ["protein", "eggs", "breakfast", "cheese"] },
  { name: "Fruit Bowl", emoji: "🍎", calories: 160, protein: 2, carbs: 40, fat: 1, fiber: 5, sugar: 30, mealType: "breakfast", tags: ["fruit", "healthy", "light"] },
  { name: "Full English Breakfast", emoji: "🍳", calories: 680, protein: 36, carbs: 42, fat: 38, fiber: 4, sugar: 6, mealType: "breakfast", tags: ["western", "breakfast", "heavy"] },

  // ── Proteins / Mains ───────────────────────────────────────────
  { name: "Grilled Chicken Breast", emoji: "🍗", calories: 220, protein: 42, carbs: 0, fat: 5, fiber: 0, sugar: 0, mealType: "lunch", tags: ["protein", "chicken", "grilled", "healthy"] },
  { name: "Salmon Fillet (Grilled)", emoji: "🐟", calories: 300, protein: 38, carbs: 0, fat: 16, fiber: 0, sugar: 0, mealType: "dinner", tags: ["protein", "fish", "omega3", "healthy"] },
  { name: "Tuna Steak (Grilled)", emoji: "🐟", calories: 250, protein: 40, carbs: 0, fat: 8, fiber: 0, sugar: 0, mealType: "dinner", tags: ["protein", "fish", "healthy"] },
  { name: "Beef Steak (200g)", emoji: "🥩", calories: 440, protein: 48, carbs: 0, fat: 26, fiber: 0, sugar: 0, mealType: "dinner", tags: ["protein", "beef", "steak"] },
  { name: "Chicken Burger", emoji: "🍔", calories: 480, protein: 30, carbs: 40, fat: 20, fiber: 2, sugar: 8, mealType: "lunch", tags: ["burger", "chicken", "fast-food"] },
  { name: "Beef Burger", emoji: "🍔", calories: 560, protein: 32, carbs: 40, fat: 28, fiber: 2, sugar: 8, mealType: "lunch", tags: ["burger", "beef", "fast-food"] },
  { name: "Grilled Salmon with Vegetables", emoji: "🐟", calories: 380, protein: 40, carbs: 18, fat: 16, fiber: 5, sugar: 8, mealType: "dinner", tags: ["healthy", "fish", "vegetables"] },
  { name: "Chicken & Rice Bowl", emoji: "🍱", calories: 460, protein: 38, carbs: 52, fat: 8, fiber: 2, sugar: 2, mealType: "lunch", tags: ["meal-prep", "chicken", "rice", "healthy"] },
  { name: "Beef & Vegetable Stir-fry", emoji: "🥘", calories: 380, protein: 32, carbs: 24, fat: 18, fiber: 4, sugar: 6, mealType: "dinner", tags: ["asian", "beef", "vegetables"] },
  { name: "Lemon Garlic Shrimp", emoji: "🍤", calories: 240, protein: 30, carbs: 8, fat: 10, fiber: 1, sugar: 2, mealType: "dinner", tags: ["seafood", "shrimp", "healthy"] },

  // ── Pasta & Noodles ────────────────────────────────────────────
  { name: "Spaghetti Bolognese", emoji: "🍝", calories: 560, protein: 30, carbs: 68, fat: 18, fiber: 4, sugar: 8, mealType: "dinner", tags: ["italian", "pasta", "beef"] },
  { name: "Pasta with Chicken", emoji: "🍝", calories: 480, protein: 34, carbs: 58, fat: 12, fiber: 3, sugar: 6, mealType: "lunch", tags: ["pasta", "chicken"] },
  { name: "Penne Arrabbiata", emoji: "🍝", calories: 380, protein: 14, carbs: 68, fat: 8, fiber: 4, sugar: 10, mealType: "dinner", tags: ["italian", "pasta", "vegetarian"] },
  { name: "Mac and Cheese", emoji: "🧀", calories: 520, protein: 18, carbs: 62, fat: 22, fiber: 2, sugar: 8, mealType: "dinner", tags: ["comfort", "pasta", "cheese"] },
  { name: "Ramen Noodles", emoji: "🍜", calories: 440, protein: 20, carbs: 60, fat: 14, fiber: 2, sugar: 4, mealType: "dinner", tags: ["japanese", "noodles", "soup"] },

  // ── Rice Dishes ────────────────────────────────────────────────
  { name: "Plain White Rice (cup)", emoji: "🍚", calories: 210, protein: 4, carbs: 46, fat: 0, fiber: 0, sugar: 0, mealType: "lunch", tags: ["rice", "side-dish", "carbs"] },
  { name: "Brown Rice (cup)", emoji: "🍚", calories: 220, protein: 5, carbs: 46, fat: 2, fiber: 4, sugar: 0, mealType: "lunch", tags: ["rice", "whole-grain", "healthy"] },
  { name: "Fried Rice with Egg", emoji: "🍳", calories: 360, protein: 12, carbs: 52, fat: 12, fiber: 2, sugar: 3, mealType: "lunch", tags: ["asian", "rice", "fried"] },
  { name: "Vegetable Fried Rice", emoji: "🍚", calories: 300, protein: 8, carbs: 54, fat: 8, fiber: 4, sugar: 4, mealType: "lunch", tags: ["asian", "rice", "vegetarian"] },

  // ── Pizza ──────────────────────────────────────────────────────
  { name: "Margherita Pizza (2 slices)", emoji: "🍕", calories: 480, protein: 18, carbs: 56, fat: 20, fiber: 3, sugar: 8, mealType: "dinner", tags: ["italian", "pizza", "cheese"] },
  { name: "Pepperoni Pizza (2 slices)", emoji: "🍕", calories: 560, protein: 22, carbs: 56, fat: 28, fiber: 3, sugar: 8, mealType: "dinner", tags: ["pizza", "meat"] },
  { name: "Chicken Pizza (2 slices)", emoji: "🍕", calories: 500, protein: 26, carbs: 54, fat: 20, fiber: 3, sugar: 6, mealType: "dinner", tags: ["pizza", "chicken"] },

  // ── Snacks & Light ─────────────────────────────────────────────
  { name: "Mixed Nuts (30g)", emoji: "🥜", calories: 180, protein: 5, carbs: 8, fat: 16, fiber: 2, sugar: 2, mealType: "snack", tags: ["healthy", "nuts", "fat", "snack"] },
  { name: "Almonds (30g)", emoji: "🌰", calories: 170, protein: 6, carbs: 6, fat: 15, fiber: 4, sugar: 1, mealType: "snack", tags: ["healthy", "nuts", "snack"] },
  { name: "Apple", emoji: "🍎", calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, sugar: 19, mealType: "snack", tags: ["fruit", "snack", "healthy"] },
  { name: "Banana", emoji: "🍌", calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, sugar: 14, mealType: "snack", tags: ["fruit", "snack", "energy"] },
  { name: "Orange", emoji: "🍊", calories: 62, protein: 1, carbs: 15, fat: 0, fiber: 3, sugar: 12, mealType: "snack", tags: ["fruit", "snack", "vitamin-c"] },
  { name: "Watermelon Slice", emoji: "🍉", calories: 85, protein: 2, carbs: 21, fat: 0, fiber: 1, sugar: 17, mealType: "snack", tags: ["fruit", "snack", "hydrating"] },
  { name: "Greek Yogurt (plain)", emoji: "🥛", calories: 130, protein: 17, carbs: 9, fat: 0, fiber: 0, sugar: 7, mealType: "snack", tags: ["protein", "dairy", "healthy"] },
  { name: "Protein Bar", emoji: "🍫", calories: 200, protein: 20, carbs: 22, fat: 6, fiber: 3, sugar: 8, mealType: "snack", tags: ["protein", "workout", "snack"] },
  { name: "Rice Cakes (2)", emoji: "🍘", calories: 70, protein: 2, carbs: 14, fat: 0, fiber: 0, sugar: 0, mealType: "snack", tags: ["light", "snack", "low-calorie"] },
  { name: "Dark Chocolate (30g)", emoji: "🍫", calories: 170, protein: 2, carbs: 14, fat: 12, fiber: 3, sugar: 8, mealType: "snack", tags: ["sweet", "snack", "chocolate"] },
  { name: "Cheese Crackers", emoji: "🧀", calories: 160, protein: 4, carbs: 18, fat: 8, fiber: 1, sugar: 2, mealType: "snack", tags: ["snack", "cheese", "crackers"] },
  { name: "Edamame (cup)", emoji: "🫛", calories: 190, protein: 17, carbs: 14, fat: 8, fiber: 8, sugar: 3, mealType: "snack", tags: ["protein", "healthy", "plant-based"] },

  // ── Drinks ─────────────────────────────────────────────────────
  { name: "Orange Juice (cup)", emoji: "🍊", calories: 110, protein: 2, carbs: 26, fat: 0, fiber: 0, sugar: 22, mealType: "breakfast", tags: ["drink", "juice", "vitamin-c"] },
  { name: "Whole Milk (cup)", emoji: "🥛", calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12, mealType: "breakfast", tags: ["drink", "dairy", "calcium"] },
  { name: "Latte (medium)", emoji: "☕", calories: 190, protein: 10, carbs: 20, fat: 7, fiber: 0, sugar: 16, mealType: "breakfast", tags: ["drink", "coffee", "dairy"] },
  { name: "Black Coffee", emoji: "☕", calories: 5, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, mealType: "breakfast", tags: ["drink", "coffee", "zero-calorie"] },
  { name: "Green Tea", emoji: "🍵", calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, mealType: "snack", tags: ["drink", "tea", "antioxidant"] },
  { name: "Mango Juice (cup)", emoji: "🥭", calories: 130, protein: 1, carbs: 32, fat: 0, fiber: 1, sugar: 28, mealType: "snack", tags: ["drink", "juice", "arabic"] },
  { name: "Laban (Buttermilk)", emoji: "🥛", calories: 90, protein: 6, carbs: 10, fat: 2, fiber: 0, sugar: 10, mealType: "breakfast", tags: ["arabic", "dairy", "drink", "probiotic"] },
  { name: "Ayran (Yogurt Drink)", emoji: "🥛", calories: 80, protein: 5, carbs: 8, fat: 2, fiber: 0, sugar: 8, mealType: "snack", tags: ["turkish", "yogurt", "drink"] },

  // ── South & East Asian ─────────────────────────────────────────
  { name: "Dhal Curry", emoji: "🍛", calories: 260, protein: 14, carbs: 38, fat: 6, fiber: 10, sugar: 4, mealType: "dinner", tags: ["south-asian", "lentil", "vegetarian"] },
  { name: "Chicken Tikka Masala", emoji: "🍛", calories: 430, protein: 36, carbs: 22, fat: 22, fiber: 3, sugar: 8, mealType: "dinner", tags: ["south-asian", "curry", "chicken"] },
  { name: "Butter Chicken", emoji: "🍛", calories: 490, protein: 34, carbs: 26, fat: 28, fiber: 3, sugar: 10, mealType: "dinner", tags: ["south-asian", "curry", "chicken"] },
  { name: "Chapati (2 pieces)", emoji: "🫓", calories: 210, protein: 6, carbs: 38, fat: 4, fiber: 4, sugar: 1, mealType: "lunch", tags: ["south-asian", "bread", "whole-wheat"] },
  { name: "Pad Thai", emoji: "🍜", calories: 480, protein: 20, carbs: 62, fat: 16, fiber: 3, sugar: 8, mealType: "dinner", tags: ["thai", "noodles"] },
  { name: "Sushi Roll (8 pieces)", emoji: "🍱", calories: 360, protein: 16, carbs: 58, fat: 8, fiber: 2, sugar: 6, mealType: "lunch", tags: ["japanese", "sushi", "rice"] },
  { name: "Fried Dumplings (6)", emoji: "🥟", calories: 320, protein: 14, carbs: 38, fat: 12, fiber: 2, sugar: 4, mealType: "lunch", tags: ["asian", "dumplings", "fried"] },

  // ── Mediterranean ──────────────────────────────────────────────
  { name: "Grilled Halloumi", emoji: "🧀", calories: 260, protein: 18, carbs: 2, fat: 20, fiber: 0, sugar: 1, mealType: "lunch", tags: ["mediterranean", "cheese", "protein"] },
  { name: "Pita with Dips", emoji: "🫓", calories: 320, protein: 10, carbs: 44, fat: 12, fiber: 5, sugar: 4, mealType: "snack", tags: ["mediterranean", "bread", "dip"] },
  { name: "Spanakopita", emoji: "🥙", calories: 320, protein: 10, carbs: 28, fat: 20, fiber: 3, sugar: 2, mealType: "lunch", tags: ["greek", "pastry", "spinach"] },
  { name: "Moussaka", emoji: "🍲", calories: 420, protein: 24, carbs: 32, fat: 22, fiber: 5, sugar: 8, mealType: "dinner", tags: ["greek", "eggplant", "beef"] },
  { name: "Chicken Souvlaki", emoji: "🍢", calories: 320, protein: 36, carbs: 12, fat: 14, fiber: 2, sugar: 4, mealType: "lunch", tags: ["greek", "grilled", "chicken"] },
];

export function searchFoods(query: string, limit = 8): FoodItem[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const scored = FOOD_DATABASE.map(food => {
    const nameLower = food.name.toLowerCase();
    let score = 0;
    if (nameLower === q) score = 100;
    else if (nameLower.startsWith(q)) score = 80;
    else if (nameLower.includes(q)) score = 60;
    else if (food.tags.some(t => t.includes(q))) score = 40;
    else {
      const words = q.split(/\s+/);
      const matchedWords = words.filter(w => nameLower.includes(w) || food.tags.some(t => t.includes(w)));
      if (matchedWords.length > 0) score = (matchedWords.length / words.length) * 30;
    }
    return { food, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.food);
}
