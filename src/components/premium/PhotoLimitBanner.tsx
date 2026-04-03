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
      <div className="bg-stone-100 rounded-xl px-4 py-3 text-sm text-stone-600">
        Sin fotos disponibles hoy — describe tu comida con texto{' '}
        <button
          type="button"
          onClick={onUpgrade}
          className="text-orange-500 underline underline-offset-2 font-medium"
        >
          o hazte Premium
        </button>
      </div>
    )
  }

  // Queda 1 foto
  if (remaining === 1) {
    return (
      <div className="bg-stone-100 rounded-xl px-4 py-3 text-sm text-stone-600">
        Te queda 1 foto hoy
      </div>
    )
  }

  // Quedan 2 fotos
  if (remaining === 2) {
    return (
      <div className="bg-stone-100 rounded-xl px-4 py-3 text-sm text-stone-600">
        Te quedan 2 fotos hoy
      </div>
    )
  }

  // Más de 2 fotos restantes — no mostrar nada
  return null
}
