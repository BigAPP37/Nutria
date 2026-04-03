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
    <div className="bg-white rounded-2xl p-3 border border-stone-100">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-stone-100 rounded w-4/5" />
        <div className="h-7 bg-stone-100 rounded w-2/3" />
        <div className="h-3 bg-stone-100 rounded w-3/4" />
      </div>
    </div>
  )
}

export function QuickStats({ daysLogged, currentWeight, streak, weightUnit, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Días logueados */}
      <div className="bg-white rounded-2xl p-3 border border-stone-100">
        <div className="w-7 h-7 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <p className="text-2xl font-bold text-stone-900 leading-none">{daysLogged}</p>
        <p className="text-xs text-stone-400 mt-1 leading-tight">días logueados</p>
      </div>

      {/* Peso actual */}
      <div className="bg-white rounded-2xl p-3 border border-stone-100">
        <div className="w-7 h-7 bg-stone-100 rounded-xl flex items-center justify-center mb-2">
          <Scale className="w-4 h-4 text-stone-500" />
        </div>
        <p className="text-2xl font-bold text-stone-900 leading-none">
          {currentWeight != null ? currentWeight : '—'}
        </p>
        <p className="text-xs text-stone-400 mt-1 leading-tight">peso ({weightUnit})</p>
      </div>

      {/* Racha */}
      <div className="bg-white rounded-2xl p-3 border border-stone-100">
        <div className="w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center mb-2">
          <Flame className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-2xl font-bold text-stone-900 leading-none">{streak}</p>
        <p className="text-xs text-stone-400 mt-1 leading-tight">racha 🔥</p>
      </div>
    </div>
  )
}
