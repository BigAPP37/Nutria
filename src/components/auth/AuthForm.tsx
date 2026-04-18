'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Apple, Eye, EyeOff, Flame, Sparkles, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FULL_ACCESS_ENABLED } from '@/lib/fullAccess'

type AuthMode = 'login' | 'register'

interface AuthFormProps {
  mode: AuthMode
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isLogin = mode === 'login'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            setError('Email o contraseña incorrectos.')
          } else if (authError.message.includes('Email not confirmed')) {
            setError('Por favor verifica tu email antes de iniciar sesión.')
          } else {
            setError('Ocurrió un error. Por favor intenta de nuevo.')
          }
          return
        }

        if (data.user) {
          if (FULL_ACCESS_ENABLED) {
            window.location.href = '/dashboard'
            return
          }

          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .maybeSingle()

          if (profileError) {
            setError('No pudimos recuperar tu perfil. Intenta de nuevo.')
            return
          }

          window.location.href = profile?.onboarding_completed
            ? '/dashboard'
            : '/onboarding'
        }
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        })

        if (authError) {
          if (
            authError.message.includes('already registered') ||
            authError.message.includes('User already registered')
          ) {
            setError('Este email ya está registrado. ¿Quieres iniciar sesión?')
          } else {
            setError(authError.message || 'Ocurrió un error al registrarte. Intenta de nuevo.')
          }
          return
        }

        setSuccessMessage('¡Cuenta creada! Revisa tu email para verificar tu cuenta.')
      }
    } catch {
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <aside className="hero-surface relative hidden min-h-screen overflow-hidden px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute left-[-4rem] top-[-4rem] h-56 w-56 rounded-full bg-white/14 blur-2xl" />
          <div className="absolute bottom-12 right-[-2rem] h-64 w-64 rounded-full bg-[#f3b843]/25 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-[30rem]">
          <div className="mb-10 flex items-center gap-3">
            <div className="soft-ring flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white/12 text-2xl">
              🦦
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                Nutria
              </p>
              <h2 className="display-title text-3xl font-semibold text-white">
                Nutrición con criterio
              </h2>
            </div>
          </div>

          <div className="space-y-5">
            <p className="app-kicker text-white/70">Tu sistema diario</p>
            <h1 className="display-title text-5xl font-semibold leading-[0.96] text-white">
              {isLogin ? 'Vuelve a tu tablero y sigue el hilo.' : 'Empieza con una app que se siente hecha para cuidarte.'}
            </h1>
            <p className="max-w-md text-base leading-7 text-white/78">
              Registra comidas, entiende tus patrones y mantén el progreso visible sin una interfaz clínica ni genérica.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid gap-3">
          {[
            { icon: TrendingUp, text: 'Resumen diario claro y accionable' },
            { icon: Apple, text: 'Registro flexible: texto, foto y búsqueda' },
            { icon: Sparkles, text: 'Insights y acompañamiento sin ruido visual' },
            { icon: Flame, text: 'Motivación basada en continuidad, no culpa' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-[1.2rem] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-white/12">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-medium text-white/88">{text}</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,184,67,0.08),transparent_30%)]" />

        <div className="relative z-10 w-full max-w-[26rem]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[linear-gradient(145deg,var(--hero-start),var(--hero-mid),var(--hero-end))] text-2xl text-white shadow-[0_14px_28px_rgba(126,62,34,0.26)]">
              🦦
            </div>
            <div>
              <p className="app-kicker">Nutria</p>
              <h2 className="display-title text-2xl font-semibold text-[var(--ink-1)]">
                Nutrición con criterio
              </h2>
            </div>
          </div>

          <div className="app-card p-6 sm:p-8">
            <div className="mb-6 space-y-2">
              <p className="app-kicker">
                {isLogin ? 'Acceso' : 'Crear cuenta'}
              </p>
              <h1 className="display-title text-4xl font-semibold text-[var(--ink-1)]">
                {isLogin ? 'Bienvenido de vuelta' : 'Haz espacio para un mejor ritmo'}
              </h1>
              <p className="text-sm leading-6 text-[var(--ink-2)]">
                {isLogin
                  ? 'Entra para retomar tu día, revisar tus métricas y seguir registrando.'
                  : 'Empieza gratis y configura un sistema que te acompañe de forma constante.'}
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 rounded-[1rem] border border-[rgba(40,89,79,0.16)] bg-[var(--forest-soft)] px-4 py-3 text-sm text-[var(--forest)]">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                disabled={isLoading}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="pointer-events-auto rounded-md p-1 text-[var(--ink-3)] transition hover:text-[var(--ink-2)]"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {!isLogin && (
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirmar contraseña"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="pointer-events-auto rounded-md p-1 text-[var(--ink-3)] transition hover:text-[var(--ink-2)]"
                      aria-label={
                        showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              )}

              <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
                {isLogin ? 'Iniciar sesión' : 'Crear cuenta gratis'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <p className="text-center text-sm text-[var(--ink-2)]">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <Link
                  href={isLogin ? '/register' : '/login'}
                  className="font-semibold text-[var(--color-primary-600)]"
                >
                  {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
                </Link>
              </p>

              {!isLogin && (
                <p className="text-center text-xs leading-5 text-[var(--ink-3)]">
                  Al registrarte aceptas nuestros términos de servicio y política de privacidad.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
