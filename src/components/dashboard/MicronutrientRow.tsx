'use client'

// Fila compacta de indicadores nutricionales.
// Solo muestra métricas reales para no enseñar micronutrientes simulados.

interface MicronutrientRowProps {
  fiberPercent: number
}

function getBarColor(percent: number): string {
  if (percent >= 60) return '#10B981'
  if (percent >= 40) return '#F59E0B'
  return '#F97316'
}

function getTextColor(percent: number): string {
  if (percent >= 60) return '#059669'
  if (percent >= 40) return '#D97706'
  return '#EA580C'
}

export function MicronutrientRow({ fiberPercent }: MicronutrientRowProps) {
  const cappedFiberPercent = Math.min(100, Math.round(fiberPercent))
  const fiberBarColor = getBarColor(cappedFiberPercent)
  const fiberTextColor = getTextColor(cappedFiberPercent)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{
        fontSize: 11,
        fontWeight: 500,
        color: '#A8A29E',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        paddingLeft: 2,
      }}>
        Indicadores nutricionales
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 8 }}>
        <div
          style={{
            background: 'white',
            borderRadius: 14,
            padding: '10px 10px',
            textAlign: 'center',
            border: '1px solid #E7E5E4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 16 }}>🌾</span>
          <p style={{
            fontSize: 15,
            fontWeight: 800,
            color: fiberTextColor,
            lineHeight: 1,
            letterSpacing: '-0.3px',
          }}>
            {cappedFiberPercent}%
          </p>
          <div style={{
            width: '100%',
            height: 3,
            background: '#F5F4F3',
            borderRadius: 99,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${cappedFiberPercent}%`,
              background: fiberBarColor,
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: 10, color: '#A8A29E', lineHeight: 1 }}>Fibra</p>
        </div>

        <div
          style={{
            background: '#FFFCF5',
            borderRadius: 14,
            padding: '12px 12px',
            border: '1px solid #E7E5E4',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: '#57534E', lineHeight: 1.2 }}>
            Micronutrientes avanzados
          </p>
          <p style={{ fontSize: 11, color: '#78716C', lineHeight: 1.35 }}>
            Vitamina C, hierro y calcio aparecerán cuando Nutria tenga datos detallados por alimento.
          </p>
        </div>
      </div>
    </div>
  )
}
