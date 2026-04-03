'use client'

// Hook para abrir el portal de gestión de suscripción de Stripe
// El userId ya no se envía — el servidor lo extrae del JWT de la sesión
import { useMutation } from '@tanstack/react-query'

export function useManageSubscription() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(err.error ?? 'No se pudo abrir el portal')
      }

      return response.json() as Promise<{ url: string }>
    },

    onSuccess(data) {
      window.location.href = data.url
    },
  })
}
