// Tarjeta compacta con el resumen de una semana específica
'use client'

import type { WeeklySnapshotDisplay } from '@/types/logging'

interface WeeklySnapshotCardProps {
  snapshot: WeeklySnapshotDisplay
}

// Formatea el delta de peso de manera neutral, sin juicio moral
function formatWeightDelta(delta: number | null): string {
  if (delta == null) return '—'
  const formatted = Math.abs(delta).toFixed(1)
  if (delta > 0) return `+${formatted} kg`
  if (delta < 0) return `−${formatted} kg`
  return `0.0 kg`
}

export function WeeklySnapshotCard({ snapshot }: WeeklySnapshotCardProps) {
  const {
    week_label,
    complete_days,
    avg_calories_day,
    weight_delta_kg,
    was_adjusted,
    adjustment_kcal,
  } = snapshot

  return (
    <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3">
      {/* Fila principal */}
      <div className="flex items-start justify-between">
        {/* Lado izquierdo: semana y días completados */}
        <div>
          <p className="text-sm font-semibold text-stone-800">{week_label}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {complete_days}/7 días
          </p>
        </div>

        {/* Lado derecho: calorías y delta de peso */}
        <div className="text-right">
          {avg_calories_day != null && (
            <p className="text-sm font-medium text-stone-700">
              {Math.round(avg_calories_day).toLocaleString('es-ES')} kcal/día
            </p>
          )}
          {/* Delta de peso siempre en stone-600 — sin connotación moral */}
          <p className="text-xs text-stone-600 mt-0.5">
            {formatWeightDelta(weight_delta_kg)}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mt-2">
        {was_adjusted && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-700">
            Ajustado {adjustment_kcal > 0 ? '+' : ''}
            {adjustment_kcal} kcal
          </span>
        )}
        {complete_days < 4 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-500">
            Semana incompleta
          </span>
        )}
      </div>
    </div>
  )
}
