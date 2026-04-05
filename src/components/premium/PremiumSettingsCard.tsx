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
      {isPremium ? (
        // ── Estado Premium activo ──────────────────────────────────────────
        <div style={{
          background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
          borderRadius: 20,
          padding: '18px 18px',
          border: '1px solid rgba(249,115,22,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow decorativo */}
          <div style={{
            position: 'absolute',
            top: -40,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 22 }}>✨</span>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>Plan Premium activo</p>
              </div>
              <PremiumBadge size="sm" />
            </div>

            {/* Período de prueba */}
            {subscriptionStatus === 'trialing' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 99,
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B' }}>
                  Período de prueba activo
                </span>
              </div>
            )}

            {/* Fecha de renovación */}
            {premiumExpiresAt && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
                Renueva el {formatDate(premiumExpiresAt)}
              </p>
            )}

            {/* Botón de gestión */}
            <button
              type="button"
              onClick={() => manageSubscription()}
              disabled={isPending}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Abriendo portal…' : 'Gestionar suscripción'}
            </button>
          </div>
        </div>
      ) : (
        // ── Plan gratuito ──────────────────────────────────────────────────
        <div style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid #E7E5E4',
          padding: '18px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', marginBottom: 4 }}>
                Plan Gratuito
              </p>
              <p style={{ fontSize: 13, color: '#78716C', lineHeight: 1.4 }}>
                Desbloquea funciones avanzadas con Premium
              </p>
            </div>
            <span style={{
              padding: '4px 10px',
              borderRadius: 99,
              background: '#F5F4F3',
              color: '#78716C',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
              marginLeft: 12,
            }}>
              Gratis
            </span>
          </div>

          {/* Mini lista de lo que se desbloquea */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginBottom: 14,
            padding: '12px 14px',
            background: '#FFF7ED',
            borderRadius: 12,
            border: '1px solid #FED7AA',
          }}>
            {['Fotos ilimitadas', 'Gráficos de progreso', 'Historial completo'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'rgba(249,115,22,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                    <path d="M1 3.5l2 2 4-4" stroke="#F97316" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 12, color: '#C2410C', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Botón para actualizar a Premium */}
          <button
            type="button"
            onClick={() => setShowPaywall(true)}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            ✨ Hazte Premium
          </button>
        </div>
      )}

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
