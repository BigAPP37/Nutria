// API route para crear sesiones de checkout con Stripe
// SEC: el userId se extrae del JWT de Supabase — nunca del body
import Stripe from 'stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY_ID!,
  annual: process.env.STRIPE_PRICE_ANNUAL_ID!,
} as const
const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación — extraer usuario del JWT de la cookie de sesión
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Extraer solo el plan del body — el userId viene del JWT, no del cliente
    const body = await request.json()
    const { plan } = body as { plan: 'monthly' | 'annual' }

    if (!plan) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }
    if (!STRIPE_PRICES[plan]) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    // Cliente con service role solo para operaciones administrativas de BD
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Obtener perfil del usuario autenticado
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 4. Recuperar o crear el customer de Stripe
    let stripeCustomerId = profile?.stripe_customer_id ?? null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      await serviceSupabase
        .from('user_profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    const isFirstTime =
      !profile?.subscription_status ||
      profile.subscription_status === 'free'

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      success_url: `${APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/settings`,
      metadata: { user_id: user.id, plan },
      subscription_data: {
        trial_period_days: isFirstTime ? 7 : undefined,
        metadata: { user_id: user.id, plan },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/checkout] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
