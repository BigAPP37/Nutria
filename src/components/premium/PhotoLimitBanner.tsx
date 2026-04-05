'use client'

// Banner informativo sobre el límite de fotos diarias para usuarios gratuitos
interface PhotoLimitBannerProps {
  photoLogsToday: number
  maxFreePhotos: number
  onUpgrade: () => void
}

export function PhotoLimitBanner({
  photoLogsToday,
  maxFreePhotos,
  onUpgrade,
}: PhotoLimitBannerProps) {
  const remaining = maxFreePhotos - photoLogsToday

  // Sin fotos restantes
  if (remaining <= 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
        borderRadius: 14,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        border: '1px solid rgba(249,115,22,0.3)',
      }}>
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: 20 }}>📸</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Sin fotos disponibles hoy
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              Describe tu comida con texto
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            flexShrink: 0,
            padding: '7px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
          }}
        >
          Premium
        </button>
      </div>
    )
  }

  // Queda 1 foto
  if (remaining === 1) {
    return (
      <div style={{
        background: '#FFF7ED',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid #FED7AA',
      }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <p style={{ fontSize: 13, color: '#C2410C', fontWeight: 500 }}>
          Te queda 1 foto hoy
        </p>
        {/* Dots de progreso */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {Array.from({ length: maxFreePhotos }, (_, i) => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i < photoLogsToday ? '#F97316' : '#FED7AA',
            }} />
          ))}
        </div>
      </div>
    )
  }

  // Quedan 2 fotos
  if (remaining === 2) {
    return (
      <div style={{
        background: '#FFFBEB',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid #FDE68A',
      }}>
        <span style={{ fontSize: 16 }}>📸</span>
        <p style={{ fontSize: 13, color: '#78716C', fontWeight: 500 }}>
          Te quedan 2 fotos hoy
        </p>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {Array.from({ length: maxFreePhotos }, (_, i) => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i < photoLogsToday ? '#F97316' : '#FDE68A',
            }} />
          ))}
        </div>
      </div>
    )
  }

  // Más de 2 fotos restantes — no mostrar nada
  return null
}
