'use client'

// Layout del área protegida de la app
// Incluye QueryClientProvider y verificación de autenticación

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryClient'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { BottomNav } from '@/components/ui/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = getQueryClient()
  const { setUser, setProfile, setLoading, reset } = useAuthStore()
  const [screenError, setScreenError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isActive = true

    async function syncAuth(userOverride?: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']) {
      setLoading(true)
      setScreenError(null)

      const user = userOverride ?? (await supabase.auth.getUser()).data.user

      if (!isActive) return

      if (!user) {
        reset()
        router.replace('/login')
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!isActive) return

      if (profileError) {
        console.error('[app-layout] Error recuperando perfil:', profileError)
        setProfile(null)
        setLoading(false)
        setScreenError('No pudimos cargar tu perfil. Inténtalo de nuevo.')
        return
      }

      setProfile(profile ?? null)
      setLoading(false)

      if (!profile && !profileError) {
        router.replace('/onboarding')
        return
      }

      if (profile && !profile.onboarding_completed) {
        router.replace('/onboarding')
      }
    }

    void syncAuth()

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuth(session?.user ?? null)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [reset, router, setLoading, setProfile, setUser])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-frame min-h-screen pb-[96px]">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(243,184,67,0.18),transparent_70%)]" />
        <div className="relative">
          {screenError ? (
            <div className="flex min-h-screen items-center justify-center px-6 pb-24">
              <div className="w-full max-w-md rounded-[1.6rem] border border-[var(--line-soft)] bg-white p-6 text-center shadow-[var(--shadow-card)]">
                <p className="text-sm font-semibold text-stone-700">No pudimos cargar tu perfil</p>
                <p className="mt-2 text-sm text-stone-500">{screenError}</p>
              </div>
            </div>
          ) : children}
        </div>
        {!screenError ? <BottomNav /> : null}
      </div>
    </QueryClientProvider>
  )
}
