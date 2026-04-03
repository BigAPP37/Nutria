'use client'

import { useMemo } from 'react'
import { Scale } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { EmptyState } from './EmptyState'
import type { WeightPoint } from '@/types/logging'

interface WeightChartProps {
  data: WeightPoint[]
  unit: 'kg' | 'lb'
  onAddWeight: () => void
  isLoading: boolean
}

// Tooltip personalizado con fondo oscuro
function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-stone-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
      <p className="text-white/60 mb-0.5">{label}</p>
      <p className="font-medium">
        {payload[0].value} {unit}
      </p>
    </div>
  )
}

// Formatea la fecha ISO a formato corto en español
function formatShortDate(isoDatetime: string): string {
  const d = new Date(isoDatetime)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
}

export function WeightChart({ data, unit, onAddWeight, isLoading }: WeightChartProps) {
  if (isLoading) {
    return <div className="animate-pulse bg-stone-100 rounded-xl h-[220px] w-full" />
  }

  if (data.length < 3) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-stone-800">Evolución del peso</span>
          <button
            onClick={onAddWeight}
            className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-lg font-medium active:bg-orange-100 transition-colors"
            aria-label="Registrar peso"
          >
            +
          </button>
        </div>
        <EmptyState
          icon={<Scale className="w-10 h-10 text-stone-300" />}
          message="Registra tu peso regularmente para ver tu tendencia"
          actionLabel="Registrar peso"
          onAction={onAddWeight}
        />
      </div>
    )
  }

  // Mapear los puntos al formato que espera Recharts
  const chartData = useMemo(() => data.map((point) => ({
    date: formatShortDate(point.recorded_at),
    weight_kg: point.weight_kg,
  })), [data])

  return (
    <div>
      {/* Cabecera con título y botón + */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-stone-800">Evolución del peso</span>
        <button
          onClick={onAddWeight}
          className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-lg font-medium active:bg-orange-100 transition-colors"
          aria-label="Registrar peso"
        >
          +
        </button>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#a8a29e' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 10, fill: '#a8a29e' }}
            width={35}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={(props) => <CustomTooltip active={props.active} payload={props.payload as unknown as Array<{value: number}>} label={String(props.label ?? '')} unit={unit} />} />
          <Line
            type="monotone"
            dataKey="weight_kg"
            stroke="#F97316"
            strokeWidth={2}
            dot={{ r: 3, fill: '#EA580C', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
