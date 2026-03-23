// src/features/logging/useManualLog.ts
// Mutation para logging manual: el usuario seleccionó un alimento de la DB,
// eligió porción y cantidad, y confirma.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

interface ManualLogInput {
  foodId: string;
  servingId: string | null;
  servingQuantity: number | null; // ej: 1.5 tazas
  quantityGrams: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  date: string; // ISO date
}

export function useManualLog() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: ManualLogInput) => {
      if (!userId) throw new Error("Usuario no autenticado");

      // 1. Obtener datos nutricionales del alimento
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("calories_kcal, protein_g, carbs_g, fat_g, fiber_g")
        .eq("id", input.foodId)
        .single();

      if (foodError || !food) {
        throw new Error("No se encontró el alimento");
      }

      // 2. Calcular nutrientes proporcionales a la cantidad
      const factor = input.quantityGrams / 100;

      // 3. Insertar en food_log_entries
      const { error: insertError } = await supabase
        .from("food_log_entries")
        .insert({
          user_id: userId,
          log_date: input.date,
          meal_type: input.mealType,
          food_id: input.foodId,
          serving_id: input.servingId,
          serving_quantity: input.servingQuantity,
          quantity_grams: input.quantityGrams,
          calories_kcal: Math.round(food.calories_kcal * factor * 10) / 10,
          protein_g: Math.round(food.protein_g * factor * 10) / 10,
          carbs_g: Math.round(food.carbs_g * factor * 10) / 10,
          fat_g: Math.round(food.fat_g * factor * 10) / 10,
          fiber_g: Math.round((food.fiber_g ?? 0) * factor * 10) / 10,
          logging_method: "manual",
          ai_confidence: null,
        });

      if (insertError) {
        throw new Error(`Error guardando entrada: ${insertError.message}`);
      }
    },

    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: queryKeys.dailyLog(input.date) });
      qc.invalidateQueries({ queryKey: queryKeys.dailySummary(input.date) });
    },
  });
}
