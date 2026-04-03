'use client'

// Hoja de confirmación del resultado de la IA
// Muestra los alimentos detectados, macros y botones de confirmar/descartar

import { AlertTriangle, Loader2 } from 'lucide-react'
import type { AiLogResponse } from '@/types/logging'

interface AiConfirmSheetProps {
  result: AiLogResponse
  onConfirm: () => void
  onDiscard: () => void
  isDiscarding: boolean
}

// Determina el color del badge de confianza según el nivel
function confidenceBadge(confianza: number) {
  if (confianza >= 0.8) {
    return {
      className: 'bg-emerald-100 text-emerald-700',
      label: `${Math.round(confianza * 100)}%`,
    }
  }
  if (confianza >= 0.5) {
    return {
      className: 'bg-amber-100 text-amber-700',
      label: `${Math.round(confianza * 100)}%`,
    }
  }
  return {
    className: 'bg-stone-100 text-stone-500',
    label: `${Math.round(confianza * 100)}%`,
  }
}

export function AiConfirmSheet({
  result,
  onConfirm,
  onDiscard,
  isDiscarding,
}: AiConfirmSheetProps) {
  const { plato_descripcion, origen_cultural, totales, alimentos, ambiguedades } = result

  return (
    <div className="flex flex-col gap-4">
      {/* Tarjeta de cabecera con gradiente naranja */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white">
        <h2 className="text-lg font-bold leading-snug mb-1">{plato_descripcion}</h2>
        {origen_cultural && (
          <p className="text-sm opacity-80 mb-3">{origen_cultural}</p>
        )}
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {Math.round(totales.calorias)}
          </span>
          <span className="text-sm opacity-80 mb-0.5">kcal totales</span>
        </div>
      </div>

      {/* Banner de ambigüedades si las hay */}
      {ambiguedades && ambiguedades.length > 0 && (
        <div className="flex gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle
            className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
            strokeWidth={2}
          />
          <p className="text-sm text-amber-700 leading-snug">
            {ambiguedades.join(' · ')}
          </p>
        </div>
      )}

      {/* Lista de alimentos detectados */}
      <div className="flex flex-col gap-2">
        {alimentos.map((alimento, idx) => {
          const badge = confidenceBadge(alimento.confianza)
          return (
            <div
              key={idx}
              className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-2"
            >
              {/* Nombre, cantidad y badge de confianza */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 leading-snug">
                    {alimento.nombre}
                  </p>
                  <p className="text-xs text-stone-400">
                    {alimento.cantidad_gramos}g
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold text-stone-800">
                    {Math.round(alimento.calorias_estimadas)} kcal
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Macros del alimento en una fila */}
              <div className="flex gap-3 pt-1 border-t border-stone-100">
                <span className="text-xs text-stone-500">
                  P: <strong>{alimento.proteina_g.toFixed(1)}g</strong>
                </span>
                <span className="text-xs text-stone-500">
                  C: <strong>{alimento.carbohidratos_g.toFixed(1)}g</strong>
                </span>
                <span className="text-xs text-stone-500">
                  G: <strong>{alimento.grasa_g.toFixed(1)}g</strong>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fila de totales */}
      <div className="bg-stone-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          Totales
        </p>
        <div className="flex justify-between">
          <div className="text-center">
            <p className="text-base font-bold text-stone-800">
              {Math.round(totales.calorias)}
            </p>
            <p className="text-xs text-stone-400">kcal</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-stone-800">
              {totales.proteina_g.toFixed(1)}g
            </p>
            <p className="text-xs text-stone-400">Prot.</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-stone-800">
              {totales.carbohidratos_g.toFixed(1)}g
            </p>
            <p className="text-xs text-stone-400">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-stone-800">
              {totales.grasa_g.toFixed(1)}g
            </p>
            <p className="text-xs text-stone-400">Grasa</p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 pb-2">
        {/* Botón de descartar */}
        <button
          onClick={onDiscard}
          disabled={isDiscarding}
          className="
            flex-1 py-3.5 rounded-2xl border-2 border-stone-300
            text-stone-600 text-sm font-semibold
            hover:bg-stone-50 transition-colors
            min-h-[44px] disabled:opacity-60
            flex items-center justify-center gap-2
          "
        >
          {isDiscarding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Descartando...
            </>
          ) : (
            'Descartar'
          )}
        </button>

        {/* Botón de confirmar */}
        <button
          onClick={onConfirm}
          disabled={isDiscarding}
          className="
            flex-[2] py-3.5 rounded-2xl bg-orange-500 text-white
            text-sm font-semibold
            hover:bg-orange-600 transition-colors
            min-h-[44px] disabled:opacity-70
          "
        >
          Confirmar y guardar
        </button>
      </div>
    </div>
  )
}
