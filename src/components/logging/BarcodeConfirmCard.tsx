'use client'

// Tarjeta de confirmación tras detectar un producto por código de barras
// Permite ajustar la cantidad en gramos antes de registrar

import { useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import type { FoodLookupResult } from '@/app/api/food-lookup/route'

interface BarcodeConfirmCardProps {
  product: FoodLookupResult
  onConfirm: (product: FoodLookupResult, quantityGrams: number) => void
  onDiscard: () => void
  isSaving: boolean
}

export function BarcodeConfirmCard({ product, onConfirm, onDiscard, isSaving }: BarcodeConfirmCardProps) {
  const [grams, setGrams] = useState(100)

  const ratio = grams / 100
  const kcal    = Math.round(product.kcal_100g * ratio)
  const protein = Math.round(product.protein_100g * ratio * 10) / 10
  const carbs   = Math.round(product.carbs_100g * ratio * 10) / 10
  const fat     = Math.round(product.fat_100g * ratio * 10) / 10

  function adjust(delta: number) {
    setGrams(prev => Math.max(5, Math.min(2000, prev + delta)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Producto encontrado */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        border: '1px solid #E7E5E4',
        padding: '16px 18px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #FED7AA, #F97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            🏷️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>
              {product.name}
            </p>
            {product.brand && (
              <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>{product.brand}</p>
            )}
          </div>
        </div>

        {/* Macros por cantidad seleccionada */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Kcal', value: String(kcal), color: '#F97316' },
            { label: 'Prot', value: `${protein}g`, color: '#818CF8' },
            { label: 'HC',   value: `${carbs}g`, color: '#34D399' },
            { label: 'Grasa', value: `${fat}g`, color: '#FBBF24' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center',
              background: '#FAFAF9', borderRadius: 10, padding: '8px 4px',
            }}>
              <p style={{ fontSize: 14, fontWeight: 800, color }}>{value}</p>
              <p style={{ fontSize: 10, color: '#A8A29E', marginTop: 1 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Selector de cantidad */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Cantidad
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => adjust(-10)}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E7E5E4', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Minus size={14} color="#78716C" />
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <input
                type="number"
                inputMode="numeric"
                value={grams}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v) && v >= 1) setGrams(Math.min(2000, v))
                }}
                style={{
                  width: 64, textAlign: 'center',
                  padding: '8px 0',
                  borderRadius: 10,
                  border: '1.5px solid #E7E5E4',
                  fontSize: 16, fontWeight: 700, color: '#1C1917',
                  background: '#FAFAF9',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
              />
              <span style={{ fontSize: 13, color: '#78716C', fontWeight: 500 }}>g</span>
            </div>

            <button
              onClick={() => adjust(10)}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E7E5E4', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={14} color="#78716C" />
            </button>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onDiscard}
          disabled={isSaving}
          style={{
            padding: '13px 18px', borderRadius: 14,
            border: '1.5px solid #E7E5E4', background: 'white',
            color: '#78716C', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', opacity: isSaving ? 0.5 : 1,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(product, grams)}
          disabled={isSaving}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px',
            borderRadius: 14, border: 'none',
            background: '#F97316', color: 'white',
            fontSize: 14, fontWeight: 700,
            cursor: 'pointer', opacity: isSaving ? 0.6 : 1,
          }}
        >
          <Check size={16} />
          {isSaving ? 'Guardando...' : `Registrar ${kcal} kcal`}
        </button>
      </div>
    </div>
  )
}
