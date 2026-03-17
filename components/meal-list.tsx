"use client";
import { MealLog } from "@/types";

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

interface Props {
  meals: MealLog[];
  onDelete: (id: string) => void;
}

export default function MealList({ meals, onDelete }: Props) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-4xl mb-3">🥗</p>
        <p className="text-gray-500 text-sm">Registra tu primera comida arriba</p>
      </div>
    );
  }

  const grouped = meals.reduce((acc, meal) => {
    const type = meal.meal_type || "snack";
    if (!acc[type]) acc[type] = [];
    acc[type].push(meal);
    return acc;
  }, {} as Record<string, MealLog[]>);

  const order = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="space-y-4 mt-2">
      {order.filter(t => grouped[t]).map(type => (
        <div key={type}>
          <div className="flex items-center gap-2 mb-2">
            <span>{MEAL_ICONS[type]}</span>
            <span className="text-sm font-medium text-gray-400">{MEAL_LABELS[type]}</span>
            <span className="text-xs text-gray-600 ml-auto">
              {grouped[type].reduce((s, m) => s + m.calories, 0)} kcal
            </span>
          </div>
          <div className="space-y-2">
            {grouped[type].map(meal => (
              <div key={meal.id} className="bg-[#141414] rounded-xl px-4 py-3 border border-[#2a2a2a] flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{meal.parsed_name || meal.raw_input}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    P {Math.round(meal.protein_g)}g · C {Math.round(meal.carbs_g)}g · G {Math.round(meal.fat_g)}g
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="text-sm font-semibold text-white">{meal.calories}</span>
                  <button
                    onClick={() => onDelete(meal.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
