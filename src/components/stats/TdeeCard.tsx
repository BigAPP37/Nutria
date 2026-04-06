'use client'

import type { TdeeDisplayState } from '@/types/logging'
import type { TodayTotals } from '@/hooks/useTodayTotals'

interface TdeeCardProps {
  tdeeState: TdeeDisplayState | null
  todayTotals: TodayTotals | null
  isLoading: boolean
}

function MacroBar({ label, consumed, target, color }: {
  label: string; consumed: number; target: number; color: string
}) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0
  const over = consumed > target
  return (
    <div className="flex-1">
      <div className="flex items-end justify-between mb-1.5">
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: over ? '#FCD34D' : 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
          {Math.round(consumed)}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>/{Math.round(target)}g</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          borderRadius: 99,
          background: over ? '#FCD34D' : color,
          width: `${pct * 100}%`,
          transition: 'width 0.6s ease',
          boxShadow: over ? '0 0 6px rgba(252,211,77,0.6)' : `0 0 6px ${color}88`,
        }} />
      </div>
    </div>
  )
}

export function TdeeCard({ tdeeState, todayTotals, isLoading }: TdeeCardProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse" style={{
        height: 220,
        borderRadius: 24,
        background: 'linear-gradient(135deg, #FED7AA 0%, #FB923C 100%)',
      }} />
    )
  }

  const goal      = tdeeState?.goal_kcal ?? null
  const consumed  = Math.round(todayTotals?.calories ?? 0)
  const remaining = goal != null ? Math.max(goal - consumed, 0) : null
  const over      = goal != null && consumed > goal
  const pct       = goal != null && goal > 0 ? Math.min(consumed / goal, 1) : 0

  const targets   = tdeeState?.macro_targets
  const weeksOfData      = tdeeState?.weeks_of_data ?? 0
  const confidenceLevel  = tdeeState?.confidence_level ?? 0
  const barPercent       = Math.max(4, Math.round(confidenceLevel * 100))

  // SVG arc
  const R = 42
  const STROKE = 6
  const SIZE = (R + STROKE) * 2 + 4
  const CENTER = SIZE / 2
  const C = 2 * Math.PI * R
  const dashOffset = C * (1 - pct)

  return (
    <div style={{
      background: 'linear-gradient(150deg, #F97316 0%, #C2410C 100%)',
      borderRadius: 24,
      padding: '20px 20px 18px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
    }}>
      {/* Decorative bg circles */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, left: 20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Objetivo diario
        </p>

        {/* Fila principal: arco + números */}
        <div className="flex items-center gap-5" style={{ marginBottom: 18 }}>
          {/* Arco de progreso */}
          <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
            <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={STROKE} />
              {goal != null && (
                <circle
                  cx={CENTER} cy={CENTER} r={R}
                  fill="none"
                  stroke={over ? '#FCD34D' : 'white'}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.8s ease', filter: over ? 'drop-shadow(0 0 4px rgba(252,211,77,0.7))' : 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' }}
                />
              )}
            </svg>
            {/* % en el centro del arco */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: over ? '#FCD34D' : 'white', letterSpacing: '-0.5px' }}>
                {goal != null ? `${Math.round(pct * 100)}%` : '—'}
              </span>
            </div>
          </div>

          {/* Calorías */}
          <div className="flex-1">
            {/* Consumidas */}
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', color: over ? '#FCD34D' : 'white' }}>
                {consumed.toLocaleString('es-ES')}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginLeft: 4 }}>kcal</span>
            </div>
            {/* Restantes / objetivo */}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
              {goal != null ? (
                over
                  ? <span style={{ color: '#FCD34D', fontWeight: 700 }}>+{(consumed - goal).toLocaleString('es-ES')} sobre el objetivo</span>
                  : <><span style={{ color: 'white', fontWeight: 700 }}>{remaining!.toLocaleString('es-ES')}</span> kcal restantes</>
              ) : (
                <span>Objetivo: calculando…</span>
              )}
            </div>
            {goal != null && (
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                de {goal.toLocaleString('es-ES')} kcal/día
              </p>
            )}
          </div>
        </div>

        {/* Macros */}
        {targets && (
          <div className="flex gap-3" style={{ marginBottom: 16 }}>
            <MacroBar label="Proteína" consumed={todayTotals?.protein_g ?? 0} target={targets.protein_g} color="#34D399" />
            <MacroBar label="Carbos"   consumed={todayTotals?.carbs_g ?? 0}   target={targets.carbs_g}   color="#FBBF24" />
            <MacroBar label="Grasa"    consumed={todayTotals?.fat_g ?? 0}     target={targets.fat_g}     color="#A78BFA" />
          </div>
        )}

        {/* Confianza del modelo (discreta, abajo) */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {tdeeState?.confidence_label ?? 'Estimación inicial'}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              {weeksOfData} {weeksOfData === 1 ? 'sem.' : 'sem.'} de datos
            </span>
          </div>
          <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 99,
              background: 'rgba(255,255,255,0.6)',
              width: `${barPercent}%`,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
