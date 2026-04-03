// Hook para calcular los promedios de macros de la semana actual
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MacroAveragesData } from '@/types/logging'

// Obtiene el lunes de la semana actual en formato YYYY-MM-DD
function getStartOfWeek(): string {
  const today = new Date()
  const day = today.getDay() // 0=domingo, 1=lunes...
  // Ajuste para que la semana empiece en lunes
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

async function fetchMacroAverages(userId: string): Promise<MacroAveragesData> {
  const supabase = createClient()
  const startOfWeek = getStartOfWeek()
  const today = getTodayString()

  const { data, error } = await supabase
    .from('food_log_entries')
    .select('calories_kcal, protein_g, carbs_g, fat_g')
    .eq('user_id', userId)
    .gte('log_date', startOfWeek)
    .lte('log_date', today)
    .is('deleted_at', null)

  if (error) throw error
  if (!data || data.length === 0) {
    return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, daysWithData: 0 }
  }

  // Agrupar por día para calcular promedio diario
  const byDay = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>()

  // Como no tenemos log_date en el select aquí (solo macros), calculamos promedio
  // por fila y luego dividimos por días con datos (estimado como días únicos de la semana)
  // Calculamos totales de todas las filas
  const totals = data.reduce(
    (acc, row) => ({
      calories: acc.calories + (row.calories_kcal ?? 0),
      protein: acc.protein + (row.protein_g ?? 0),
      carbs: acc.carbs + (row.carbs_g ?? 0),
      fat: acc.fat + (row.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Para contar días con datos, necesitamos log_date — hacer segunda query
  const { data: daysData } = await supabase
    .from('food_log_entries')
    .select('log_date')
    .eq('user_id', userId)
    .gte('log_date', startOfWeek)
    .lte('log_date', today)
    .is('deleted_at', null)

  const uniqueDays = new Set((daysData ?? []).map((r) => r.log_date)).size
  const divisor = uniqueDays > 0 ? uniqueDays : 1

  // Evitar acumulación de byDay sin uso
  byDay.clear()

  return {
    avgCalories: Math.round(totals.calories / divisor),
    avgProtein: Math.round(totals.protein / divisor),
    avgCarbs: Math.round(totals.carbs / divisor),
    avgFat: Math.round(totals.fat / divisor),
    daysWithData: uniqueDays,
  }
}

export function useMacroAverages(userId: string | null) {
  return useQuery({
    queryKey: ['macroAverages', userId],
    queryFn: () => fetchMacroAverages(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
