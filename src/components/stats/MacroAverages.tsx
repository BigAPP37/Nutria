// Barras de progreso de macros promedio para la semana actual
'use client'

import { EmptyState } from './EmptyState'
import type { MacroAveragesData } from '@/types/logging'

interface MacroTargets {
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface MacroAveragesProps {
  data: MacroAveragesData | null
  targets: MacroTargets | null
  isLoading: boolean
}

// Barra de progreso individual para un macro
function MacroBar({
  label,
  current,
  target,
  color,
  emoji,
}: {
  label: string
  current: number
  target: number
  color: string
  emoji: string
}) {
  const percent = Math.min(100, Math.round((current / target) * 100))
  const isGood = percent >= 70 && percent <= 110

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14 }}>{emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#44403C' }}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>{current}g</span>
          <span style={{ fontSize: 11, color: '#A8A29E' }}>/ {target}g</span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: isGood ? '#059669' : '#F97316',
            background: isGood ? '#D1FAE5' : '#FFF7ED',
            padding: '1px 6px',
            borderRadius: 99,
          }}>
            {percent}%
          </span>
        </div>
      </div>
      <div style={{
        height: 8,
        background: '#F5F4F3',
        borderRadius: 99,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div
          style={{
            height: '100%',
            borderRadius: 99,
            background: color,
            width: `${percent}%`,
            transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  )
}

export function MacroAverages({ data, targets, isLoading }: MacroAveragesProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ height: 14, background: '#F5F4F3', borderRadius: 6, width: '50%' }} />
        {[1,2,3].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ height: 12, background: '#F5F4F3', borderRadius: 4 }} />
            <div style={{ height: 8, background: '#F5F4F3', borderRadius: 99 }} />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.daysWithData === 0) {
    return <EmptyState message="Sin datos esta semana" />
  }

  // Usar targets proporcionados o valores por defecto razonables
  const proteinTarget = targets?.protein_g ?? 150
  const carbsTarget = targets?.carbs_g ?? 250
  const fatTarget = targets?.fat_g ?? 65

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Título y subtítulo */}
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917' }}>
          Macros promedio
        </p>
        <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>
          Esta semana · {data.daysWithData} {data.daysWithData === 1 ? 'día con datos' : 'días con datos'}
        </p>
      </div>

      {/* Barras de macros */}
      <MacroBar
        label="Proteína"
        current={data.avgProtein}
        target={proteinTarget}
        color="linear-gradient(90deg, #F97316 0%, #EA580C 100%)"
        emoji="🥩"
      />
      <MacroBar
        label="Carbohidratos"
        current={data.avgCarbs}
        target={carbsTarget}
        color="linear-gradient(90deg, #10B981 0%, #059669 100%)"
        emoji="🍞"
      />
      <MacroBar
        label="Grasa"
        current={data.avgFat}
        target={fatTarget}
        color="linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
        emoji="🥑"
      />
    </div>
  )
}
