'use client'

// Layout principal del onboarding — tema claro estilo Yazio
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
      className="h-screen h-dvh flex flex-col relative overflow-hidden"
      style={{ background: '#FAFAF9' }}
    >
      {/* Header: botón atrás + barra progreso */}
      <div className="relative z-10 flex items-center gap-3 px-5 pb-2" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al paso anterior"
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: '#F5F5F4',
              border: '1px solid #E7E5E4',
            }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: '#78716C' }} />
          </button>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}

        <div
          className="flex-1 h-[3px] rounded-full overflow-hidden"
          style={{ background: '#E7E5E4' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #F97316, #FBBF24)',
            }}
          />
        </div>

        <div className="w-8 flex-shrink-0" />
      </div>

      {/* Contenido de cada pantalla */}
      <main className="relative z-10 flex-1 max-w-md mx-auto w-full flex flex-col px-5 pt-4 overflow-y-auto" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {children}
      </main>
    </div>
  )
}
