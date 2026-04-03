'use client'

// Selector de porción para registro manual de alimentos
// Permite ingresar gramos, usar presets o seleccionar porciones predefinidas

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useManualLog } from '@/hooks/useManualLog'
import type { FoodSearchResult } from '@/types/logging'
import type { MealType, FoodServing } from '@/types/database'

interface PortionSelectorProps {
  food: FoodSearchResult
  mealType: MealType
  logDate: string
  userId: string
  onAdded: () => void
  onBack: () => void
}

// Presets rápidos de gramos
const GRAM_PRESETS = [50, 100, 150, 200]

// Calcula los macros para una cantidad dada en gramos (base 100g)
function calcMacros(
  food: FoodSearchResult,
  grams: number
): {
  kcal: number
  protein: number
  carbs: number
  fat: number
} {
  const factor = grams / 100
  return {
    kcal: Math.round(food.calories_kcal * factor),
    protein: parseFloat((food.protein_g * factor).toFixed(1)),
    carbs: parseFloat((food.carbs_g * factor).toFixed(1)),
    fat: parseFloat((food.fat_g * factor).toFixed(1)),
  }
}

export function PortionSelector({
  food,
  mealType,
  logDate,
  userId,
  onAdded,
  onBack,
}: PortionSelectorProps) {
  const [grams, setGrams] = useState(100)
  const [servings, setServings] = useState<FoodServing[]>([])

  const mutation = useManualLog()
  const macros = useMemo(() => calcMacros(food, grams), [food, grams])

  // Carga las porciones predefinidas del alimento desde Supabase
  useEffect(() => {
    async function loadServings() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('food_servings')
        .select('id, label, grams, food_id')
        .eq('food_id', food.food_id)

      if (!error && data) {
        setServings(data as FoodServing[])
      }
    }

    loadServings()
  }, [food.food_id])

  // Decrementa los gramos con mínimo de 5
  const handleDecrement = useCallback(() => {
    setGrams((prev) => Math.max(5, prev - 10))
  }, [])

  // Incrementa los gramos
  const handleIncrement = useCallback(() => {
    setGrams((prev) => prev + 10)
  }, [])

  // Maneja el input directo de gramos
  const handleGramsInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 5) {
      setGrams(val)
    } else if (e.target.value === '') {
      setGrams(5)
    }
  }, [])

  // Añade el alimento al registro del día
  const handleAdd = useCallback(async () => {
    try {
      await mutation.mutateAsync({
        userId,
        foodId: food.food_id,
        quantityGrams: grams,
        mealType,
        logDate,
        caloriesKcal: macros.kcal,
        proteinG: macros.protein,
        carbsG: macros.carbs,
        fatG: macros.fat,
        fiberG: null,
      })
      onAdded()
    } catch {
      // El error se maneja en el estado de la mutación
    }
  }, [userId, food.food_id, grams, mealType, logDate, macros, mutation, onAdded])

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera con botón de volver */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="
            p-2 rounded-xl text-stone-500
            hover:bg-stone-100 transition-colors
            min-h-[44px] min-w-[44px] flex items-center justify-center
          "
          aria-label="Volver a la búsqueda"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-800 text-sm truncate">
            {food.food_name}
          </h3>
          {food.brand && (
            <p className="text-xs text-stone-400 truncate">{food.brand}</p>
          )}
        </div>
      </div>

      {/* Selector de cantidad en gramos */}
      <div className="flex items-center gap-3 bg-stone-50 rounded-2xl p-4">
        <button
          onClick={handleDecrement}
          disabled={grams <= 5}
          className="
            w-11 h-11 rounded-xl border-2 border-stone-300
            text-stone-600 text-xl font-semibold
            hover:bg-stone-100 transition-colors
            disabled:opacity-40 flex items-center justify-center
          "
          aria-label="Disminuir cantidad"
        >
          −
        </button>

        <div className="flex-1 flex flex-col items-center gap-0.5">
          <input
            type="number"
            value={grams}
            onChange={handleGramsInput}
            min={5}
            className="
              w-24 text-center text-2xl font-bold text-stone-800
              border-b-2 border-orange-400 bg-transparent
              focus:outline-none
            "
            aria-label="Cantidad en gramos"
          />
          <span className="text-xs text-stone-400">gramos</span>
        </div>

        <button
          onClick={handleIncrement}
          className="
            w-11 h-11 rounded-xl border-2 border-stone-300
            text-stone-600 text-xl font-semibold
            hover:bg-stone-100 transition-colors
            flex items-center justify-center
          "
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      {/* Presets de gramos rápidos */}
      <div className="flex gap-2">
        {GRAM_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setGrams(preset)}
            className={`
              flex-1 py-2 rounded-xl text-xs font-medium transition-colors
              min-h-[36px]
              ${
                grams === preset
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }
            `}
          >
            {preset}g
          </button>
        ))}
      </div>

      {/* Porciones predefinidas del alimento si existen */}
      {servings.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone-500 font-medium">Porciones habituales:</p>
          <div className="flex flex-wrap gap-2">
            {servings.map((serving) => (
              <button
                key={serving.id}
                onClick={() => setGrams(Math.round(serving.grams))}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  min-h-[32px]
                  ${
                    grams === Math.round(serving.grams)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                  }
                `}
              >
                {serving.label} ({Math.round(serving.grams)}g)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tarjeta de previsualización de macros con gradiente naranja */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white">
        <div className="text-center mb-3">
          <span className="text-3xl font-bold">{macros.kcal}</span>
          <span className="text-sm opacity-80 ml-1">kcal</span>
        </div>
        <div className="flex justify-around text-center">
          <div>
            <p className="text-base font-semibold">{macros.protein}g</p>
            <p className="text-xs opacity-70">Proteína</p>
          </div>
          <div>
            <p className="text-base font-semibold">{macros.carbs}g</p>
            <p className="text-xs opacity-70">Carbos</p>
          </div>
          <div>
            <p className="text-base font-semibold">{macros.fat}g</p>
            <p className="text-xs opacity-70">Grasa</p>
          </div>
        </div>
      </div>

      {/* Mensaje de error de la mutación */}
      {mutation.isError && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700">
            {mutation.error?.message ?? 'Error al añadir el alimento'}
          </p>
        </div>
      )}

      {/* Botón de añadir */}
      <button
        onClick={handleAdd}
        disabled={mutation.isPending}
        className="
          w-full py-3.5 rounded-2xl bg-orange-500 text-white
          text-sm font-semibold
          hover:bg-orange-600 transition-colors
          min-h-[44px] disabled:opacity-70
          flex items-center justify-center gap-2
        "
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Añadiendo...
          </>
        ) : (
          'Añadir'
        )}
      </button>
    </div>
  )
}
