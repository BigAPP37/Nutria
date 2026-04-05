'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Sparkles, TrendingUp, Apple, Flame } from 'lucide-react'
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

  // ── Shared input style helper ─────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 50,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 14,
    border: '1.5px solid #E7E5E4',
    background: 'white',
    fontSize: 14,
    color: '#1C1917',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Panel izquierdo — branding (desktop) ── */}
      <div
        className="hidden lg:flex"
        style={{
          width: '50%',
          background: 'linear-gradient(160deg, #F97316 0%, #C2410C 55%, #7C2D12 100%)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          top: '45%',
          right: -20,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, color: 'white', maxWidth: 380 }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              🥗
            </div>
            <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px' }}>Nutria</span>
          </div>

          <h2 style={{
            fontSize: 40,
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 16,
            letterSpacing: '-1px',
          }}>
            Tu camino hacia una alimentación{' '}
            <span style={{ color: '#FDE68A' }}>consciente</span>
          </h2>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.7,
            marginBottom: 48,
          }}>
            Registra lo que comes, entiende tus hábitos y alcanza tus metas nutricionales con inteligencia artificial.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { Icon: TrendingUp, text: 'Seguimiento de macros en tiempo real' },
              { Icon: Apple,      text: 'Base de datos con miles de alimentos' },
              { Icon: Sparkles,   text: 'Insights personalizados con IA' },
              { Icon: Flame,      text: 'Rachas diarias para mantenerte motivado' },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backdropFilter: 'blur(4px)',
                }}>
                  <Icon style={{ width: 16, height: 16, color: 'white' }} />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAF9',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Logo mobile — solo visible en móvil */}
          <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              background: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
            }}>
              🥗
            </div>
            <span style={{
              fontSize: 26,
              fontWeight: 900,
              color: '#1C1917',
              letterSpacing: '-0.5px',
            }}>
              Nutria
            </span>
          </div>

          {/* Cabecera */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#1C1917',
              letterSpacing: '-0.5px',
              marginBottom: 8,
              lineHeight: 1.2,
            }}>
              {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h1>
            <p style={{ fontSize: 15, color: '#78716C', lineHeight: 1.5 }}>
              {isLogin
                ? 'Introduce tus datos para continuar'
                : 'Empieza gratis, sin tarjeta de crédito'}
            </p>
          </div>

          {/* Mensaje de éxito */}
          {successMessage && (
            <div style={{
              marginBottom: 20,
              padding: '14px 16px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 14,
            }}>
              <p style={{ fontSize: 13, color: '#065F46' }}>{successMessage}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#44403C',
                marginBottom: 6,
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#F97316'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E7E5E4'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#44403C',
                marginBottom: 6,
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={isLoading}
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#F97316'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E7E5E4'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#A8A29E',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña — solo registro */}
            {!isLogin && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#44403C',
                  marginBottom: 6,
                }}>
                  Confirmar contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isLoading}
                    style={{ ...inputStyle, paddingRight: 48 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F97316'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E7E5E4'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#A8A29E',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error — amber, nunca rojo */}
            {error && (
              <div style={{
                padding: '12px 14px',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 12,
              }}>
                <p style={{ fontSize: 13, color: '#92400E' }}>{error}</p>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: 52,
                marginTop: 4,
                borderRadius: 16,
                border: 'none',
                background: isLoading
                  ? '#E7E5E4'
                  : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: isLoading ? '#A8A29E' : 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(249,115,22,0.45)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                letterSpacing: '-0.2px',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isLogin ? 'Entrando...' : 'Creando cuenta...'}
                </>
              ) : (
                isLogin ? 'Iniciar sesión' : '🚀 Crear cuenta gratis'
              )}
            </button>
          </form>

          {/* Enlace alternativo */}
          <p style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#78716C',
            marginTop: 24,
          }}>
            {isLogin ? (
              <>
                ¿No tienes cuenta?{' '}
                <Link href="/register" style={{ color: '#F97316', fontWeight: 700, textDecoration: 'none' }}>
                  Regístrate gratis
                </Link>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" style={{ color: '#F97316', fontWeight: 700, textDecoration: 'none' }}>
                  Inicia sesión
                </Link>
              </>
            )}
          </p>

          {/* Legal fine print */}
          {!isLogin && (
            <p style={{
              textAlign: 'center',
              fontSize: 11,
              color: '#C4B9B3',
              marginTop: 16,
              lineHeight: 1.5,
            }}>
              Al registrarte aceptas nuestros términos de servicio y política de privacidad
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
