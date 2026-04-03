'use client'

// Barra de progreso del onboarding con animación suave
interface ProgressBarProps {
  current: number  // índice actual (0-based)
  total: number    // total de pantallas
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 1 ? (current / (total - 1)) * 100 : 0

  return (
    <div className="w-full">
      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(4, percentage)}%` }}
        />
      </div>
    </div>
  )
}
