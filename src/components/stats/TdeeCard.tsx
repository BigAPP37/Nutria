// Tarjeta del objetivo calórico diario con barra de confianza
'use client'

import type { TdeeDisplayState } from '@/types/logging'

interface TdeeCardProps {
  tdeeState: TdeeDisplayState | null
  isLoading: boolean
}

// Mensaje contextual según el nivel de confianza
function getContextMessage(confidence: number): string {
  if (confidence < 0.3) return 'Registra tu peso semanalmente para mejorar la precisión'
  if (confidence <= 0.6) return 'Tu plan se está ajustando, sigue registrando'
  return 'Tu plan está bastante ajustado a ti'
}

export function TdeeCard({ tdeeState, isLoading }: TdeeCardProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse" style={{
        height: 200,
        borderRadius: 20,
        background: 'linear-gradient(135deg, #FED7AA 0%, #FB923C 100%)',
      }} />
    )
  }

  const goalKcal = tdeeState?.goal_kcal ?? null
  const confidenceLevel = tdeeState?.confidence_level ?? 0
  const confidenceLabel = tdeeState?.confidence_label ?? 'Estimación inicial'
  const weeksOfData = tdeeState?.weeks_of_data ?? 0
  const contextMessage = getContextMessage(confidenceLevel)
  // Porcentaje de la barra, mínimo 4% para que siempre sea visible
  const barPercent = Math.max(4, Math.round(confidenceLevel * 100))

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
      borderRadius: 20,
      padding: '22px 22px 20px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 130,
        height: 130,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -20,
        left: 40,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Label */}
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          Tu objetivo diario
        </p>

        {/* Número principal */}
        <div className="flex items-end gap-2" style={{ marginBottom: 20 }}>
          <span style={{
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-2px',
          }}>
            {goalKcal != null ? goalKcal.toLocaleString('es-ES') : '—'}
          </span>
          <span style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.75)',
            marginBottom: 8,
          }}>
            kcal/día
          </span>
        </div>

        {/* Divisor */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginBottom: 14 }} />

        {/* Barra de confianza */}
        <div style={{ marginBottom: 10 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              {confidenceLabel}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {weeksOfData} {weeksOfData === 1 ? 'semana' : 'semanas'} de datos
            </span>
          </div>
          <div style={{
            height: 6,
            borderRadius: 99,
            background: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            <div
              style={{
                height: '100%',
                borderRadius: 99,
                background: 'white',
                width: `${barPercent}%`,
                transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 0 8px rgba(255,255,255,0.6)',
              }}
            />
          </div>
        </div>

        {/* Mensaje contextual */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          {contextMessage}
        </p>
      </div>
    </div>
  )
}
