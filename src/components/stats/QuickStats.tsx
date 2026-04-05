// Tarjetas de resumen rápido en la parte superior de la pantalla de progreso
'use client'

import { CheckCircle2, Scale, Flame } from 'lucide-react'

interface QuickStatsProps {
  daysLogged: number
  currentWeight: number | null
  streak: number
  weightUnit: 'kg' | 'lb'
  isLoading: boolean
}

// Skeleton de una tarjeta individual
function CardSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: 18,
      padding: '14px 12px',
      border: '1px solid #E7E5E4',
    }}>
      <div className="animate-pulse space-y-2">
        <div style={{ height: 28, background: '#F5F4F3', borderRadius: 10, width: 28 }} />
        <div style={{ height: 28, background: '#F5F4F3', borderRadius: 6 }} />
        <div style={{ height: 12, background: '#F5F4F3', borderRadius: 4, width: '75%' }} />
      </div>
    </div>
  )
}

export function QuickStats({ daysLogged, currentWeight, streak, weightUnit, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  const stats = [
    {
      icon: <CheckCircle2 style={{ width: 16, height: 16, color: '#10B981' }} />,
      iconBg: 'rgba(16,185,129,0.12)',
      value: String(daysLogged),
      label: 'días\nlogueados',
      valueColor: '#10B981',
    },
    {
      icon: <Scale style={{ width: 16, height: 16, color: '#F97316' }} />,
      iconBg: 'rgba(249,115,22,0.12)',
      value: currentWeight != null ? String(currentWeight) : '—',
      label: `peso\n(${weightUnit})`,
      valueColor: '#F97316',
    },
    {
      icon: <Flame style={{ width: 16, height: 16, color: '#F59E0B' }} />,
      iconBg: 'rgba(245,158,11,0.12)',
      value: String(streak),
      label: 'racha\nactual 🔥',
      valueColor: '#F59E0B',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: 'white',
            borderRadius: 18,
            padding: '14px 12px',
            border: '1px solid #E7E5E4',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            background: stat.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}>
            {stat.icon}
          </div>
          <p style={{
            fontSize: 26,
            fontWeight: 900,
            color: stat.valueColor,
            lineHeight: 1,
            letterSpacing: '-0.5px',
          }}>
            {stat.value}
          </p>
          <p style={{
            fontSize: 11,
            color: '#A8A29E',
            marginTop: 4,
            lineHeight: 1.3,
            whiteSpace: 'pre-line',
          }}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  )
}
