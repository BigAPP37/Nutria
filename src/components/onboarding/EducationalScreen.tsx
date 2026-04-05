'use client'

// Pantalla educativa/motivacional del onboarding — tema oscuro
import { NutriaImage } from '@/components/NutriaImage'
import type { NutiPose } from '@/constants/nuti-messages'

interface EducationalScreenProps {
  title: string
  text: string
  eyebrow?: string
  buttonText?: string
  onNext: () => void
  pose?: NutiPose
  illustrationContent?: React.ReactNode
}

export function EducationalScreen({
  title,
  text,
  eyebrow,
  buttonText = 'Continuar',
  onNext,
  pose = 'reading',
  illustrationContent,
}: EducationalScreenProps) {
  return (
    <div className="flex-1 flex flex-col pt-2 pb-8">
      {/* Contenido centrado verticalmente */}
      <div className="flex-[2] flex flex-col items-center justify-center gap-4 text-center">
        {/* Ilustración de Nuti */}
        <div className="flex items-center justify-center flex-shrink-0 w-full px-2">
          {illustrationContent ?? (
            <NutriaImage pose={pose} size="100%" maxWidth="500px" priority withGlow />
          )}
        </div>

        <div className="space-y-2 max-w-sm px-4">
          {eyebrow && (
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>
              {eyebrow}
            </p>
          )}
          <h2 className="font-bold leading-tight" style={{ color: '#1C1917', fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
            {title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#78716C' }}>
            {text}
          </p>
        </div>
      </div>

      {/* Botón CTA */}
      <button
        type="button"
        onClick={onNext}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
          boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
        }}
      >
        {buttonText}
      </button>
    </div>
  )
}
