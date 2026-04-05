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

// Tooltip personalizado
function CustomTooltip({ active, payload, label, goalKcal }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  goalKcal?: number
}) {
  if (!active || !payload?.length) return null
  const val = Math.round(payload[0].value)
  const isUnder = goalKcal != null ? val <= goalKcal : true
  return (
    <div style={{
      background: '#1C1917',
      color: 'white',
      fontSize: 12,
      padding: '8px 12px',
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 3, fontSize: 11 }}>{label}</p>
      <p style={{ fontWeight: 700, fontSize: 14 }}>
        {val.toLocaleString('es-ES')} kcal
      </p>
      {goalKcal != null && (
        <p style={{ fontSize: 10, color: isUnder ? '#6EE7B7' : '#FDE68A', marginTop: 2 }}>
          {isUnder ? `${goalKcal - val} bajo objetivo` : `${val - goalKcal} sobre objetivo`}
        </p>
      )}
    </div>
  )
}

export function CalorieChart({ snapshots, goalKcal, isLoading }: CalorieChartProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse" style={{
        background: '#F5F4F3',
        borderRadius: 16,
        height: 220,
        width: '100%',
      }} />
    )
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
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barCategoryGap="28%" margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barUnder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="barOver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
            <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="week_label"
          tick={{ fontSize: 10, fill: '#A8A29E' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <ReferenceLine
          y={goalKcal}
          stroke="#F97316"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: 'objetivo', position: 'insideTopRight', fontSize: 9, fill: '#F97316', dy: -4 }}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as unknown as Array<{ value: number }>}
              label={String(props.label ?? '')}
              goalKcal={goalKcal}
            />
          )}
          cursor={{ fill: 'rgba(249,115,22,0.06)', radius: 6 }}
        />
        <Bar dataKey="avg_calories_day" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.avg_calories_day <= goalKcal ? 'url(#barUnder)' : 'url(#barOver)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
