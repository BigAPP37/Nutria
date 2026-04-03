// Gráfico de barras de calorías promedio por semana
'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts'
import { EmptyState } from './EmptyState'
import type { WeeklySnapshotDisplay } from '@/types/logging'

interface CalorieChartProps {
  snapshots: WeeklySnapshotDisplay[]
  goalKcal: number
  isLoading: boolean
}

// Tooltip personalizado con fondo oscuro
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-stone-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
      <p className="text-white/60 mb-0.5">{label}</p>
      <p className="font-medium">{Math.round(payload[0].value).toLocaleString('es-ES')} kcal</p>
    </div>
  )
}

export function CalorieChart({ snapshots, goalKcal, isLoading }: CalorieChartProps) {
  if (isLoading) {
    return <div className="animate-pulse bg-stone-100 rounded-xl h-[200px] w-full" />
  }

  // Filtrar semanas con al menos 4 días, tomar las últimas 8, ordenar ascendente
  const validSnapshots = snapshots
    .filter((s) => s.complete_days >= 4 && s.avg_calories_day != null)
    .slice(0, 8)
    .reverse()

  if (validSnapshots.length < 2) {
    return (
      <EmptyState message="Completa al menos 2 semanas para ver el gráfico" />
    )
  }

  const chartData = validSnapshots.map((s) => ({
    week_label: s.week_label,
    avg_calories_day: s.avg_calories_day ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="week_label"
          tick={{ fontSize: 10, fill: '#a8a29e' }}
          axisLine={false}
          tickLine={false}
        />
        {/* YAxis oculto */}
        <YAxis hide />
        <ReferenceLine
          y={goalKcal}
          stroke="#F97316"
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f4' }} />
        <Bar dataKey="avg_calories_day" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              // Por debajo o igual al objetivo → emerald; por encima → amber (nunca rojo)
              fill={entry.avg_calories_day <= goalKcal ? '#10B981' : '#F59E0B'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
