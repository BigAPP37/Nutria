'use client'

// Fila de micronutrientes compacta (estilo Cronometer)
// Muestra 4 micronutrientes clave con porcentaje y color semántico

interface MicronutrientRowProps {
  vitaminC_percent: number
  iron_percent: number
  calcium_percent: number
  fiber_percent: number
}

function getBarColor(percent: number, estimated: boolean): string {
  if (estimated) return '#D6D3D1'
  if (percent >= 60) return '#10B981'
  if (percent >= 40) return '#F59E0B'
  return '#F97316'
}

function getTextColor(percent: number, estimated: boolean): string {
  if (estimated) return '#78716C'
  if (percent >= 60) return '#059669'
  if (percent >= 40) return '#D97706'
  return '#EA580C'
}

export function MicronutrientRow({
  vitaminC_percent,
  iron_percent,
  calcium_percent,
  fiber_percent,
}: MicronutrientRowProps) {
  const nutrients = [
    { label: 'Vit. C', percent: vitaminC_percent, estimated: true, icon: '🍊' },
    { label: 'Hierro', percent: iron_percent, estimated: true, icon: '🩸' },
    { label: 'Calcio', percent: calcium_percent, estimated: true, icon: '🥛' },
    { label: 'Fibra', percent: fiber_percent, estimated: false, icon: '🌾' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Label de sección */}
      <p style={{
        fontSize: 11,
        fontWeight: 500,
        color: '#A8A29E',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        paddingLeft: 2,
      }}>
        Micronutrientes
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {nutrients.map((n) => {
          const barColor = getBarColor(n.percent, n.estimated)
          const textColor = getTextColor(n.percent, n.estimated)
          const cappedPercent = Math.min(100, Math.round(n.percent))

          return (
            <div
              key={n.label}
              style={{
                background: 'white',
                borderRadius: 14,
                padding: '10px 8px',
                textAlign: 'center',
                border: '1px solid #E7E5E4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <p style={{
                fontSize: 15,
                fontWeight: 800,
                color: textColor,
                lineHeight: 1,
                letterSpacing: '-0.3px',
              }}>
                {n.estimated ? '~' : ''}{cappedPercent}%
              </p>
              {/* Mini progress bar */}
              <div style={{
                width: '100%',
                height: 3,
                background: '#F5F4F3',
                borderRadius: 99,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${cappedPercent}%`,
                  background: barColor,
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: 10, color: '#A8A29E', lineHeight: 1 }}>{n.label}</p>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 10, color: '#C4B9B3', textAlign: 'right', paddingRight: 2 }}>
        ~ estimado · fibra calculada
      </p>
    </div>
  )
}
