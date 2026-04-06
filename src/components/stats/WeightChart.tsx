'use client'

import { useMemo } from 'react'
import { Scale, Plus } from 'lucide-react'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
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
  // Must be declared before any early returns to satisfy rules-of-hooks
  const chartData = useMemo(() => data.map((point) => ({
    date: formatShortDate(point.recorded_at),
    weight_kg: point.weight_kg,
  })), [data])

  if (isLoading) {
    return (
      <div className="animate-pulse" style={{
        background: '#F5F4F3',
        borderRadius: 16,
        height: 240,
        width: '100%',
      }} />
    )
  }

  const header = (
    <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>
          Evolución del peso
        </p>
        {data.length >= 3 && (
          <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>
            Últimos {data.length} registros
          </p>
        )}
      </div>
      <button
        onClick={onAddWeight}
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)',
          border: 'none',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
          transition: 'all 0.15s ease',
        }}
        aria-label="Registrar peso"
      >
        <Plus style={{ width: 16, height: 16 }} />
      </button>
    </div>
  )

  if (data.length < 3) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<Scale style={{ width: 40, height: 40, color: '#D6D3D1' }} />}
          message="Registra tu peso regularmente para ver tu tendencia"
          actionLabel="Registrar peso"
          onAction={onAddWeight}
        />
      </div>
    )
  }

  return (
    <div>
      {header}

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F5F4F3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#A8A29E' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 10, fill: '#A8A29E' }}
            width={34}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={(props) => <CustomTooltip active={props.active} payload={props.payload as unknown as Array<{value: number}>} label={String(props.label ?? '')} unit={unit} />} />
          <Area
            type="monotone"
            dataKey="weight_kg"
            stroke="#F97316"
            strokeWidth={2.5}
            fill="url(#weightGrad)"
            dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: 'white' }}
            activeDot={{ r: 6, fill: '#F97316', strokeWidth: 2, stroke: 'white' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
