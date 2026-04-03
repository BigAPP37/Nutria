'use client'

// Overlay sobre los gráficos de estadísticas para usuarios del plan gratuito
import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { PaywallModal } from './PaywallModal'

export function StatsPaywallOverlay() {
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      {/* Overlay con blur sobre el contenido bloqueado */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
        <LockKeyhole className="w-10 h-10 text-stone-400" />

        <p className="text-base font-semibold text-stone-800 mt-3 text-center px-4">
          Desbloquea tus gráficos de progreso
        </p>

        <button
          type="button"
          onClick={() => setShowPaywall(true)}
          className="mt-4 px-6 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Ver planes
        </button>
      </div>

      {/* Modal de paywall */}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          trigger="stats"
        />
      )}
    </>
  )
}
