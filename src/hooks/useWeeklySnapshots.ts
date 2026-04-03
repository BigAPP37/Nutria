// Hook para obtener los snapshots semanales del usuario
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { WeeklySnapshotDisplay } from '@/types/logging'

// Formatea el rango de la semana en español: "11–17 Mar"
function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const startDay = start.getDate()
  const endDay = end.getDate()
  const endMonth = end.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')

  // Si el inicio y el fin están en el mismo mes, no repetir el mes
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${endMonth}`
  }

  const startMonth = start.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
  return `${startDay} ${startMonth}–${endDay} ${endMonth}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSnapshot(row: Record<string, any>): WeeklySnapshotDisplay {
  return {
    week_label: formatWeekLabel(row.week_start),
    week_start: row.week_start,
    avg_weight_kg: row.avg_weight_kg ?? null,
    weight_delta_kg: row.weight_delta_kg ?? null,
    avg_calories_day: row.avg_calories_day ?? null,
    complete_days: row.complete_days ?? 0,
    was_adjusted: row.was_adjusted ?? false,
    adjustment_kcal: row.adjustment_kcal ?? 0,
    tdee_after: row.tdee_after ?? 0,
  }
}

async function fetchWeeklySnapshots(userId: string): Promise<WeeklySnapshotDisplay[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tdee_weekly_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(12)

  if (error) throw error
  if (!data) return []

  return data.map(transformSnapshot)
}

export function useWeeklySnapshots(userId: string | null) {
  return useQuery({
    queryKey: ['weeklySnapshots', userId],
    queryFn: () => fetchWeeklySnapshots(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
