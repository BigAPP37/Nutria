// Wrapper para el onboarding — fondo oscuro explícito para evitar
// el flash de #FAFAF9 del body durante las transiciones entre pantallas
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', overflow: 'hidden' }}>
      {children}
    </div>
  )
}
