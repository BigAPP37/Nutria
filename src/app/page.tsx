// Página raíz: redirige al dashboard o login según el estado de autenticación
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Verificar si el usuario completó el onboarding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  } else {
    redirect('/onboarding')
  }
}
