"use client";
import { useEffect, useState, useCallback } from "react";
import MacroRing from "@/components/macro-ring";
import MealList from "@/components/meal-list";
import AiAdviceBanner from "@/components/ai-advice-banner";
import ChatInput from "@/components/chat-input";
import { MealLog, DayTotals } from "@/types";

export default function DashboardPage() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [profile, setProfile] = useState<{ target_calories: number; target_protein: number; target_carbs: number; target_fat: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const totals: DayTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein_g: acc.protein_g + (m.protein_g || 0),
      carbs_g: acc.carbs_g + (m.carbs_g || 0),
      fat_g: acc.fat_g + (m.fat_g || 0),
      fiber_g: acc.fiber_g + (m.fiber_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const [mealsRes, profileRes] = await Promise.all([
      fetch(`/api/meals?date=${today}`),
      fetch("/api/user/profile"),
    ]);
    const { meals: m } = await mealsRes.json();
    const { profile: p } = await profileRes.json();
    setMeals(m || []);
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    await fetch("/api/meals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setMeals(prev => prev.filter(m => m.id !== id));
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  const remaining = (profile?.target_calories || 0) - totals.calories;
  const greeting = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-gray-400 text-sm">{greeting}{profile?.name ? `, ${profile.name}` : ""}</p>
          <h1 className="text-2xl font-bold mt-0.5">
            {remaining > 0 ? `${remaining} kcal restantes` : `${Math.abs(remaining)} kcal de más`}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{totals.calories}</p>
          <p className="text-xs text-gray-500">de {profile?.target_calories || 0}</p>
        </div>
      </div>

      {/* Macro Ring */}
      {profile && (
        <MacroRing
          totals={totals}
          targets={{ calories: profile.target_calories, protein: profile.target_protein, carbs: profile.target_carbs, fat: profile.target_fat }}
        />
      )}

      {/* AI Advice */}
      <AiAdviceBanner />

      {/* Chat Input */}
      <ChatInput onMealAdded={fetchData} />

      {/* Meal List */}
      <MealList meals={meals} onDelete={handleDelete} />
    </div>
  );
}
