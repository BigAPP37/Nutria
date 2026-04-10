// Hook para calcular la racha de días logueados consecutivamente
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatLocalDateKey, getTodayDateKey, parseDateKey } from '@/lib/date'

interface StreakData {
  streak: number
  totalComplete: number
}

function getTodayString(): string {
  return getTodayDateKey()
}

function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatLocalDateKey(d)
}

async function fetchStreakDays(userId: string): Promise<StreakData> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('daily_log_status')
    .select('log_date, is_day_complete')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(60)

  if (error) throw error
  if (!data || data.length === 0) return { streak: 0, totalComplete: 0 }

  const totalComplete = data.filter((d) => d.is_day_complete).length

  // Construir un mapa de fecha → completado
  const completionMap = new Map<string, boolean>()
  data.forEach((row) => completionMap.set(row.log_date, row.is_day_complete))

  const today = getTodayString()
  const yesterday = getYesterdayString()

  // La racha empieza desde hoy si hoy está completo, sino desde ayer
  let currentDate: Date
  if (completionMap.get(today)) {
    currentDate = parseDateKey(today)
  } else if (completionMap.get(yesterday)) {
    currentDate = parseDateKey(yesterday)
  } else {
    return { streak: 0, totalComplete }
  }

  let streak = 0
  while (true) {
    const dateStr = formatLocalDateKey(currentDate)
    if (completionMap.get(dateStr) === true) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return { streak, totalComplete }
}

export function useStreakDays(userId: string | null) {
  return useQuery({
    queryKey: ['streakDays', userId],
    queryFn: () => fetchStreakDays(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
