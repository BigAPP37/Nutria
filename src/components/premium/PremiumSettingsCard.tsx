'use client'

// Tarjeta de suscripción en la página de ajustes
// Muestra el estado actual del plan y acciones de gestión
import { useState } from 'react'
import { useManageSubscription } from '@/hooks/useManageSubscription'
import { PaywallModal } from './PaywallModal'
import { PremiumBadge } from './PremiumBadge'

interface PremiumSettingsCardProps {
  isPremium: boolean
  premiumExpiresAt: string | null
  subscriptionStatus: string
}

// Formatea una fecha ISO a formato legible en español
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function PremiumSettingsCard({
  isPremium,
  premiumExpiresAt,
  subscriptionStatus,
}: PremiumSettingsCardProps) {
  const [showPaywall, setShowPaywall] = useState(false)
  const { mutate: manageSubscription, isPending } = useManageSubscription()

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-100 p-4">
        {isPremium ? (
          // ── Estado Premium activo ──────────────────────────────────────────
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-stone-900">✨ Plan Premium activo</p>
              <PremiumBadge size="sm" />
            </div>

            {/* Período de prueba */}
            {subscriptionStatus === 'trialing' && (
              <span className="inline-block mt-1.5 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-medium">
                Período de prueba
              </span>
            )}

            {/* Fecha de renovación */}
            {premiumExpiresAt && (
              <p className="text-xs text-stone-400 mt-1.5">
                Renueva el {formatDate(premiumExpiresAt)}
              </p>
            )}

            {/* Botón de gestión de suscripción */}
            <button
              type="button"
              onClick={() => manageSubscription()}
              disabled={isPending}
              className="mt-3 w-full py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm disabled:opacity-60 hover:bg-stone-50 transition-colors"
            >
              {isPending ? 'Abriendo portal…' : 'Gestionar suscripción'}
            </button>
          </>
        ) : (
          // ── Plan gratuito ──────────────────────────────────────────────────
          <>
            <p className="font-semibold text-stone-700">Plan Gratuito</p>
            <p className="text-xs text-stone-400 mt-1">
              Desbloquea funciones avanzadas con Premium
            </p>

            {/* Botón para actualizar a Premium */}
            <button
              type="button"
              onClick={() => setShowPaywall(true)}
              className="mt-3 w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Hazte Premium
            </button>
          </>
        )}
      </div>

      {/* Modal de paywall — solo para usuarios gratuitos */}
      {showPaywall && !isPremium && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          trigger="stats"
        />
      )}
    </>
  )
}
