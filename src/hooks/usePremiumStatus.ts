'use client'

// Hook que consulta el estado Premium del usuario y sincroniza el store global
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { usePremiumStore } from '@/stores/premiumStore'

export function usePremiumStatus(userId: string | null) {
  const { setPremium } = usePremiumStore()
  const supabase = createClient()

  return useQuery({
    queryKey: ['premiumStatus', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos

    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_premium, premium_expires_at, stripe_customer_id, subscription_status')
        .eq('id', userId!)
        .single()

      if (error) throw error

      // Verificar si la suscripción ha caducado
      let isPremium = data.is_premium ?? false
      if (isPremium && data.premium_expires_at) {
        const expiresAt = new Date(data.premium_expires_at)
        if (expiresAt < new Date()) {
          // Ha caducado — tratar como no premium
          isPremium = false
        }
      }

      // Sincronizar con el store global
      setPremium(isPremium, data.premium_expires_at ?? null)

      return {
        isPremium,
        premiumExpiresAt: data.premium_expires_at ?? null,
        stripeCustomerId: data.stripe_customer_id ?? null,
        subscriptionStatus: (data.subscription_status ?? 'free') as
          | 'free'
          | 'trialing'
          | 'active'
          | 'past_due'
          | 'canceled',
      }
    },
  })
}
