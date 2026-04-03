// Webhook de Stripe — recibe eventos y actualiza el estado de suscripción en Supabase
// IMPORTANTE: debe leer el body como texto crudo para verificar la firma
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Deshabilitar caché para que Next.js no interfiera con el body raw
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Firma de Stripe ausente' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // Verificar la firma del webhook — previene eventos fraudulentos
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Firma inválida:', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  // Cliente de Supabase con service role para escrituras administrativas
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Función auxiliar: obtener user_id desde metadata o por stripe_customer_id
  async function resolveUserId(
    metadata: Stripe.Metadata | null,
    customerId: string | null
  ): Promise<string | null> {
    // Primero intentar desde metadata (más rápido)
    if (metadata?.user_id) return metadata.user_id

    // Si no hay metadata, buscar por stripe_customer_id en la base de datos
    if (customerId) {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      return data?.id ?? null
    }

    return null
  }

  try {
    switch (event.type) {
      // Pago completado — activar Premium
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = await resolveUserId(
          session.metadata,
          session.customer as string | null
        )
        if (!userId) break

        // Recuperar detalles de la suscripción para obtener la fecha de expiración
        let premiumExpiresAt: string | null = null
        let subscriptionStatus: string = 'active'

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          premiumExpiresAt = new Date(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (subscription as any).current_period_end * 1000
          ).toISOString()
          subscriptionStatus =
            subscription.status === 'trialing' ? 'trialing' : 'active'
        }

        await supabase
          .from('user_profiles')
          .update({
            is_premium: true,
            subscription_status: subscriptionStatus,
            premium_expires_at: premiumExpiresAt,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId)

        break
      }

      // Suscripción actualizada — sincronizar estado y fecha de renovación
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(
          subscription.metadata,
          subscription.customer as string
        )
        if (!userId) break

        const premiumExpiresAt = new Date(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (subscription as any).current_period_end * 1000
        ).toISOString()

        const statusMap: Record<string, string> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'past_due',
        }

        const subscriptionStatus = statusMap[subscription.status] ?? 'active'
        const isPremium =
          subscription.status === 'active' || subscription.status === 'trialing'

        await supabase
          .from('user_profiles')
          .update({
            is_premium: isPremium,
            subscription_status: subscriptionStatus,
            premium_expires_at: premiumExpiresAt,
          })
          .eq('id', userId)

        break
      }

      // Suscripción cancelada — revocar acceso Premium
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(
          subscription.metadata,
          subscription.customer as string
        )
        if (!userId) break

        await supabase
          .from('user_profiles')
          .update({
            is_premium: false,
            subscription_status: 'canceled',
          })
          .eq('id', userId)

        break
      }

      // Pago fallido — marcar como moroso
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : null
        const userId = await resolveUserId(null, customerId)
        if (!userId) break

        await supabase
          .from('user_profiles')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId)

        break
      }

      default:
        // Evento no gestionado — ignorar silenciosamente
        break
    }
  } catch (error) {
    console.error('[webhook] Error procesando evento:', event.type, error)
    // Devolver 200 para que Stripe no reintente indefinidamente
  }

  // Siempre responder 200 para confirmar recepción
  return NextResponse.json({ received: true }, { status: 200 })
}
