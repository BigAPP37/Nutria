'use client'

// Modal de paywall — se muestra contextualmente cuando el usuario intenta usar una función Premium
// Nunca se muestra en onboarding ni al abrir la app
import { useState } from 'react'
import { useCheckout } from '@/hooks/useCheckout'
import type { PricePlan } from '@/types/premium'

// Mensajes contextuales según el punto de la app donde se muestra el paywall
const TRIGGER_MESSAGES: Record<PaywallModalProps['trigger'], string> = {
  photo_limit:
    'Has usado tus 3 fotos de hoy. Con Premium, fotos ilimitadas cada día.',
  history:
    'Tu historial gratuito incluye los últimos 7 días. Con Premium, accede a todo tu historial.',
  stats:
    'Los gráficos de progreso son una función Premium. Descubre cómo evoluciona tu plan.',
  export: 'Exportar tus datos es una función Premium.',
}

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  trigger: 'photo_limit' | 'history' | 'stats' | 'export'
}

// Beneficios del plan Premium
const BENEFITS = [
  'Fotos ilimitadas cada día',
  'Algoritmo que se adapta a ti semana a semana',
  'Historial completo (90+ días)',
  'Gráficos de progreso detallados',
  'Análisis de macros semanal',
  'Exportar tus datos en CSV',
]

export function PaywallModal({ isOpen, onClose, trigger }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricePlan>('annual')
  const { mutate: startCheckout, isPending } = useCheckout()

  if (!isOpen) return null

  function handleCheckout() {
    startCheckout({ plan: selectedPlan })
  }

  return (
    // Fondo oscuro — clic fuera cierra el modal
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Tarjeta del modal */}
      <div
        className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <h2 className="text-lg font-bold text-stone-900">
          ✨ Desbloquea Nutria Premium
        </h2>
        <p className="text-sm text-stone-600 mt-2">
          {TRIGGER_MESSAGES[trigger]}
        </p>

        {/* Lista de beneficios */}
        <ul className="mt-4 space-y-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* Selector de plan */}
        <div className="mt-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                selectedPlan === 'monthly'
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan('annual')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                selectedPlan === 'annual'
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              Anual
            </button>
          </div>

          {/* Precio según plan seleccionado */}
          <p className="text-center mt-2.5 text-sm font-semibold text-stone-800">
            {selectedPlan === 'monthly' ? (
              '4,99€/mes'
            ) : (
              <>
                39,99€/año{' '}
                <span className="text-emerald-500 font-medium">· ahorra un 33%</span>
              </>
            )}
          </p>
        </div>

        {/* Botón principal de CTA */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isPending}
          className="mt-5 w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-base disabled:opacity-70 transition-colors hover:bg-orange-600 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              {/* Spinner de carga */}
              <svg
                className="animate-spin w-4 h-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Cargando…
            </>
          ) : (
            'Probar 7 días gratis'
          )}
        </button>

        {/* Texto informativo bajo el CTA */}
        <p className="text-xs text-stone-400 text-center mt-2">
          {selectedPlan === 'monthly'
            ? 'Después 4,99€/mes. Cancela cuando quieras.'
            : 'Después 39,99€/año. Cancela cuando quieras.'}
        </p>

        {/* Botón secundario de descarte */}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-sm text-stone-400 py-2"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
