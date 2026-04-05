'use client'

// Página de éxito tras completar el checkout de Stripe
// Verifica el estado real de Supabase antes de activar Premium en el store
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePremiumStatus } from '@/hooks/usePremiumStatus'

const REDIRECT_SECONDS = 5
const MAX_POLL_ATTEMPTS = 6   // hasta 6 intentos (~12s) esperando el webhook
const POLL_INTERVAL_MS = 2000

export default function PremiumSuccessPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)
  const [pollAttempts, setPollAttempts] = useState(0)

  // Obtener usuario autenticado
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
      else router.push('/login')
    })
  }, [router])

  // Consultar Supabase para verificar estado Premium real
  const { data: premiumData, refetch } = usePremiumStatus(userId)

  const isPremiumConfirmed = premiumData?.isPremium === true

  // Si el webhook aún no llegó, reintentar cada 2s hasta MAX_POLL_ATTEMPTS
  useEffect(() => {
    if (!userId || isPremiumConfirmed) return
    if (pollAttempts >= MAX_POLL_ATTEMPTS) return

    const timer = setTimeout(() => {
      refetch()
      setPollAttempts((n) => n + 1)
    }, POLL_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [userId, isPremiumConfirmed, pollAttempts, refetch])

  // Cuenta atrás para redirección (solo cuando Premium está confirmado)
  useEffect(() => {
    if (!isPremiumConfirmed) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPremiumConfirmed, router])

  // Esperando confirmación del webhook
  if (!isPremiumConfirmed) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6" />
        <h1 className="text-xl font-bold text-stone-900">Activando tu suscripción…</h1>
        <p className="text-stone-500 mt-2 text-sm max-w-xs">
          Esto tarda unos segundos. No cierres la página.
        </p>
        {pollAttempts >= MAX_POLL_ATTEMPTS && (
          <p className="text-amber-600 text-xs mt-4 max-w-xs">
            Está tardando más de lo esperado. Tu pago fue recibido — el acceso se activará en breve. Si no, escríbenos a hola@nutriapro.es
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
      <span
        className="text-6xl animate-bounce"
        role="img"
        aria-label="Celebración"
        style={{ animationIterationCount: 3 }}
      >
        ✨
      </span>

      <h1 className="text-2xl font-bold text-stone-900 mt-6">
        ¡Bienvenido a Nutria Premium!
      </h1>

      <p className="text-stone-500 mt-3 text-center max-w-xs leading-relaxed">
        Ahora tienes acceso a todas las funciones. Empieza a ver tu progreso real.
      </p>

      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mt-8 bg-orange-500 text-white rounded-2xl py-4 px-8 font-bold text-base hover:bg-orange-600 transition-colors"
      >
        Ir al dashboard
      </button>

      <p className="mt-4 text-sm text-stone-400">
        Redirigiendo en {countdown}s…
      </p>
    </div>
  )
}
