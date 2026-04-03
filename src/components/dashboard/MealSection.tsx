'use client'

// Sección de comidas con emojis y cards individuales (estilo Yazio)
import { Plus } from 'lucide-react'
import type { FoodLogEntry, MealType } from '@/types/database'

interface MealSectionProps {
  mealType: MealType
  entries: FoodLogEntry[]
  onAddEntry: (mealType: MealType) => void
}

const mealConfig: Record<
  MealType,
  {
    label: string
    emoji: string
    bgColor: string
    iconBg: string
    plusColor: string
  }
> = {
  breakfast: {
    label: 'Desayuno',
    emoji: '☕',
    bgColor: 'bg-white',
    iconBg: 'bg-orange-50',
    plusColor: 'stroke-orange-500',
  },
  lunch: {
    label: 'Almuerzo',
    emoji: '🍽',
    bgColor: 'bg-white',
    iconBg: 'bg-orange-50',
    plusColor: 'stroke-orange-500',
  },
  dinner: {
    label: 'Cena',
    emoji: '🌙',
    bgColor: 'bg-white',
    iconBg: 'bg-blue-50',
    plusColor: 'stroke-blue-400',
  },
  snack: {
    label: 'Snack',
    emoji: '🍎',
    bgColor: 'bg-white',
    iconBg: 'bg-emerald-50',
    plusColor: 'stroke-emerald-500',
  },
}

export function MealSection({ mealType, entries, onAddEntry }: MealSectionProps) {
  const config = mealConfig[mealType]
  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories_kcal || 0), 0)

  return (
    <div className={`${config.bgColor} rounded-2xl border border-stone-100 overflow-hidden`}>
      {/* Header de la comida */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-[38px] h-[38px] rounded-xl ${config.iconBg} flex items-center justify-center text-[17px]`}>
            {config.emoji}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-stone-800">{config.label}</p>
            {entries.length > 0 ? (
              <p className="text-[11px] text-stone-400 mt-0.5">
                {Math.round(totalCalories)} kcal · {entries.length}{' '}
                {entries.length === 1 ? 'alimento' : 'alimentos'}
              </p>
            ) : (
              <p className="text-[11px] text-stone-300 mt-0.5">Toca + para registrar</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddEntry(mealType)}
          className={`w-[30px] h-[30px] rounded-[10px] ${config.iconBg} flex items-center justify-center hover:opacity-80 active:scale-95 transition-all`}
          aria-label={`Agregar alimento a ${config.label}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1="2" x2="6" y2="10" className={config.plusColor} strokeWidth={2} strokeLinecap="round" />
            <line x1="2" y1="6" x2="10" y2="6" className={config.plusColor} strokeWidth={2} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Lista de alimentos (si hay) */}
      {entries.length > 0 && (
        <div className="border-t border-stone-50 px-3.5">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between py-2 ${
                i < entries.length - 1 ? 'border-b border-stone-50' : ''
              }`}
            >
              <span className="text-xs text-stone-600 truncate max-w-[200px]">
                {entry.custom_description || entry.food_id || 'Alimento'}
              </span>
              <span className="text-xs text-stone-400 ml-2 flex-shrink-0">
                {Math.round(entry.calories_kcal || 0)} kcal
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
