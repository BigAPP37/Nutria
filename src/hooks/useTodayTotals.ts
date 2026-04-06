'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type TodayTotals = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

async function fetchTodayTotals(userId: string): Promise<TodayTotals> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('food_log_entries')
    .select('calories_kcal, protein_g, carbs_g, fat_g')
    .eq('user_id', userId)
    .eq('log_date', today)
    .is('deleted_at', null)

  if (error) throw error

  return (data ?? []).reduce(
    (acc, row) => ({
      calories:  acc.calories  + (row.calories_kcal ?? 0),
      protein_g: acc.protein_g + (row.protein_g ?? 0),
      carbs_g:   acc.carbs_g   + (row.carbs_g ?? 0),
      fat_g:     acc.fat_g     + (row.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
}

export function useTodayTotals(userId: string | null) {
  return useQuery({
    queryKey: ['todayTotals', userId],
    queryFn: () => fetchTodayTotals(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
