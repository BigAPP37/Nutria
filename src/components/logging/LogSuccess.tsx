'use client'

// Pantalla de éxito tras registrar una comida
// Muestra animación de check y redirige al dashboard tras 2.5 segundos

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { MealType } from '@/types/database'

interface LogSuccessProps {
  kcal: number
  mealType: MealType
  onLogAnother: () => void
}

// Etiquetas en español para cada tipo de comida
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'el desayuno',
  lunch: 'el almuerzo',
  dinner: 'la cena',
  snack: 'el snack',
}

export function LogSuccess({ kcal, mealType, onLogAnother }: LogSuccessProps) {
  const router = useRouter()

  // Redirige automáticamente al dashboard tras 2.5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-8">
      {/* Animación de checkmark en círculo verde esmeralda */}
      <div
        className="
          w-24 h-24 rounded-full bg-emerald-500
          flex items-center justify-center
          animate-[scale-in_0.4s_ease-out]
        "
        style={{
          animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Texto principal */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">¡Registrado!</h1>
        <p className="text-stone-500 text-base">
          <strong className="text-stone-700">{kcal} kcal</strong> añadidas a{' '}
          {MEAL_LABELS[mealType]}
        </p>
        <p className="text-xs text-stone-400 mt-3">
          Redirigiendo al dashboard...
        </p>
      </div>

      {/* Botón para registrar otra comida */}
      <button
        onClick={onLogAnother}
        className="
          px-8 py-3.5 rounded-2xl border-2 border-stone-300
          text-stone-600 text-sm font-semibold
          hover:bg-stone-50 transition-colors
          min-h-[44px]
        "
      >
        Registrar otra comida
      </button>

    </div>
  )
}
