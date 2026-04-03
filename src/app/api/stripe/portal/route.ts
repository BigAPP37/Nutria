// API route para abrir el portal de gestión de suscripción de Stripe
// SEC: el userId se extrae del JWT de Supabase — nunca del body
import Stripe from 'stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación — extraer usuario del JWT de la cookie de sesión
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Cliente con service role solo para operaciones administrativas de BD
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Obtener el stripe_customer_id del usuario autenticado
    const { data: profile, error } = await serviceSupabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (error || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No se encontró una suscripción activa' },
        { status: 404 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const origin =
      request.headers.get('origin') ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('[stripe/portal] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
