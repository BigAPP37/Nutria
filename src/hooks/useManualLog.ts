'use client'

// Hook para registrar manualmente un alimento en el diario de comidas
// Inserta directamente en food_log_entries sin pasar por la IA

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MealType } from '@/types/database'
import type { FoodLogEntry } from '@/types/database'

interface ManualLogParams {
  userId: string
  foodId: string
  quantityGrams: number
  mealType: MealType
  logDate: string
  // Macros pre-calculados del alimento seleccionado
  caloriesKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number | null
}

// Inserta un registro manual en food_log_entries
async function insertManualLog(params: ManualLogParams): Promise<FoodLogEntry> {
  const supabase = createClient()

  const {
    userId,
    foodId,
    quantityGrams,
    mealType,
    logDate,
    caloriesKcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
  } = params

  const { data, error } = await supabase
    .from('food_log_entries')
    .insert({
      user_id: userId,
      food_id: foodId,
      log_date: logDate,
      meal_type: mealType,
      logging_method: 'manual',
      calories_kcal: caloriesKcal,
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
      fiber_g: fiberG,
      quantity_grams: quantityGrams,
      custom_description: null,
      deleted_at: null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al registrar el alimento: ${error.message}`)
  }

  return data as FoodLogEntry
}

// Hook que retorna la mutación para el registro manual
export function useManualLog() {
  const queryClient = useQueryClient()

  return useMutation<FoodLogEntry, Error, ManualLogParams>({
    mutationFn: insertManualLog,
    onSuccess: () => {
      // La UI consume los totales del día vía `todayTotals`.
      queryClient.invalidateQueries({ queryKey: ['todayTotals'] })
    },
  })
}
