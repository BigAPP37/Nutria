'use client'

// Selector de porción para registro manual de alimentos
// Permite ingresar gramos, usar presets o seleccionar porciones predefinidas

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, Loader2, Plus, Minus } from 'lucide-react'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cabecera con botón de volver */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1.5px solid #E7E5E4',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#78716C',
            flexShrink: 0,
          }}
          aria-label="Volver a la búsqueda"
        >
          <ChevronLeft style={{ width: 18, height: 18 }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontWeight: 700,
            color: '#1C1917',
            fontSize: 15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {food.food_name}
          </h3>
          {food.brand && (
            <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>{food.brand}</p>
          )}
        </div>
      </div>

      {/* Selector de cantidad en gramos */}
      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: '18px 16px',
        border: '1px solid #E7E5E4',
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#A8A29E',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 14,
          textAlign: 'center',
        }}>
          Cantidad
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleDecrement}
            disabled={grams <= 5}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              border: '1.5px solid #E7E5E4',
              background: 'white',
              color: '#44403C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: grams <= 5 ? 'not-allowed' : 'pointer',
              opacity: grams <= 5 ? 0.4 : 1,
              transition: 'all 0.15s ease',
            }}
            aria-label="Disminuir cantidad"
          >
            <Minus style={{ width: 18, height: 18 }} />
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              value={grams}
              onChange={handleGramsInput}
              min={5}
              style={{
                width: 90,
                textAlign: 'center',
                fontSize: 32,
                fontWeight: 900,
                color: '#F97316',
                border: 'none',
                borderBottom: '2px solid #FDBA74',
                background: 'transparent',
                outline: 'none',
                letterSpacing: '-1px',
                fontFamily: 'inherit',
              }}
              aria-label="Cantidad en gramos"
            />
            <span style={{ fontSize: 12, color: '#A8A29E', fontWeight: 500 }}>gramos</span>
          </div>

          <button
            onClick={handleIncrement}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              border: '1.5px solid #E7E5E4',
              background: 'white',
              color: '#44403C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            aria-label="Aumentar cantidad"
          >
            <Plus style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* Presets de gramos rápidos */}
      <div style={{ display: 'flex', gap: 8 }}>
        {GRAM_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setGrams(preset)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 12,
              border: grams === preset ? '1.5px solid #F97316' : '1.5px solid #E7E5E4',
              background: grams === preset ? '#FFF7ED' : 'white',
              color: grams === preset ? '#F97316' : '#78716C',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 36,
              transition: 'all 0.15s ease',
            }}
          >
            {preset}g
          </button>
        ))}
      </div>

      {/* Porciones predefinidas del alimento si existen */}
      {servings.length > 0 && (
        <div>
          <p style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#A8A29E',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 10,
          }}>
            Porciones habituales
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {servings.map((serving) => (
              <button
                key={serving.id}
                onClick={() => setGrams(Math.round(serving.grams))}
                style={{
                  padding: '7px 14px',
                  borderRadius: 99,
                  border: grams === Math.round(serving.grams)
                    ? '1px solid #F97316'
                    : '1px solid #FED7AA',
                  background: grams === Math.round(serving.grams) ? '#F97316' : '#FFF7ED',
                  color: grams === Math.round(serving.grams) ? 'white' : '#F97316',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 32,
                  transition: 'all 0.15s ease',
                }}
              >
                {serving.label} · {Math.round(serving.grams)}g
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tarjeta de previsualización de macros */}
      <div style={{
        borderRadius: 20,
        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        padding: '18px 20px',
        color: 'white',
        boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div className="flex items-end justify-center gap-1.5">
            <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}>
              {macros.kcal}
            </span>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>kcal</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            para {grams}g de {food.food_name}
          </p>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.2)',
        }}>
          {[
            { label: 'Proteína', value: macros.protein },
            { label: 'Carbos', value: macros.carbs },
            { label: 'Grasa', value: macros.fat },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{m.value}g</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje de error de la mutación */}
      {mutation.isError && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 12,
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
        }}>
          <p style={{ fontSize: 13, color: '#92400E' }}>
            {mutation.error?.message ?? 'Error al añadir el alimento'}
          </p>
        </div>
      )}

      {/* Botón de añadir */}
      <button
        onClick={handleAdd}
        disabled={mutation.isPending}
        style={{
          width: '100%',
          padding: '15px',
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          color: 'white',
          fontSize: 15,
          fontWeight: 700,
          cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
          opacity: mutation.isPending ? 0.7 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {mutation.isPending ? (
          <>
            <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
            Añadiendo...
          </>
        ) : (
          `Añadir ${macros.kcal} kcal`
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
