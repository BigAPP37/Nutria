'use client'

// Layout principal del onboarding — tema oscuro con gradiente y orbe naranja
import { ArrowLeft } from 'lucide-react'

interface OnboardingLayoutProps {
  currentIndex: number
  totalScreens: number
  onBack?: () => void
  children: React.ReactNode
}

export function OnboardingLayout({
  currentIndex,
  totalScreens,
  onBack,
  children,
}: OnboardingLayoutProps) {
  const progress = ((currentIndex) / (totalScreens - 1)) * 100

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #0D0D0D 55%)' }}
    >
      {/* Orbe de luz naranja — profundidad */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Header: botón atrás + barra progreso + contador */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al paso anterior"
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}

        <div
          className="flex-1 h-[3px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #F97316, #FBBF24)',
            }}
          />
        </div>

        <span
          className="text-xs shrink-0 tabular-nums"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {currentIndex + 1} / {totalScreens}
        </span>
      </div>

      {/* Contenido de cada pantalla */}
      <main className="relative z-10 flex-1 max-w-md mx-auto w-full flex flex-col px-5 pb-8 pt-4 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
