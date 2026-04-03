'use client'

// Botones de feedback para mensajes psicológicos
// Permite al usuario indicar si el mensaje le fue útil o no

import { usePsychFeedback } from '@/hooks/usePsychFeedback'

interface PsychFeedbackButtonsProps {
  flagId: string
  userId: string
  onComplete: () => void
}

export function PsychFeedbackButtons({ flagId, userId, onComplete }: PsychFeedbackButtonsProps) {
  const { mutate: sendFeedback } = usePsychFeedback(userId)

  function handleFeedback(wasHelpful: boolean) {
    sendFeedback({ flagId, wasHelpful })
    onComplete()
  }

  return (
    <div className="flex items-center mt-3">
      <span className="text-xs text-stone-400 mr-2">¿Te fue útil?</span>
      <button
        type="button"
        aria-label="Me fue útil"
        onClick={() => handleFeedback(true)}
        className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs px-2.5 py-1 rounded-lg transition-colors"
      >
        👍
      </button>
      <button
        type="button"
        aria-label="No me fue útil"
        onClick={() => handleFeedback(false)}
        className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs px-2.5 py-1 rounded-lg transition-colors ml-1"
      >
        👎
      </button>
    </div>
  )
}
