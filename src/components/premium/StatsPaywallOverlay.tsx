'use client'

// Overlay sobre los gráficos de estadísticas para usuarios del plan gratuito
import { useState } from 'react'
import { LockKeyhole, TrendingUp } from 'lucide-react'
import { PaywallModal } from './PaywallModal'

export function StatsPaywallOverlay() {
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      {/* Overlay con blur sobre el contenido bloqueado */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        background: 'rgba(250,250,249,0.85)',
        backdropFilter: 'blur(8px)',
        padding: '24px 20px',
      }}>
        {/* Icono de candado */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          marginBottom: 14,
        }}>
          <LockKeyhole style={{ width: 24, height: 24, color: '#F97316' }} />
        </div>

        <p style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#1C1917',
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: '-0.3px',
        }}>
          Desbloquea tus estadísticas
        </p>

        {/* Mini feature hints */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
        }}>
          {['Gráficos', 'Tendencias', 'Análisis'].map((label) => (
            <span key={label} style={{
              padding: '4px 10px',
              borderRadius: 99,
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              fontSize: 11,
              fontWeight: 600,
              color: '#F97316',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <TrendingUp style={{ width: 10, height: 10 }} />
              {label}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowPaywall(true)}
          style={{
            padding: '12px 28px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          ✨ Ver planes Premium
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
