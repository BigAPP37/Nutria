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
  colorClass,
}: {
  label: string
  current: number
  target: number
  colorClass: string
}) {
  const percent = Math.min(100, Math.round((current / target) * 100))

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-600 font-medium">{label}</span>
        <span className="text-xs text-stone-400">
          {current}g / {target}g
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function MacroAverages({ data, targets, isLoading }: MacroAveragesProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-stone-100 rounded w-1/2" />
        <div className="h-2 bg-stone-100 rounded-full" />
        <div className="h-2 bg-stone-100 rounded-full" />
        <div className="h-2 bg-stone-100 rounded-full" />
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
    <div className="space-y-3">
      {/* Título y subtítulo */}
      <div>
        <p className="text-sm font-semibold text-stone-800">Macros promedio — última semana</p>
        <p className="text-xs text-stone-400 mt-0.5">
          {data.daysWithData} {data.daysWithData === 1 ? 'día con datos' : 'días con datos'}
        </p>
      </div>

      {/* Barras de macros */}
      <MacroBar
        label="Proteína"
        current={data.avgProtein}
        target={proteinTarget}
        colorClass="bg-orange-500"
      />
      <MacroBar
        label="Carbohidratos"
        current={data.avgCarbs}
        target={carbsTarget}
        colorClass="bg-emerald-500"
      />
      <MacroBar
        label="Grasa"
        current={data.avgFat}
        target={fatTarget}
        colorClass="bg-amber-400"
      />
    </div>
  )
}
