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
  messageKey,
  messageContent,
  userId,
}: PsychSupportCardProps) {
  const [cardState, setCardState] = useState<CardState>('visible')
  const [opacity, setOpacity] = useState(0)
  const [translateY, setTranslateY] = useState(12)
  const { mutate: dismiss } = useDismissPsychFlag(userId)

  // Fade-in al montar
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setOpacity(1)
      setTranslateY(0)
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
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        borderRadius: 18,
        border: '1px solid #FDE68A',
        overflow: 'hidden',
      }}
    >
      {/* Franja de color en el top */}
      <div style={{
        height: 4,
        background: 'linear-gradient(90deg, #FCD34D 0%, #F59E0B 100%)',
      }} />

      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      }}>
        {/* Cabecera */}
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            background: 'rgba(245,158,11,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}>
            💛
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
            Un momento para ti
          </p>
        </div>

        {/* Mensaje (copy sagrado) */}
        <p style={{
          fontSize: 14,
          color: '#44403C',
          lineHeight: 1.6,
          marginBottom: 12,
        }}>
          {messageContent}
        </p>

        {/* Acciones según estado */}
        {cardState === 'visible' && (
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid #FCD34D',
              background: 'rgba(252,211,77,0.2)',
              color: '#92400E',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Entendido 👌
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
    </div>
  )
}
