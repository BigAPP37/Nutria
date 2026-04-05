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

  const completionPercent = Math.round((complete_days / 7) * 100)

  return (
    <div style={{
      background: 'white',
      borderRadius: 18,
      border: '1px solid #E7E5E4',
      padding: '14px 16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Fila principal */}
      <div className="flex items-start justify-between">
        {/* Lado izquierdo */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>
            {week_label}
          </p>

          {/* Mini progress bar de días */}
          <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
            <div style={{
              height: 4,
              width: 60,
              background: '#F5F4F3',
              borderRadius: 99,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${completionPercent}%`,
                background: complete_days >= 5
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : 'linear-gradient(90deg, #F97316, #EA580C)',
                borderRadius: 99,
              }} />
            </div>
            <span style={{ fontSize: 11, color: '#A8A29E' }}>
              {complete_days}/7 días
            </span>
          </div>
        </div>

        {/* Lado derecho: calorías y delta de peso */}
        <div style={{ textAlign: 'right' }}>
          {avg_calories_day != null && (
            <div className="flex items-baseline gap-1 justify-end">
              <span style={{ fontSize: 16, fontWeight: 800, color: '#F97316' }}>
                {Math.round(avg_calories_day).toLocaleString('es-ES')}
              </span>
              <span style={{ fontSize: 11, color: '#A8A29E' }}>kcal/día</span>
            </div>
          )}
          {/* Delta de peso siempre en stone-600 — sin connotación moral */}
          <p style={{ fontSize: 12, color: '#78716C', marginTop: 3, fontWeight: 500 }}>
            {formatWeightDelta(weight_delta_kg)}
          </p>
        </div>
      </div>

      {/* Badges */}
      {(was_adjusted || complete_days < 4) && (
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 10 }}>
          {was_adjusted && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 9px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              background: '#FFF7ED',
              color: '#C2410C',
              border: '1px solid #FED7AA',
            }}>
              Ajustado {adjustment_kcal > 0 ? '+' : ''}
              {adjustment_kcal} kcal
            </span>
          )}
          {complete_days < 4 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 9px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              background: '#F5F4F3',
              color: '#78716C',
            }}>
              Semana incompleta
            </span>
          )}
        </div>
      )}
    </div>
  )
}
