'use client'

// Hook para iniciar el proceso de checkout con Stripe
// El userId ya no se envía — el servidor lo extrae del JWT de la sesión
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { PricePlan } from '@/types/premium'

export function useCheckout() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ plan }: { plan: PricePlan }) => {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Solo el plan — el servidor extrae el userId del JWT
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(err.error ?? 'Error al iniciar el pago')
      }

      return response.json() as Promise<{ url: string }>
    },

    onSuccess(data) {
      window.location.href = data.url
    },

    onError(error: Error) {
      setErrorMessage(error.message ?? 'No se pudo iniciar el pago. Intenta de nuevo.')
    },
  })

  return { ...mutation, errorMessage }
}
