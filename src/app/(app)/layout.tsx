'use client'

// Layout del área protegida de la app
// Incluye QueryClientProvider y verificación de autenticación

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryClient'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = getQueryClient()
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Obtener sesión inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    })

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        router.push('/login')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, setUser, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#FAFAF9]">
        {children}
      </div>
    </QueryClientProvider>
  )
}
