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
      <div className="animate-pulse bg-orange-200 rounded-2xl h-[200px] w-full" />
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
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
      {/* Número principal */}
      <div className="mb-4">
        <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">
          Tu objetivo diario
        </p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold leading-none">
            {goalKcal != null ? goalKcal.toLocaleString('es-ES') : '—'}
          </span>
          <span className="text-white/80 text-sm pb-0.5">kcal/día</span>
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-white/20 mb-4" />

      {/* Barra de confianza */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/90">{confidenceLabel}</span>
          <span className="text-xs text-white/60">
            {weeksOfData} {weeksOfData === 1 ? 'semana' : 'semanas'} de datos
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      {/* Mensaje contextual */}
      <p className="text-xs text-white/70 leading-relaxed">{contextMessage}</p>
    </div>
  )
}
