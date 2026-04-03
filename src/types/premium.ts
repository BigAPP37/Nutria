// Tipos para el sistema de monetización Premium

export interface PremiumStatus {
  isPremium: boolean
  premiumExpiresAt: string | null
  stripeCustomerId: string | null
  subscriptionStatus: 'free' | 'trialing' | 'active' | 'past_due' | 'canceled'
}

export type PricePlan = 'monthly' | 'annual'
