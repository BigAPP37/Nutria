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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#78716C', fontWeight: 500 }}>
        ¿Te fue útil?
      </span>
      <button
        type="button"
        aria-label="Me fue útil"
        onClick={() => handleFeedback(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 12px',
          borderRadius: 99,
          border: '1px solid #D1FAE5',
          background: '#ECFDF5',
          color: '#065F46',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#D1FAE5'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ECFDF5'
        }}
      >
        👍 Sí
      </button>
      <button
        type="button"
        aria-label="No me fue útil"
        onClick={() => handleFeedback(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 12px',
          borderRadius: 99,
          border: '1px solid #E7E5E4',
          background: '#F5F4F3',
          color: '#78716C',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#E7E5E4'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#F5F4F3'
        }}
      >
        👎 No
      </button>
    </div>
  )
}
