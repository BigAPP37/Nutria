'use client'

// Hoja de confirmación del resultado de la IA
// Muestra los alimentos detectados, macros y botones de confirmar/descartar

import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
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
      bg: '#D1FAE5',
      color: '#065F46',
      label: `${Math.round(confianza * 100)}%`,
    }
  }
  if (confianza >= 0.5) {
    return {
      bg: '#FEF3C7',
      color: '#92400E',
      label: `${Math.round(confianza * 100)}%`,
    }
  }
  return {
    bg: '#F5F4F3',
    color: '#78716C',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Tarjeta de cabecera */}
      <div style={{
        borderRadius: 20,
        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        padding: '20px 22px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -10,
          right: 40,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            Plato detectado
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 }}>
            {plato_descripcion}
          </h2>
          {origen_cultural && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
              {origen_cultural}
            </p>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.2)',
          }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Total calorías</p>
              <div className="flex items-end gap-1.5">
                <span style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, letterSpacing: '-1.5px' }}>
                  {Math.round(totales.calorias)}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>kcal</span>
              </div>
            </div>
            {/* Macros en mini-pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: 'P', value: totales.proteina_g },
                { label: 'C', value: totales.carbohidratos_g },
                { label: 'G', value: totales.grasa_g },
              ].map((m) => (
                <div key={m.label} style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  padding: '5px 8px',
                  textAlign: 'center',
                  backdropFilter: 'blur(4px)',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>{m.value.toFixed(0)}g</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Banner de ambigüedades */}
      {ambiguedades && ambiguedades.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 14,
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
        }}>
          <AlertTriangle style={{ width: 16, height: 16, color: '#F59E0B', flexShrink: 0, marginTop: 2 }} strokeWidth={2} />
          <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
            {ambiguedades.join(' · ')}
          </p>
        </div>
      )}

      {/* Lista de alimentos detectados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#A8A29E',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          paddingLeft: 2,
        }}>
          Ingredientes detectados
        </p>
        {alimentos.map((alimento, idx) => {
          const badge = confidenceBadge(alimento.confianza)
          return (
            <div
              key={idx}
              style={{
                background: 'white',
                border: '1px solid #E7E5E4',
                borderRadius: 16,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Nombre, cantidad y badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', lineHeight: 1.3 }}>
                    {alimento.nombre}
                  </p>
                  <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>
                    {alimento.cantidad_gramos}g
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  <div className="flex items-baseline gap-1">
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#F97316' }}>
                      {Math.round(alimento.calorias_estimadas)}
                    </span>
                    <span style={{ fontSize: 11, color: '#A8A29E' }}>kcal</span>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: badge.bg,
                    color: badge.color,
                  }}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Macros del alimento */}
              <div style={{
                display: 'flex',
                gap: 12,
                paddingTop: 10,
                borderTop: '1px solid #F5F4F3',
              }}>
                {[
                  { label: 'Proteína', value: alimento.proteina_g },
                  { label: 'Carbos', value: alimento.carbohidratos_g },
                  { label: 'Grasa', value: alimento.grasa_g },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1">
                    <span style={{ fontSize: 12, color: '#78716C' }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#44403C' }}>{m.value.toFixed(1)}g</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
        <button
          onClick={onDiscard}
          disabled={isDiscarding}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 16,
            border: '1.5px solid #E7E5E4',
            background: 'white',
            color: '#78716C',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: isDiscarding ? 0.6 : 1,
          }}
        >
          {isDiscarding ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              Descartando...
            </>
          ) : (
            'Descartar'
          )}
        </button>

        <button
          onClick={onConfirm}
          disabled={isDiscarding}
          style={{
            flex: 2,
            padding: '14px',
            borderRadius: 16,
            border: 'none',
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
            opacity: isDiscarding ? 0.7 : 1,
          }}
        >
          <CheckCircle2 style={{ width: 18, height: 18 }} />
          Confirmar y guardar
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
