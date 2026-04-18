// Página raíz: redirige al dashboard o login según el estado de autenticación
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FULL_ACCESS_ENABLED } from '@/lib/fullAccess'

export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    if (FULL_ACCESS_ENABLED) {
      redirect('/dashboard')
    }

    // Verificar si el usuario completó el onboarding
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-[1.6rem] border border-stone-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-stone-700">No pudimos cargar tu perfil</p>
            <p className="mt-2 text-sm text-stone-500">{profileError.message}</p>
          </div>
        </main>
      )
    }

    if (profile?.onboarding_completed) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  } else {
    redirect('/onboarding')
  }
}
