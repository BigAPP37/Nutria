'use client'

// Hook para registrar el descarte (dismiss) de un flag psicológico
// Inserta una fila en psychological_responses e invalida la query del flag activo

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DismissPayload {
  flagId: string
  messageKey: string
  messageContent: string
}

export function useDismissPsychFlag(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ flagId, messageKey, messageContent }: DismissPayload) => {
      if (!userId) throw new Error('No user ID')

      const supabase = createClient()
      const now = new Date().toISOString()

      const { error } = await supabase.from('psychological_responses').insert({
        user_id: userId,
        flag_id: flagId,
        message_key: messageKey,
        message_content: messageContent,
        shown_at: now,
        dismissed_at: now,
        was_helpful: null,
      })

      if (error) {
        throw new Error(`Error dismissing psych flag: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Invalidar la query del flag activo para que desaparezca de la UI
      queryClient.invalidateQueries({ queryKey: ['psychFlag', userId] })
    },
  })
}
