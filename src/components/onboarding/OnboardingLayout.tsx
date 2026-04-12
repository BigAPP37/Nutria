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
    <div className="app-frame relative flex h-dvh min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top,rgba(243,184,67,0.18),transparent_72%)]" />
      {/* Header: botón atrás + barra progreso */}
      <div
        className="app-shell relative z-10 flex items-center gap-3 pb-2 pt-10"
        style={{ paddingTop: 'max(2.8rem, env(safe-area-inset-top))' }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al paso anterior"
            className="app-panel flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--ink-2)]" />
          </button>
        ) : (
          <div className="w-10 flex-shrink-0" />
        )}

        <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-[var(--line-soft)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--hero-mid), var(--sun))',
            }}
          />
        </div>

        <div className="w-10 flex-shrink-0 text-right">
          <span className="app-kicker text-[10px]">
            {currentIndex + 1}/{totalScreens}
          </span>
        </div>
      </div>

      {/* Contenido de cada pantalla */}
      <main
        className="page-container relative z-10 flex flex-1 flex-col overflow-y-auto pt-4"
        style={{ paddingBottom: 'max(3.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
      >
        <div className="app-card min-h-full px-5 pt-5 pb-8 sm:px-6 sm:pb-10">
          {children}
        </div>
      </main>
    </div>
  )
}
