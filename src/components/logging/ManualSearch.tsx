'use client'

// Búsqueda manual de alimentos en la base de datos
// Con debounce integrado vía useFoodSearch, y abre PortionSelector al seleccionar

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useFoodSearch } from '@/hooks/useFoodSearch'
import { PortionSelector } from '@/components/logging/PortionSelector'
import type { FoodSearchResult } from '@/types/logging'
import type { MealType } from '@/types/database'

interface ManualSearchProps {
  mealType: MealType
  logDate: string
  userId: string
  onAdded: () => void
}

export function ManualSearch({
  mealType,
  logDate,
  userId,
  onAdded,
}: ManualSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)

  const { results, isLoading } = useFoodSearch(query)

  // Si hay un alimento seleccionado, muestra el selector de porción
  if (selectedFood) {
    return (
      <PortionSelector
        food={selectedFood}
        mealType={mealType}
        logDate={logDate}
        userId={userId}
        onAdded={() => {
          setSelectedFood(null)
          setQuery('')
          onAdded()
        }}
        onBack={() => setSelectedFood(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Campo de búsqueda */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar alimento... (ej: manzana, pollo)"
          className="
            w-full pl-10 pr-4 py-3 rounded-2xl
            border-2 border-stone-200 bg-white
            text-stone-800 text-sm placeholder:text-stone-400
            focus:outline-none focus:border-orange-400
            min-h-[44px] transition-colors
          "
          autoComplete="off"
        />
      </div>

      {/* Estado de carga */}
      {isLoading && query.length >= 2 && (
        <div className="text-center py-6">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400 mt-2">Buscando...</p>
        </div>
      )}

      {/* Mensaje si no hay resultados */}
      {!isLoading && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-stone-500">No se encontraron resultados</p>
          <p className="text-xs text-stone-400 mt-1">
            Prueba con otro término o usa el método de texto
          </p>
        </div>
      )}

      {/* Mensaje de inicio */}
      {query.length < 2 && (
        <div className="text-center py-8">
          <Search className="w-10 h-10 text-stone-200 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-stone-400">
            Escribe al menos 2 caracteres para buscar
          </p>
        </div>
      )}

      {/* Lista de resultados */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {results.map((food) => (
            <li key={food.food_id}>
              <button
                onClick={() => setSelectedFood(food)}
                className="
                  w-full text-left px-4 py-3 rounded-2xl
                  bg-white border border-stone-200
                  hover:border-orange-300 hover:bg-orange-50
                  transition-colors
                "
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Nombre del alimento */}
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {food.food_name}
                    </p>
                    {/* Marca si existe */}
                    {food.brand && (
                      <p className="text-xs text-stone-400 truncate">{food.brand}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Calorías por 100g */}
                    <span className="text-sm font-semibold text-stone-700">
                      {Math.round(food.calories_kcal)}{' '}
                      <span className="text-xs font-normal text-stone-400">kcal/100g</span>
                    </span>

                    {/* Badge de verificado */}
                    {food.is_verified && (
                      <span className="text-xs text-stone-400 flex items-center gap-0.5">
                        <span>✓</span>
                        <span>Verificado</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
