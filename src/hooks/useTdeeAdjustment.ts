'use client'

// Analiza el historial semanal y sugiere un ajuste de calorías si el usuario no progresa
// Devuelve sugerencia solo si hay ≥2 semanas con datos de peso y el usuario no avanza

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserGoal } from '@/types/database'

export interface TdeeAdjustment {
  shouldAdjust: boolean
  direction: 'up' | 'down'
  delta: number          // kcal a añadir/restar
  suggestedKcal: number  // nueva meta calórica
  reason: string
}

async function computeAdjustment(userId: string): Promise<TdeeAdjustment | null> {
  const supabase = createClient()

  // Cargar perfil (objetivo) y estado TDEE actual
  const [{ data: profile }, { data: tdeeRow }] = await Promise.all([
    supabase.from('user_profiles').select('goal').eq('id', userId).single(),
    supabase.from('user_tdee_state').select('goal_kcal').eq('user_id', userId).maybeSingle(),
  ])

  if (!profile || !tdeeRow) return null

  const goal = profile.goal as UserGoal
  const currentKcal = tdeeRow.goal_kcal as number

  // Obtener últimas 3 semanas con datos de peso
  const { data: snapshots } = await supabase
    .from('tdee_weekly_snapshots')
    .select('week_start, avg_weight_kg, weight_delta_kg, complete_days')
    .eq('user_id', userId)
    .not('avg_weight_kg', 'is', null)
    .order('week_start', { ascending: false })
    .limit(3)

  if (!snapshots || snapshots.length < 2) return null

  // Necesitamos al menos 2 semanas con ≥3 días registrados para confiar en los datos
  const validSnapshots = snapshots.filter(s => (s.complete_days ?? 0) >= 3)
  if (validSnapshots.length < 2) return null

  // Calcular delta promedio de peso en las últimas semanas
  const deltas = validSnapshots
    .map(s => s.weight_delta_kg as number | null)
    .filter((d): d is number => d !== null)

  if (deltas.length < 2) return null

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
  const DELTA = 200 // kcal de ajuste

  if (goal === 'lose_weight') {
    // Esperamos pérdida de ~0.25–0.75 kg/semana
    // Si no está bajando de peso (delta >= -0.1 kg/semana), sugerir reducir
    if (avgDelta >= -0.1) {
      const suggested = currentKcal - DELTA
      return {
        shouldAdjust: true,
        direction: 'down',
        delta: DELTA,
        suggestedKcal: suggested,
        reason: `Tu peso no está bajando en las últimas ${validSnapshots.length} semanas. Reducir ${DELTA} kcal puede ayudar.`,
      }
    }
  } else if (goal === 'gain_muscle') {
    // Esperamos ganancia de ~0.1–0.4 kg/semana
    // Si no está subiendo (delta <= 0.05 kg/semana), sugerir aumentar
    if (avgDelta <= 0.05) {
      const suggested = currentKcal + DELTA
      return {
        shouldAdjust: true,
        direction: 'up',
        delta: DELTA,
        suggestedKcal: suggested,
        reason: `Tu peso no está aumentando en las últimas ${validSnapshots.length} semanas. Aumentar ${DELTA} kcal puede ayudar.`,
      }
    }
  } else if (goal === 'maintain') {
    // Si el peso se mueve más de 0.3 kg/semana en cualquier dirección
    if (Math.abs(avgDelta) > 0.3) {
      const direction = avgDelta > 0 ? 'down' : 'up'
      const delta = direction === 'down' ? DELTA : DELTA
      const suggested = direction === 'down' ? currentKcal - delta : currentKcal + delta
      return {
        shouldAdjust: true,
        direction,
        delta,
        suggestedKcal: suggested,
        reason: `Tu peso está cambiando más de lo esperado. Ajustar ${delta} kcal puede estabilizarte.`,
      }
    }
  }

  return null
}

export function useTdeeAdjustment(userId: string | null) {
  return useQuery({
    queryKey: ['tdeeAdjustment', userId],
    queryFn: () => computeAdjustment(userId!),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1 hora
  })
}
