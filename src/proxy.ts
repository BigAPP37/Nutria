// Middleware de autenticación para proteger rutas
// Usa @supabase/ssr para verificar la sesión en el servidor

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { FULL_ACCESS_ENABLED } from '@/lib/fullAccess'

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ['/dashboard', '/stats', '/settings', '/log', '/plans', '/premium']

// Rutas solo accesibles sin autenticación
const AUTH_ROUTES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar la sesión del usuario
  // IMPORTANTE: No ejecutar código entre createServerClient y getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Verificar si la ruta requiere autenticación
  // Usar ===  o startsWith(route + '/') para evitar falsos positivos
  // Ejemplo: '/login' NO debe coincidir con la ruta protegida '/log'
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Verificar si es una ruta de autenticación
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  const isOnboardingRoute = pathname === '/onboarding'

  let hasCompletedOnboarding = false

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    hasCompletedOnboarding = profile?.onboarding_completed === true
  }

  // Redirigir a /login si el usuario no está autenticado y trata de acceder a ruta protegida
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (!FULL_ACCESS_ENABLED && isProtectedRoute && user && !hasCompletedOnboarding) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (isOnboardingRoute && user && (hasCompletedOnboarding || FULL_ACCESS_ENABLED)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isAuthRoute && user) {
    const destination = hasCompletedOnboarding || FULL_ACCESS_ENABLED ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos públicos con extensión
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
