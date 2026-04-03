'use client'

// Tarjeta de soporte psicológico que se muestra en el dashboard
// Animación de fade-in al montar, flujo: visible → feedback → done

import { useState, useEffect } from 'react'
import { useDismissPsychFlag } from '@/hooks/useDismissPsychFlag'
import { PsychFeedbackButtons } from '@/components/psych/PsychFeedbackButtons'

interface PsychSupportCardProps {
  flagId: string
  flagType: string
  messageKey: string
  messageContent: string
  userId: string
}

type CardState = 'visible' | 'feedback' | 'done'

export function PsychSupportCard({
  flagId,
  flagType,
  messageKey,
  messageContent,
  userId,
}: PsychSupportCardProps) {
  const [cardState, setCardState] = useState<CardState>('visible')
  const [opacity, setOpacity] = useState(0)
  const { mutate: dismiss } = useDismissPsychFlag(userId)

  // Fade-in al montar
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setOpacity(100)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  if (cardState === 'done') return null

  function handleDismiss() {
    dismiss(
      { flagId, messageKey, messageContent },
      {
        onSuccess: () => setCardState('feedback'),
      }
    )
  }

  return (
    <div
      role="alert"
      style={{ opacity: opacity / 100 }}
      className="transition-opacity duration-300 bg-amber-50 border border-amber-200 rounded-2xl p-4"
    >
      {/* Cabecera */}
      <div className="flex items-center gap-1.5">
        <span>💛</span>
        <p className="text-xs font-medium text-amber-700">Un momento</p>
      </div>

      {/* Mensaje (copy sagrado) */}
      <p className="text-sm text-stone-700 leading-relaxed mt-2">{messageContent}</p>

      {/* Acciones según estado */}
      {cardState === 'visible' && (
        <button
          type="button"
          onClick={handleDismiss}
          className="bg-stone-100 text-stone-600 text-xs rounded-lg px-3 py-1.5 hover:bg-stone-200 mt-3 transition-colors"
        >
          Entendido
        </button>
      )}

      {cardState === 'feedback' && (
        <PsychFeedbackButtons
          flagId={flagId}
          userId={userId}
          onComplete={() => {
            setTimeout(() => setCardState('done'), 400)
          }}
        />
      )}
    </div>
  )
}
