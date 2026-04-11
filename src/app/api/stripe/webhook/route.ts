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

  type StripeEventRow = {
    stripe_event_id: string
    status: 'processing' | 'processed' | 'failed'
  }

  async function claimEvent(eventId: string, eventType: string) {
    const { data: existingEvent, error: existingEventError } = await supabase
      .from('stripe_events')
      .select('stripe_event_id, status')
      .eq('stripe_event_id', eventId)
      .maybeSingle<StripeEventRow>()

    if (existingEventError) {
      throw new Error(`No se pudo consultar stripe_events para ${eventId}: ${existingEventError.message}`)
    }

    if (!existingEvent) {
      const { error: insertError } = await supabase
        .from('stripe_events')
        .insert({
          stripe_event_id: eventId,
          event_type: eventType,
          status: 'processing',
        })

      if (insertError) {
        throw new Error(`No se pudo registrar el evento ${eventId}: ${insertError.message}`)
      }

      return true
    }

    if (existingEvent.status === 'failed') {
      const { error: retryError } = await supabase
        .from('stripe_events')
        .update({
          event_type: eventType,
          status: 'processing',
          processed_at: null,
          last_error: null,
        })
        .eq('stripe_event_id', eventId)

      if (retryError) {
        throw new Error(`No se pudo reintentar el evento ${eventId}: ${retryError.message}`)
      }

      return true
    }

    return false
  }

  async function markEventStatus(
    eventId: string,
    status: 'processed' | 'failed',
    lastError?: string | null
  ) {
    const { error } = await supabase
      .from('stripe_events')
      .update({
        status,
        processed_at: status === 'processed' ? new Date().toISOString() : null,
        last_error: lastError ?? null,
      })
      .eq('stripe_event_id', eventId)

    if (error) {
      throw new Error(`No se pudo actualizar stripe_events para ${eventId}: ${error.message}`)
    }
  }

  async function updateProfile(
    userId: string,
    updates: {
      is_premium?: boolean
      subscription_status?: string
      premium_expires_at?: string | null
      stripe_customer_id?: string
    }
  ) {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      throw new Error(`No se pudo actualizar user_profiles para ${userId}: ${error.message}`)
    }
  }

  // Función auxiliar: obtener user_id desde metadata o por stripe_customer_id
  async function resolveUserId(
    metadata: Stripe.Metadata | null,
    customerId: string | null
  ): Promise<string | null> {
    // Primero intentar desde metadata (más rápido)
    if (metadata?.user_id) return metadata.user_id

    // Si no hay metadata, buscar por stripe_customer_id en la base de datos
    if (customerId) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (error) {
        throw new Error(
          `No se pudo resolver stripe_customer_id ${customerId}: ${error.message}`
        )
      }

      return data?.id ?? null
    }

    return null
  }

  try {
    const shouldProcessEvent = await claimEvent(event.id, event.type)
    if (!shouldProcessEvent) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    switch (event.type) {
      // Pago completado — activar Premium
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = await resolveUserId(
          session.metadata,
          session.customer as string | null
        )
        if (!userId) {
          console.warn('[webhook] Usuario no resuelto para checkout.session.completed', {
            eventId: event.id,
            customerId: session.customer,
          })
          break
        }

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

        await updateProfile(userId, {
          is_premium: true,
          subscription_status: subscriptionStatus,
          premium_expires_at: premiumExpiresAt,
          stripe_customer_id: session.customer as string,
        })

        break
      }

      // Suscripción actualizada — sincronizar estado y fecha de renovación
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(
          subscription.metadata,
          subscription.customer as string
        )
        if (!userId) {
          console.warn('[webhook] Usuario no resuelto para customer.subscription.updated', {
            eventId: event.id,
            customerId: subscription.customer,
            subscriptionId: subscription.id,
          })
          break
        }

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

        await updateProfile(userId, {
          is_premium: isPremium,
          subscription_status: subscriptionStatus,
          premium_expires_at: premiumExpiresAt,
        })

        break
      }

      // Suscripción cancelada — revocar acceso Premium
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(
          subscription.metadata,
          subscription.customer as string
        )
        if (!userId) {
          console.warn('[webhook] Usuario no resuelto para customer.subscription.deleted', {
            eventId: event.id,
            customerId: subscription.customer,
            subscriptionId: subscription.id,
          })
          break
        }

        await updateProfile(userId, {
          is_premium: false,
          subscription_status: 'canceled',
        })

        break
      }

      // Pago fallido — marcar como moroso
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : null
        const userId = await resolveUserId(null, customerId)
        if (!userId) {
          console.warn('[webhook] Usuario no resuelto para invoice.payment_failed', {
            eventId: event.id,
            customerId,
          })
          break
        }

        await updateProfile(userId, { subscription_status: 'past_due' })

        break
      }

      default:
        // Evento no gestionado — ignorar silenciosamente
        break
    }

    await markEventStatus(event.id, 'processed')
  } catch (error) {
    console.error('[webhook] Error procesando evento:', {
      eventId: event.id,
      eventType: event.type,
      error,
    })

    try {
      const message = error instanceof Error ? error.message : 'Error procesando webhook'
      await markEventStatus(event.id, 'failed', message)
    } catch (markError) {
      console.error('[webhook] Error marcando stripe_events como failed:', {
        eventId: event.id,
        eventType: event.type,
        error: markError,
      })
    }

    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
