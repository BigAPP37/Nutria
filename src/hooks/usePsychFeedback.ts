'use client'

// Hook para registrar si el mensaje psicológico fue útil o no (fire-and-forget)
// Actualiza was_helpful en psychological_responses sin invalidar queries

import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface FeedbackPayload {
  flagId: string
  wasHelpful: boolean
}

export function usePsychFeedback(userId: string | null) {
  return useMutation({
    mutationFn: async ({ flagId, wasHelpful }: FeedbackPayload) => {
      if (!userId) throw new Error('No user ID')

      const supabase = createClient()

      const { error } = await supabase
        .from('psychological_responses')
        .update({ was_helpful: wasHelpful })
        .eq('flag_id', flagId)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Error updating psych feedback: ${error.message}`)
      }
    },
    // Sin onSuccess: fire-and-forget, no se invalida ninguna query
  })
}
