'use client'

// Página de éxito tras completar el checkout de Stripe
// Activa el estado Premium en el store y redirige al dashboard
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePremiumStore } from '@/stores/premiumStore'

const REDIRECT_SECONDS = 4

export default function PremiumSuccessPage() {
  const router = useRouter()
  const { setPremium } = usePremiumStore()
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    // Activar Premium en el store local inmediatamente
    // (el webhook de Stripe habrá actualizado Supabase en segundo plano)
    setPremium(true, null)

    // Cuenta atrás para redirección automática
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
  }, [router, setPremium])

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
      {/* Icono animado */}
      <span
        className="text-6xl animate-bounce"
        role="img"
        aria-label="Celebración"
        style={{ animationIterationCount: 3 }}
      >
        ✨
      </span>

      {/* Título de bienvenida */}
      <h1 className="text-2xl font-bold text-stone-900 mt-6">
        ¡Bienvenido a Nutria Premium!
      </h1>

      {/* Subtítulo */}
      <p className="text-stone-500 mt-3 text-center max-w-xs leading-relaxed">
        Ahora tienes acceso a todas las funciones. Empieza a ver tu progreso real.
      </p>

      {/* Botón al dashboard */}
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mt-8 bg-orange-500 text-white rounded-2xl py-4 px-8 font-bold text-base hover:bg-orange-600 transition-colors"
      >
        Ir al dashboard
      </button>

      {/* Cuenta atrás de redirección automática */}
      <p className="mt-4 text-sm text-stone-400">
        Redirigiendo en {countdown}s…
      </p>
    </div>
  )
}
