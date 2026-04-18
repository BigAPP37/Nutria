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
  onAdded: (kcal: number) => void
}

export function ManualSearch({
  mealType,
  logDate,
  userId,
  onAdded,
}: ManualSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)

  const { results, isLoading, error, refetch } = useFoodSearch(query)

  // Si hay un alimento seleccionado, muestra el selector de porción
  if (selectedFood) {
    return (
      <PortionSelector
        food={selectedFood}
        mealType={mealType}
        logDate={logDate}
        userId={userId}
        onAdded={(kcal) => {
          setSelectedFood(null)
          setQuery('')
          onAdded(kcal)
        }}
        onBack={() => setSelectedFood(null)}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Campo de búsqueda */}
      <div style={{ position: 'relative' }}>
        <Search
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            color: '#A8A29E',
            pointerEvents: 'none',
          }}
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar alimento... (ej: manzana, pollo)"
          autoComplete="off"
          style={{
            width: '100%',
            paddingLeft: 44,
            paddingRight: 16,
            paddingTop: 13,
            paddingBottom: 13,
            borderRadius: 16,
            border: '1.5px solid #E7E5E4',
            background: 'white',
            color: '#1C1917',
            fontSize: 14,
            outline: 'none',
            minHeight: 50,
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
        />
      </div>

      {/* Estado de carga */}
      {isLoading && query.length >= 2 && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '3px solid #FED7AA',
            borderTopColor: '#F97316',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 10px',
          }} />
          <p style={{ fontSize: 12, color: '#A8A29E' }}>Buscando...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error de búsqueda */}
      {!isLoading && query.length >= 2 && error && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: '#FFFBEB',
            border: '1px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Search style={{ width: 22, height: 22, color: '#F59E0B' }} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#B45309', marginBottom: 4 }}>
            No pudimos buscar ahora mismo
          </p>
          <p style={{ fontSize: 12, color: '#A8A29E', marginBottom: 12 }}>
            Revisa la conexión o inténtalo otra vez
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: 'white',
              color: '#B45309',
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid #F59E0B',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Sin resultados */}
      {!isLoading && query.length >= 2 && !error && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: '#F5F4F3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Search style={{ width: 22, height: 22, color: '#C4B9B3' }} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#78716C', marginBottom: 4 }}>
            No encontramos ese alimento
          </p>
          <p style={{ fontSize: 12, color: '#A8A29E' }}>
            Prueba con otro término o usa el método de texto
          </p>
        </div>
      )}

      {/* Mensaje de inicio */}
      {query.length < 2 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 6px 20px rgba(249,115,22,0.3)',
          }}>
            <Search style={{ width: 26, height: 26, color: 'white' }} strokeWidth={2} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#78716C', marginBottom: 4 }}>
            Busca tu alimento
          </p>
          <p style={{ fontSize: 12, color: '#A8A29E' }}>
            Escribe al menos 2 caracteres
          </p>
        </div>
      )}

      {/* Lista de resultados */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map((food) => (
            <button
              key={food.food_id}
              onClick={() => setSelectedFood(food)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 16,
                background: 'white',
                border: '1.5px solid #E7E5E4',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FDBA74'
                e.currentTarget.style.background = '#FFF7ED'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E7E5E4'
                e.currentTarget.style.background = 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Nombre del alimento */}
                  <p style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1C1917',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}>
                    {food.food_name}
                  </p>
                  {/* Marca si existe */}
                  {food.brand && (
                    <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>{food.brand}</p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {/* Calorías */}
                  <div className="flex items-baseline gap-1">
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#F97316' }}>
                      {Math.round(food.calories_kcal)}
                    </span>
                    <span style={{ fontSize: 11, color: '#A8A29E' }}>kcal/100g</span>
                  </div>

                  {/* Badge de verificado */}
                  {food.is_verified && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#059669',
                      background: '#D1FAE5',
                      padding: '2px 7px',
                      borderRadius: 99,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}>
                      ✓ Verificado
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
