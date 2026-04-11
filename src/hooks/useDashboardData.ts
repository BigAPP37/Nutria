'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DailyLogStatus, FoodLogEntry } from '@/types/database'

type DashboardData = {
  foodEntries: FoodLogEntry[]
  isLoggingComplete: boolean
  waterGlasses: number
}

async function fetchDashboardData(userId: string, logDate: string): Promise<DashboardData> {
  const supabase = createClient()

  const [
    { data: entries, error: entriesError },
    { data: status, error: statusError },
    { data: waterRows, error: waterError },
  ] = await Promise.all([
    supabase
      .from('food_log_entries')
      .select('*, foods(name)')
      .eq('user_id', userId)
      .eq('log_date', logDate)
      .is('deleted_at', null)
      .order('id', { ascending: true }),
    supabase
      .from('daily_log_status')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', logDate)
      .maybeSingle<DailyLogStatus>(),
    supabase
      .from('water_log')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('log_date', logDate)
      .order('created_at', { ascending: false }),
  ])

  const errors = [entriesError, statusError, waterError].filter(Boolean)
  if (errors.length > 0) {
    throw new Error('No se pudieron cargar todos los datos del día.')
  }

  const totalWaterMl = (waterRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount_ml ?? 0),
    0
  )

  return {
    foodEntries: (entries as FoodLogEntry[]) || [],
    isLoggingComplete: status?.is_day_complete || false,
    waterGlasses: Math.round(totalWaterMl / 250),
  }
}

export function useDashboardData(userId: string | null, logDate: string) {
  return useQuery({
    queryKey: ['dashboardData', userId, logDate],
    queryFn: () => fetchDashboardData(userId!, logDate),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}
