'use client'

// Selector de tipo de comida con 4 opciones en formato pill
// Desayuno, Almuerzo, Cena, Snack

import type { MealType } from '@/types/database'

interface MealTypeSelectorProps {
  value: MealType
  onChange: (m: MealType) => void
}

// Configuración de cada tipo de comida
const MEAL_OPTIONS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Desayuno', emoji: '☀️' },
  { type: 'lunch', label: 'Almuerzo', emoji: '🍽' },
  { type: 'dinner', label: 'Cena', emoji: '🌙' },
  { type: 'snack', label: 'Snack', emoji: '🍎' },
]

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {MEAL_OPTIONS.map(({ type, label, emoji }) => {
        const isSelected = value === type
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`
              flex-1 rounded-2xl py-2.5 text-sm font-medium transition-colors
              min-h-[44px] flex flex-col items-center gap-0.5
              ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }
            `}
            aria-pressed={isSelected}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span className="text-xs leading-none">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
