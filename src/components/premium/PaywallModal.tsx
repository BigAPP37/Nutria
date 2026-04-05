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
  { icon: '📸', text: 'Fotos ilimitadas cada día' },
  { icon: '🧠', text: 'Algoritmo que se adapta a ti semana a semana' },
  { icon: '📅', text: 'Historial completo (90+ días)' },
  { icon: '📊', text: 'Gráficos de progreso detallados' },
  { icon: '💪', text: 'Análisis de macros semanal' },
  { icon: '📤', text: 'Exportar tus datos en CSV' },
]

export function PaywallModal({ isOpen, onClose, trigger }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricePlan>('annual')
  const { mutate: startCheckout, isPending } = useCheckout()

  if (!isOpen) return null

  function handleCheckout() {
    startCheckout({ plan: selectedPlan })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1C1917 0%, #0C0A09 100%)',
          width: '100%',
          maxWidth: 400,
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient blob */}
        <div style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Crown / Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            boxShadow: '0 8px 32px rgba(245,158,11,0.5)',
          }}>
            ✨
          </div>
        </div>

        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: 8, position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.5px',
            marginBottom: 8,
          }}>
            Nutria Premium
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
            {TRIGGER_MESSAGES[trigger]}
          </p>
        </div>

        {/* Lista de beneficios */}
        <div style={{
          marginTop: 20,
          marginBottom: 20,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 18,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
          zIndex: 1,
        }}>
          {BENEFITS.map((benefit) => (
            <div key={benefit.text} className="flex items-center gap-3">
              <span style={{ fontSize: 17, flexShrink: 0 }}>{benefit.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                {benefit.text}
              </span>
              <div style={{
                marginLeft: 'auto',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Selector de plan */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {/* Plan mensual */}
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 14,
                border: selectedPlan === 'monthly'
                  ? '2px solid #F97316'
                  : '2px solid rgba(255,255,255,0.12)',
                background: selectedPlan === 'monthly'
                  ? 'rgba(249,115,22,0.15)'
                  : 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 2 }}>Mensual</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: selectedPlan === 'monthly' ? '#F97316' : 'rgba(255,255,255,0.7)' }}>
                4,99€
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>al mes</p>
            </button>

            {/* Plan anual — recomendado */}
            <button
              type="button"
              onClick={() => setSelectedPlan('annual')}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 14,
                border: selectedPlan === 'annual'
                  ? '2px solid #F97316'
                  : '2px solid rgba(255,255,255,0.12)',
                background: selectedPlan === 'annual'
                  ? 'rgba(249,115,22,0.15)'
                  : 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Badge de ahorro */}
              <div style={{
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 99,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                −33%
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 2 }}>Anual</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: selectedPlan === 'annual' ? '#F97316' : 'rgba(255,255,255,0.7)' }}>
                3,33€
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>al mes</p>
            </button>
          </div>

          {/* Precio total */}
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 16,
          }}>
            {selectedPlan === 'monthly'
              ? 'Facturado mensualmente · 4,99€/mes'
              : 'Facturado como 39,99€/año · ahorra 20€'}
          </p>

          {/* Botón CTA */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isPending}
            style={{
              width: '100%',
              padding: '17px',
              borderRadius: 18,
              border: 'none',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 800,
              cursor: isPending ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 24px rgba(249,115,22,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isPending ? 0.7 : 1,
              transition: 'all 0.2s ease',
              letterSpacing: '-0.2px',
            }}
          >
            {isPending ? (
              <>
                <svg
                  style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Cargando…
              </>
            ) : (
              '✨ Probar 7 días gratis'
            )}
          </button>

          {/* Texto fine print */}
          <p style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 1.4,
          }}>
            {selectedPlan === 'monthly'
              ? 'Después 4,99€/mes. Cancela cuando quieras.'
              : 'Después 39,99€/año. Cancela cuando quieras.'}
          </p>

          {/* Botón secundario */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Ahora no
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
