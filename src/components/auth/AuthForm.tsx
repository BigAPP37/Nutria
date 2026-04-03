'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Leaf, Sparkles, TrendingUp, Apple } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

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
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single()

          if (profile?.onboarding_completed) {
            window.location.href = '/dashboard'
          } else {
            window.location.href = '/onboarding'
          }
        }
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (authError) {
          if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
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
    <div className="min-h-screen flex">

      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 flex-col items-center justify-center p-12">
        {/* Formas decorativas */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] bg-amber-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-12 w-48 h-48 bg-orange-300/30 rounded-full blur-2xl" />

        {/* Contenido */}
        <div className="relative z-10 text-white max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Nutria</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Tu camino hacia una alimentación{' '}
            <span className="text-amber-200">consciente</span>
          </h2>
          <p className="text-orange-100 text-lg leading-relaxed mb-12">
            Registra lo que comes, entiende tus hábitos y alcanza tus metas nutricionales.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: 'Seguimiento de macros en tiempo real' },
              { icon: Apple, text: 'Base de datos con miles de alimentos' },
              { icon: Sparkles, text: 'Insights personalizados con IA' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-orange-50 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center bg-stone-50 px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-900">Nutria</span>
          </div>

          {/* Cabecera */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-stone-900">
              {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h1>
            <p className="text-stone-500 mt-1 text-sm">
              {isLogin
                ? 'Introduce tus datos para continuar'
                : 'Empieza gratis, sin tarjeta de crédito'}
            </p>
          </div>

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <p className="text-sm text-emerald-700">{successMessage}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
                className="w-full h-12 px-4 rounded-2xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={isLoading}
                  className="w-full h-12 pl-4 pr-11 rounded-2xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña — solo registro */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="w-full h-12 pl-4 pr-11 rounded-2xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
                <p className="text-sm text-amber-700">{error}</p>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-md shadow-orange-200 hover:shadow-orange-300 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isLogin ? 'Entrando...' : 'Creando cuenta...'}
                </>
              ) : (
                isLogin ? 'Iniciar sesión' : 'Crear cuenta gratis'
              )}
            </button>
          </form>

          {/* Enlace alternativo */}
          <p className="text-center text-sm text-stone-500 mt-6">
            {isLogin ? (
              <>
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                  Regístrate gratis
                </Link>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                  Inicia sesión
                </Link>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  )
}
