// Hook para registrar el peso del usuario
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface LogWeightPayload {
  weight_kg: number
}

async function insertWeight(userId: string, weight_kg: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('weight_entries').insert({
    user_id: userId,
    weight_kg,
    recorded_at: new Date().toISOString(),
    notes: null,
  })

  if (error) throw error
}

export function useLogWeight(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ weight_kg }: LogWeightPayload) => {
      if (!userId) throw new Error('Usuario no autenticado')
      return insertWeight(userId, weight_kg)
    },
    onSuccess: () => {
      // Invalidar el historial de peso para refrescar el gráfico
      queryClient.invalidateQueries({ queryKey: ['weightHistory', userId] })
    },
  })
}
