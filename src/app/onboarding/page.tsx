'use client'

// Orquestador del onboarding ampliado — 24 pantallas con lógica condicional
// Gestiona la navegación dinámica según las respuestas del usuario

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scale, Ruler, User, Heart, ChevronDown, Eye, EyeOff, Camera, BarChart2, Sparkles } from 'lucide-react'

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { SingleSelectQuestion } from '@/components/onboarding/SingleSelectQuestion'
import { MultiSelectQuestion } from '@/components/onboarding/MultiSelectQuestion'
import { EducationalScreen } from '@/components/onboarding/EducationalScreen'
import { AiFoodScanner } from '@/components/AiFoodScanner'
import { NutriaImage } from '@/components/NutriaImage'

import { useOnboardingStore, getScreenSequence } from '@/stores/onboardingStore'
import { createClient } from '@/lib/supabase/client'
import { calculateNutritionGoals, lbsToKg, ftInToCm } from '@/lib/calculations'
import { nutiMessages } from '@/constants/nuti-messages'

export default function OnboardingPage() {
  const router = useRouter()
  const {
    currentScreen,
    data,
    nextScreen: _nextScreen,
    prevScreen: _prevScreen,
    updateData,
  } = useOnboardingStore()

  const [isTransitioning, setIsTransitioning] = useState(false)

  function nextScreen() {
    setIsTransitioning(true)
    setTimeout(() => { _nextScreen(); setIsTransitioning(false) }, 220)
  }
  function prevScreen() {
    setIsTransitioning(true)
    setTimeout(() => { _prevScreen(); setIsTransitioning(false) }, 220)
  }

  // Estado local para errores de validación del formulario de perfil físico
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  // Estado local para los 3 selects de fecha de nacimiento
  // Se inicializan desde data.birth_date si ya existe (navegación atrás)
  const [birthDay,   setBirthDay]   = useState<string>(() => data.birth_date ? data.birth_date.split('-')[2] ?? '' : '')
  const [birthMonth, setBirthMonth] = useState<string>(() => data.birth_date ? data.birth_date.split('-')[1] ?? '' : '')
  const [birthYear,  setBirthYear]  = useState<string>(() => data.birth_date ? data.birth_date.split('-')[0] ?? '' : '')
  // Estado local para el mensaje de soporte TCA
  const [showTcaSupportMessage, setShowTcaSupportMessage] = useState(false)

  // Estado para la animación de progreso de la pantalla "ready"
  const [planProgress, setPlanProgress] = useState(0)
  const [planPhase, setPlanPhase] = useState<'loading' | 'celebration' | 'ready'>('loading')
  const [ringBurst, setRingBurst] = useState(false)

  // Estado local para la pantalla de registro
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerShowPassword, setRegisterShowPassword] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerCountdown, setRegisterCountdown] = useState(600) // 10 min
  // Ref para evitar doble submit (handleEmailRegister + onAuthStateChange simultáneos)
  const isSubmittingRef = useRef(false)
  // Estado de carga OAuth — true mientras Supabase completa el code exchange tras redirect
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  // Redirigir al dashboard si el usuario ya completó el onboarding
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.onboarding_completed) router.replace('/dashboard')
        })
    })
  }, [router])

  // Resetear store si el usuario llega a /onboarding con currentScreen='register'
  // pero sin un OAuth code activo — significa que es una sesión persistida de una
  // cuenta ya completada, no un flujo de registro en curso.
  useEffect(() => {
    const hasOAuthCode = window.location.search.includes('code=')
    if (currentScreen === 'register' && !hasOAuthCode) {
      useOnboardingStore.getState().goToScreen('welcome')
    }
  }, []) // eslint-disable-line

  // Auto-detectar país desde navigator.language al montar (una sola vez)
  useEffect(() => {
    if (data.country) return
    const lang = navigator.language ?? ''
    const parts = lang.split('-')
    const code = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
    if (code.length === 2) updateData({ country: code })
  }, []) // eslint-disable-line

  // Calcular la secuencia dinámica y la posición actual
  const sequence = getScreenSequence(data)
  const currentIndex = sequence.indexOf(currentScreen)
  const totalScreens = sequence.length

  // ─── Guardar datos del onboarding una vez autenticado ─────────────────────

  async function submitOnboardingData() {
    // Evitar doble ejecución (handleEmailRegister + onAuthStateChange simultáneos)
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    const storeData = useOnboardingStore.getState().data

    if (!storeData.weight_kg || !storeData.height_cm || !storeData.birth_date || !storeData.biological_sex || !storeData.goal || !storeData.activity_level) {
      setRegisterError('Faltan datos esenciales. Por favor, revisa los pasos anteriores.')
      isSubmittingRef.current = false
      return
    }

    setIsRegistering(true)
    setRegisterError(null)

    try {
      const supabase = createClient()

      const nutritionGoals = calculateNutritionGoals({
        weight_kg: storeData.weight_kg,
        height_cm: storeData.height_cm,
        birth_date: storeData.birth_date,
        biological_sex: storeData.biological_sex,
        activity_level: storeData.activity_level,
        goal: storeData.goal,
      })

      const { error: onboardingError } = await supabase.rpc('complete_onboarding_atomic', {
        p_display_name: storeData.name || 'Usuario',
        p_height_cm: storeData.height_cm,
        p_date_of_birth: storeData.birth_date,
        p_biological_sex: storeData.biological_sex,
        p_goal: storeData.goal,
        p_activity_level: storeData.activity_level,
        p_country_code: (storeData.country && storeData.country.length === 2) ? storeData.country.toUpperCase() : 'ES',
        p_unit_weight: storeData.units_weight,
        p_unit_energy: storeData.units_energy,
        p_timezone: storeData.timezone,
        p_weight_kg: storeData.weight_kg,
        p_weight_loss_experience: storeData.weight_loss_experience ?? null,
        p_past_diets: storeData.past_diets.length > 0 ? storeData.past_diets : null,
        p_biggest_challenges: storeData.biggest_challenges.length > 0 ? storeData.biggest_challenges : null,
        p_eating_triggers: storeData.eating_triggers.length > 0 ? storeData.eating_triggers : null,
        p_emotional_eating_frequency: storeData.emotional_eating_frequency ?? null,
        p_food_relationship: storeData.food_relationship ?? null,
        p_meals_per_day: storeData.meals_per_day ?? null,
        p_snacking_frequency: storeData.snacking_frequency ?? null,
        p_cooking_frequency: storeData.cooking_frequency ?? null,
        p_eats_out_frequency: storeData.eats_out_frequency ?? null,
        p_water_intake: storeData.water_intake ?? null,
        p_sleep_quality: storeData.sleep_quality ?? null,
        p_stress_level: storeData.stress_level ?? null,
        p_diet_restrictions: storeData.diet_restrictions.length > 0 ? storeData.diet_restrictions : null,
        p_allergies: storeData.allergies.length > 0 ? storeData.allergies : null,
        p_secondary_goals: storeData.secondary_goals.length > 0 ? storeData.secondary_goals : null,
        p_commitment_time: storeData.commitment_time ?? null,
        p_progress_tracking: storeData.progress_tracking.length > 0 ? storeData.progress_tracking : null,
        p_living_situation: storeData.living_situation ?? null,
        p_household_support: storeData.household_support ?? null,
        p_ai_tone_preference: storeData.ai_tone_preference ?? null,
        p_wants_daily_tips: storeData.wants_daily_tips,
        p_tca_answer: storeData.tca_answer ?? null,
        p_tca_flagged: storeData.tca_flagged ?? false,
        p_tdee: nutritionGoals.tdee,
        p_goal_kcal: nutritionGoals.calorie_goal,
        p_protein_g: nutritionGoals.protein_g,
        p_carbs_g: nutritionGoals.carbs_g,
        p_fat_g: nutritionGoals.fat_g,
      })

      if (onboardingError) {
        throw onboardingError
      }

      useOnboardingStore.getState().reset()
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Error en submit del onboarding:', err)
      setRegisterError('Ocurrió un error inesperado. Por favor intenta de nuevo.')
    } finally {
      setIsRegistering(false)
      isSubmittingRef.current = false
    }
  }

  // ─── Registro con email/contraseña ────────────────────────────────────────

  async function handleEmailRegister() {
    if (!registerEmail || !registerPassword) {
      setRegisterError('Por favor completa todos los campos.')
      return
    }
    if (registerPassword.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setIsRegistering(true)
    setRegisterError(null)

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setRegisterError('Este email ya está registrado. ¿Quieres iniciar sesión?')
        } else {
          setRegisterError(authError.message || 'Ocurrió un error al registrarte.')
        }
        return
      }

      // Si hay sesión inmediata (email confirmation desactivado), guardar datos
      if (authData.session?.user) {
        await submitOnboardingData()
      } else {
        // Email confirmation requerido — mostrar mensaje
        setRegisterError('¡Cuenta creada! Revisa tu email para confirmar y acceder a tu plan.')
      }
    } catch {
      setRegisterError('Ocurrió un error inesperado. Por favor intenta de nuevo.')
    } finally {
      setIsRegistering(false)
    }
  }

  // ─── Registro con Google ───────────────────────────────────────────────────

  async function handleGoogleRegister() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    })
  }

  // ─── Detectar auth tras redirect OAuth ────────────────────────────────────
  useEffect(() => {
    if (currentScreen !== 'register') return

    const supabase = createClient()
    let submitted = false

    // Detectar si venimos de un redirect OAuth (hay ?code= en la URL)
    const hasOAuthCode = typeof window !== 'undefined' && window.location.search.includes('code=')

    let timeout: ReturnType<typeof setTimeout> | null = null

    if (hasOAuthCode) {
      setIsOAuthLoading(true)
      setOauthError(null)

      // Timeout de seguridad: si en 10s no se completa el code exchange, mostrar error
      timeout = setTimeout(() => {
        if (!submitted) {
          setIsOAuthLoading(false)
          setOauthError('La autenticación tardó demasiado. Por favor, inténtalo de nuevo.')
        }
      }, 10_000)

      // Verificación inmediata — si Supabase ya completó el code exchange, getUser() lo sabrá
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && !submitted) {
          if (timeout) clearTimeout(timeout)
          submitted = true
          submitOnboardingData()
        }
        // Si no hay usuario aún, onAuthStateChange lo capturará cuando termine el exchange
      })
    }

    // Listener para autenticación que se completa mientras la pantalla está visible
    // (email/password, o OAuth cuando getUser() fue demasiado rápido)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !submitted) {
        if (timeout) clearTimeout(timeout)
        submitted = true
        setIsOAuthLoading(false)
        submitOnboardingData()
      }
    })

    return () => {
      if (timeout) clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [currentScreen]) // eslint-disable-line

  // ─── Animación de progreso — pantalla "ready" ─────────────────────────
  useEffect(() => {
    if (currentScreen !== 'ready') return
    setPlanProgress(0)
    setPlanPhase('loading')
    setRingBurst(false)
    let rafId: number
    let start: number | null = null
    const duration = 4000
    function animate(ts: number) {
      if (!start) start = ts
      const t = Math.min(1, (ts - start) / duration)
      // ease-out cubic: desacelera al llegar al 100%
      const easedT = 1 - Math.pow(1 - t, 3)
      const progress = Math.min(100, Math.round(easedT * 100))
      setPlanProgress(progress)
      if (t < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setRingBurst(true)
        setTimeout(() => {
          setPlanPhase('celebration')
          setTimeout(() => setPlanPhase('ready'), 2200)
        }, 600)
      }
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [currentScreen])

  // ─── Countdown en pantalla de registro ───────────────────────────────────
  useEffect(() => {
    if (currentScreen !== 'register') return
    setRegisterCountdown(600)
    const interval = setInterval(() => {
      setRegisterCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [currentScreen])

  // ─── Validación: pantalla 5b — fecha + sexo ──────────────────────────────

  function handleBodyAboutNext() {
    const errors: Record<string, string> = {}

    if (!birthDay || !birthMonth || !birthYear) {
      errors.birth_date = 'Completa tu fecha de nacimiento.'
    } else {
      // Verificar que la fecha resultante es real (ej: no 31 de febrero)
      const dayNum   = parseInt(birthDay, 10)
      const monthNum = parseInt(birthMonth, 10)
      const yearNum  = parseInt(birthYear, 10)
      const date     = new Date(yearNum, monthNum - 1, dayNum)
      const isValid  =
        date.getFullYear() === yearNum &&
        date.getMonth() + 1 === monthNum &&
        date.getDate()      === dayNum

      if (!isValid) {
        errors.birth_date = 'Fecha no válida'
      } else {
        const age = new Date().getFullYear() - yearNum
        if (age < 13 || age > 100) {
          errors.birth_date = 'Debes tener entre 13 y 100 años.'
        } else {
          // Guardar en formato ISO YYYY-MM-DD
          const isoDate = `${yearNum}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
          updateData({ birth_date: isoDate })
        }
      }
    }

    if (!data.biological_sex) errors.biological_sex = 'Selecciona tu sexo biológico.'

    setProfileErrors(errors)
    if (Object.keys(errors).length === 0) nextScreen()
  }

  // ─── Validación: pantalla 5c — peso + altura ──────────────────────────────

  function handleBodyMeasurementsNext() {
    const errors: Record<string, string> = {}

    if (data.weight_unit === 'kg') {
      if (!data.weight_kg || data.weight_kg < 20 || data.weight_kg > 500) {
        errors.weight = 'Ingresa un peso válido (20–500 kg).'
      }
    } else {
      if (!data.weight_lb || data.weight_lb < 44 || data.weight_lb > 1100) {
        errors.weight = 'Ingresa un peso válido (44–1100 lb).'
      }
    }

    if (data.height_unit === 'cm') {
      if (!data.height_cm || data.height_cm < 100 || data.height_cm > 250) {
        errors.height = 'Ingresa una altura válida (100–250 cm).'
      }
    } else {
      if (!data.height_ft || data.height_ft < 3 || data.height_ft > 8) {
        errors.height = 'Ingresa una altura válida.'
      }
    }

    setProfileErrors(errors)
    if (Object.keys(errors).length > 0) return

    // Convertir unidades al sistema métrico antes de avanzar
    let weight_kg = data.weight_kg
    let height_cm = data.height_cm
    if (data.weight_unit === 'lb' && data.weight_lb) weight_kg = lbsToKg(data.weight_lb)
    if (data.height_unit === 'ft') height_cm = ftInToCm(data.height_ft ?? 0, data.height_in ?? 0)

    // Convertir peso objetivo de lb a kg si corresponde
    let target_weight_kg = data.target_weight_kg
    if (data.weight_unit === 'lb' && data.target_weight_kg) {
      target_weight_kg = lbsToKg(data.target_weight_kg)
    }

    // Validar coherencia entre peso actual y peso objetivo
    if (target_weight_kg && weight_kg) {
      if (data.goal === 'lose_weight' && target_weight_kg >= weight_kg) {
        setProfileErrors({ target_weight: 'Tu peso objetivo debe ser menor que tu peso actual para perder peso.' })
        return
      }
      if (data.goal === 'gain_muscle' && target_weight_kg <= weight_kg) {
        setProfileErrors({ target_weight: 'Tu peso objetivo debe ser mayor que tu peso actual para ganar músculo.' })
        return
      }
    }

    updateData({ weight_kg, height_cm, target_weight_kg })
    nextScreen()
  }

  // ─── Calcular objetivos nutricionales para la pantalla "ready" ─────────────

  const nutritionGoals =
    data.weight_kg && data.height_cm && data.birth_date && data.biological_sex && data.activity_level && data.goal
      ? calculateNutritionGoals({
          weight_kg: data.weight_kg,
          height_cm: data.height_cm,
          birth_date: data.birth_date,
          biological_sex: data.biological_sex,
          activity_level: data.activity_level,
          goal: data.goal,
        })
      : null

  // ─── Renderizado de pantallas ─────────────────────────────────────────────

  function renderScreen() {
    switch (currentScreen) {

      // ── 1. Bienvenida ─────────────────────────────────────────────────────
      case 'welcome':
        return (
          <div className="flex-1 flex flex-col justify-between py-2">
            {/* Hero */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-2">
              {/* Nuti + eyebrow */}
              <div className="flex flex-col items-center gap-1">
                <NutriaImage pose="wave" size={120} maxWidth="120px" priority withGlow />
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>
                  Tu asistente de nutrición
                </p>
              </div>

              {/* Headline principal */}
              <div className="space-y-1.5">
                <h1
                  className="font-black leading-none"
                  style={{ color: '#1C1917', fontSize: 34, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.5px' }}
                >
                  Come mejor.<br />
                  <span style={{ color: '#F97316' }}>Sin obsesiones.</span>
                </h1>
                <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#78716C' }}>
                  Tu plan personalizado, adaptado a tu estilo de vida real.
                </p>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2 w-full">
                {[
                  { icon: Camera,    label: 'Escanea tu plato con IA',        sub: 'Instantáneo y preciso' },
                  { icon: BarChart2, label: 'Seguimiento sin complicaciones',  sub: 'Fácil de mantener' },
                  { icon: Sparkles,  label: 'Sin restricciones extremas',      sub: 'Cambios que duran' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left"
                    style={{ background: '#F5F5F4', border: '1px solid #E7E5E4' }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#FFF7ED' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#F97316' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1C1917' }}>{label}</p>
                      <p className="text-xs" style={{ color: '#A8A29E' }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 mt-3"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              ¡Empezamos!
            </button>
          </div>
        )

      // ── 2. Objetivo principal ─────────────────────────────────────────────
      case 'goal':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Cuál es tu objetivo principal?"
                subtitle="Esto nos ayuda a personalizar todo tu plan"
                options={[
                  { value: 'lose_weight',  label: 'Perder peso' },
                  { value: 'maintain',     label: 'Mantener mi peso' },
                  { value: 'gain_muscle',  label: 'Ganar masa muscular' },
                  { value: 'improve_diet', label: 'Mejorar mi alimentación' },
                  { value: 'eat_healthy',  label: 'Comer de forma más saludable' },
                ]}
                value={data.goal_raw}
                onChange={(v) => {
                  // Guardar la selección raw para mostrar el estado visual correcto
                  // y mapear a los valores de la BD
                  const goalMap: Record<string, 'lose_weight' | 'maintain' | 'gain_muscle'> = {
                    lose_weight:  'lose_weight',
                    maintain:     'maintain',
                    gain_muscle:  'gain_muscle',
                    improve_diet: 'maintain',
                    eat_healthy:  'maintain',
                  }
                  updateData({ goal: goalMap[v] ?? 'maintain', goal_raw: v })
                }}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.goal_raw}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 3. Experiencia con la pérdida de peso (solo si goal=lose_weight) ──
      case 'weight-experience':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Tienes experiencia con la pérdida de peso?"
                options={[
                  { value: 'lost_want_more', label: 'He perdido peso y quiero perder más' },
                  { value: 'tried_failed',   label: 'He intentado perder peso, pero sin éxito' },
                  { value: 'lost_regained',  label: 'He perdido peso, pero lo he recuperado' },
                  { value: 'on_medication',  label: 'Estoy tomando medicación (Wegovy, Mounjaro…)' },
                  { value: 'never_tried',    label: 'Es mi primera vez intentándolo' },
                ]}
                value={data.weight_loss_experience}
                onChange={(v) => updateData({ weight_loss_experience: v as typeof data.weight_loss_experience })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.weight_loss_experience}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 4. Historial de dietas (condicional) ──────────────────────────────
      case 'past-diets':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <MultiSelectQuestion
                question="¿Has seguido alguna de estas dietas?"
                subtitle="Selecciona todas las que hayas probado"
                layout="pills"
                options={[
                  { value: 'keto',                label: 'Keto / baja en carbohidratos' },
                  { value: 'intermittent_fasting', label: 'Ayuno intermitente' },
                  { value: 'mediterranean',        label: 'Mediterránea' },
                  { value: 'calorie_counting',     label: 'Conteo de calorías' },
                  { value: 'high_protein',         label: 'Dieta proteica' },
                  { value: 'vegan',                label: 'Vegetariana/vegana' },
                  { value: 'none',                 label: 'Ninguna' },
                ]}
                values={data.past_diets}
                onChange={(v) => updateData({ past_diets: v })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              {data.past_diets.length > 0 ? 'Continuar' : 'Omitir'}
            </button>
          </div>
        )

      // ── 5a. Nombre ────────────────────────────────────────────────────────
      case 'body-name':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              {/* Nuti saludando — Tamaño aumentado */}
              <div className="flex justify-center">
                <NutriaImage pose="wave" size="100%" maxWidth="400px" priority />
              </div>

              <div className="text-center">
                <h2 className="font-bold leading-tight" style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>¿Cómo te llamamos?</h2>
                <p className="text-sm mt-1" style={{ color: '#78716C' }}>Te llamaremos así dentro de la app</p>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A8A29E' }}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  autoComplete="given-name"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all"
                  style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                  onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                  onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                />
              </div>

              {/* Saludo dinámico mientras escribe */}
              {data.name.trim() && (
                <p className="text-center animate-fade-in-up" style={{ color: '#F97316', fontSize: 18, fontWeight: 600 }}>
                  Hola {data.name.trim()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.name.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 5b. Fecha de nacimiento + sexo ────────────────────────────────────
      case 'body-about':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>Tu perfil</p>
              <h2 className="font-bold leading-tight mt-0.5" style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>Cuéntanos sobre ti</h2>
              <p className="text-sm mt-1" style={{ color: '#78716C' }}>Calculamos tu metabolismo con estos datos</p>
            </div>

            {/* Fecha de nacimiento — 3 selects estilizados */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#78716C' }}>
                Fecha de nacimiento
              </label>
              <div className="flex gap-2">
                {/* Día */}
                <div className="relative flex-1">
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-stone-900 outline-none transition-all appearance-none text-center w-full text-sm"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                  >
                    <option value="">Día</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d).padStart(2, '0')}>
                        {String(d).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#A8A29E' }} />
                </div>

                {/* Mes */}
                <div className="relative flex-[1.5]">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-stone-900 outline-none transition-all appearance-none text-center w-full text-sm"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                  >
                    <option value="">Mes</option>
                    {[
                      'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
                    ].map((m, i) => (
                      <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#A8A29E' }} />
                </div>

                {/* Año */}
                <div className="relative flex-[1.2]">
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-stone-900 outline-none transition-all appearance-none text-center w-full text-sm"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                  >
                    <option value="">Año</option>
                    {Array.from(
                      { length: 88 },
                      (_, i) => new Date().getFullYear() - 13 - i
                    ).map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#A8A29E' }} />
                </div>
              </div>

              {profileErrors.birth_date && (
                <p className="mt-1.5 text-xs" style={{ color: '#FBBF24' }}>⚠ {profileErrors.birth_date}</p>
              )}
            </div>

            {/* Sexo biológico */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#78716C' }}>Sexo biológico</label>
              <div className="grid grid-cols-2 gap-3 w-full">
                {/* Hombre */}
                <button
                  type="button"
                  onClick={() => updateData({ biological_sex: 'male' })}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-200 active:scale-95 min-h-[76px]"
                  style={data.biological_sex === 'male' ? {
                    background: '#FFF7ED',
                    border: '1.5px solid rgba(249,115,22,0.5)',
                    boxShadow: '0 0 20px rgba(249,115,22,0.15)',
                  } : {
                    background: '#FFFFFF',
                    border: '1px solid #E7E5E4',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                    <circle cx="15" cy="21" r="9"
                            stroke={data.biological_sex === 'male' ? '#F97316' : '#C8C5C1'}
                            strokeWidth="2.5" fill="none"/>
                    <line x1="21.5" y1="14.5" x2="29" y2="7"
                          stroke={data.biological_sex === 'male' ? '#F97316' : '#C8C5C1'}
                          strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="23" y1="7" x2="29" y2="7"
                          stroke={data.biological_sex === 'male' ? '#F97316' : '#C8C5C1'}
                          strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="29" y1="7" x2="29" y2="13"
                          stroke={data.biological_sex === 'male' ? '#F97316' : '#C8C5C1'}
                          strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm font-medium"
                        style={{ color: data.biological_sex === 'male' ? '#F97316' : '#44403C' }}>
                    Hombre
                  </span>
                </button>

                {/* Mujer */}
                <button
                  type="button"
                  onClick={() => updateData({ biological_sex: 'female' })}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-200 active:scale-95 min-h-[76px]"
                  style={data.biological_sex === 'female' ? {
                    background: '#FFF7ED',
                    border: '1.5px solid rgba(249,115,22,0.5)',
                    boxShadow: '0 0 20px rgba(249,115,22,0.15)',
                  } : {
                    background: '#FFFFFF',
                    border: '1px solid #E7E5E4',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="14" r="9"
                            stroke={data.biological_sex === 'female' ? '#F97316' : '#C8C5C1'}
                            strokeWidth="2.5" fill="none"/>
                    <line x1="18" y1="23" x2="18" y2="31"
                          stroke={data.biological_sex === 'female' ? '#F97316' : '#C8C5C1'}
                          strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="13" y1="27" x2="23" y2="27"
                          stroke={data.biological_sex === 'female' ? '#F97316' : '#C8C5C1'}
                          strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm font-medium"
                        style={{ color: data.biological_sex === 'female' ? '#F97316' : '#44403C' }}>
                    Mujer
                  </span>
                </button>
              </div>
              <p className="mt-2 text-xs text-center" style={{ color: '#A8A29E' }}>
                Solo para calcular tu metabolismo basal
              </p>
              {profileErrors.biological_sex && (
                <p className="mt-1.5 text-xs" style={{ color: '#FBBF24' }}>⚠ {profileErrors.biological_sex}</p>
              )}
            </div>

            </div>
            <button
              type="button"
              onClick={handleBodyAboutNext}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 5c. Peso, altura y peso objetivo ──────────────────────────────────
      case 'body-measurements':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>Tus medidas</p>
              <h2 className="font-bold leading-tight mt-0.5" style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>Tu cuerpo ahora</h2>
              <p className="text-sm mt-1" style={{ color: '#78716C' }}>Solo para calcular tu objetivo calórico</p>
            </div>

            {/* Peso actual */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: '#78716C' }}>
                  <Scale className="w-4 h-4" /> Peso actual
                </label>
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid #E7E5E4' }}>
                  {(['kg', 'lb'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => updateData({ weight_unit: unit })}
                      className="px-3 py-1 transition-colors font-medium"
                      style={{
                        background: data.weight_unit === unit ? '#F97316' : '#F5F5F4',
                        color: data.weight_unit === unit ? '#FFFFFF' : '#44403C',
                        border: `1px solid ${data.weight_unit === unit ? '#F97316' : '#E7E5E4'}`,
                      }}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              {data.weight_unit === 'kg' ? (
                <div className="relative">
                  <input
                    type="number"
                    placeholder="70"
                    value={data.weight_kg ?? ''}
                    onChange={(e) => updateData({ weight_kg: parseFloat(e.target.value) || null })}
                    className="w-full px-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all pr-12"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                    onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                    onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none" style={{ color: '#A8A29E' }}>kg</span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    placeholder="154"
                    value={data.weight_lb ?? ''}
                    onChange={(e) => updateData({ weight_lb: parseFloat(e.target.value) || null })}
                    className="w-full px-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all pr-12"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                    onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                    onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none" style={{ color: '#A8A29E' }}>lb</span>
                </div>
              )}
              {profileErrors.weight && (
                <p className="mt-1.5 text-xs" style={{ color: '#FBBF24' }}>⚠ {profileErrors.weight}</p>
              )}
            </div>

            {/* Altura */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: '#78716C' }}>
                  <Ruler className="w-4 h-4" /> Altura
                </label>
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid #E7E5E4' }}>
                  {(['cm', 'ft'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => updateData({ height_unit: unit })}
                      className="px-3 py-1 transition-colors font-medium"
                      style={{
                        background: data.height_unit === unit ? '#F97316' : '#F5F5F4',
                        color: data.height_unit === unit ? '#FFFFFF' : '#44403C',
                        border: `1px solid ${data.height_unit === unit ? '#F97316' : '#E7E5E4'}`,
                      }}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              {data.height_unit === 'cm' ? (
                <div className="relative">
                  <input
                    type="number"
                    placeholder="170"
                    value={data.height_cm ?? ''}
                    onChange={(e) => updateData({ height_cm: parseFloat(e.target.value) || null })}
                    className="w-full px-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all pr-12"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                    onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                    onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none" style={{ color: '#A8A29E' }}>cm</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="5"
                      value={data.height_ft ?? ''}
                      onChange={(e) => updateData({ height_ft: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all pr-12"
                      style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                      onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                      onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none" style={{ color: '#A8A29E' }}>ft</span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="7"
                      value={data.height_in ?? ''}
                      onChange={(e) => updateData({ height_in: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all pr-12"
                      style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                      onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                      onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none" style={{ color: '#A8A29E' }}>in</span>
                  </div>
                </div>
              )}
              {profileErrors.height && (
                <p className="mt-1.5 text-xs" style={{ color: '#FBBF24' }}>⚠ {profileErrors.height}</p>
              )}
            </div>

            {/* Peso objetivo (solo si goal es lose_weight o gain_muscle) */}
            {(data.goal === 'lose_weight' || data.goal === 'gain_muscle') && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#78716C' }}>
                  Peso objetivo (opcional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder={data.weight_unit === 'lb'
                      ? (data.goal === 'lose_weight' ? '143' : '176')
                      : (data.goal === 'lose_weight' ? '65' : '80')
                    }
                    value={data.target_weight_kg ?? ''}
                    onChange={(e) => updateData({ target_weight_kg: parseFloat(e.target.value) || null })}
                    className="w-full px-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all pr-12"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                    onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                    onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none" style={{ color: '#A8A29E' }}>
                    {data.weight_unit === 'lb' ? 'lb' : 'kg'}
                  </span>
                </div>
                {profileErrors.target_weight ? (
                  <p className="mt-1.5 text-xs" style={{ color: '#FBBF24' }}>⚠ {profileErrors.target_weight}</p>
                ) : (
                  <p className="text-xs mt-1.5 px-1" style={{ color: '#A8A29E' }}>
                    Usaremos esto para calcular tu ritmo de{' '}
                    {data.goal === 'lose_weight' ? 'pérdida' : 'ganancia'} estimado
                  </p>
                )}
              </div>
            )}

            </div>
            <button
              type="button"
              onClick={handleBodyMeasurementsNext}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 6. Nivel de actividad ─────────────────────────────────────────────
      case 'activity-level':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Cuál es tu nivel de actividad diaria?"
                options={[
                  { value: 'sedentary',          label: 'Sedentario',              description: 'Trabajo de oficina, poco movimiento' },
                  { value: 'lightly_active',     label: 'Ligeramente activo',      description: 'Camino algo, trabajo ligero' },
                  { value: 'moderately_active',  label: 'Moderadamente activo',    description: 'Ejercicio 3–4 veces por semana' },
                  { value: 'very_active',        label: 'Muy activo',              description: 'Ejercicio intenso 5–6 veces por semana' },
                  { value: 'extra_active',       label: 'Extremadamente activo',   description: 'Trabajo físico intenso + deporte diario' },
                ]}
                value={data.activity_level}
                onChange={(v) => updateData({ activity_level: v as typeof data.activity_level })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.activity_level}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 7. Educativa: dietas restrictivas ─────────────────────────────────
      case 'education-restrictive-diets':
        return (
          <EducationalScreen
            eyebrow="Lo que dice la ciencia"
            title="Las dietas restrictivas no son la solución"
            text="Los estudios muestran que el 80% de las personas que hacen dietas muy restrictivas recuperan el peso perdido en menos de 2 años. En Nutria creemos en cambios sostenibles, no en restricciones extremas."
            onNext={nextScreen}
            pose="reading"
          />
        )

      // ── 8. Relación con la comida ─────────────────────────────────────────
      case 'food-relationship':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Cómo describirías tu relación con la comida?"
                layout="grid"
                options={[
                  { value: 'healthy',     label: 'Saludable',   description: 'Como lo que me gusta sin sentir culpa' },
                  { value: 'complicated', label: 'Complicada',  description: 'A veces siento culpa o ansiedad al comer' },
                  { value: 'improving',   label: 'Mejorando',   description: 'Estoy trabajando en tener mejor relación' },
                  { value: 'struggling',  label: 'Difícil',     description: 'Me cuesta bastante con la comida' },
                ]}
                value={data.food_relationship}
                onChange={(v) => updateData({ food_relationship: v as typeof data.food_relationship })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.food_relationship}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 9. Desencadenantes de la alimentación ─────────────────────────────
      case 'eating-triggers':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <MultiSelectQuestion
                question="¿Qué suele hacerte comer aunque no tengas hambre?"
                subtitle="Todos tenemos detonantes — conocerlos es el primer paso"
                layout="pills"
                options={[
                  { value: 'nearby_food',        label: 'Tener comida cerca' },
                  { value: 'boredom',            label: 'El aburrimiento' },
                  { value: 'stress',             label: 'El estrés o la ansiedad' },
                  { value: 'sadness',            label: 'La tristeza' },
                  { value: 'seeing_others_eat',  label: 'Ver comer a otras personas' },
                  { value: 'celebration',        label: 'Las celebraciones' },
                  { value: 'tiredness',          label: 'El cansancio' },
                  { value: 'other',              label: 'Otro' },
                ]}
                values={data.eating_triggers}
                onChange={(v) => updateData({ eating_triggers: v })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              {data.eating_triggers.length > 0 ? 'Continuar' : 'Omitir'}
            </button>
          </div>
        )

      // ── 10. Frecuencia de alimentación emocional ──────────────────────────
      case 'emotional-eating':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Con qué frecuencia comes por motivos emocionales?"
                options={[
                  { value: 'never',     label: 'Nunca o casi nunca' },
                  { value: 'rarely',    label: 'Rara vez' },
                  { value: 'sometimes', label: 'A veces' },
                  { value: 'often',     label: 'Con frecuencia' },
                  { value: 'always',    label: 'Muy frecuentemente' },
                ]}
                value={data.emotional_eating_frequency}
                onChange={(v) => updateData({ emotional_eating_frequency: v as typeof data.emotional_eating_frequency })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.emotional_eating_frequency}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 11. Principales retos ─────────────────────────────────────────────
      case 'biggest-challenges':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <MultiSelectQuestion
                question="¿Qué te resulta más difícil?"
                subtitle="Elige hasta 3 opciones que más te identifiquen"
                layout="pills"
                options={[
                  { value: 'cravings',         label: 'Resistir a los antojos' },
                  { value: 'motivation',       label: 'Mantener la motivación' },
                  { value: 'portion_size',     label: 'Controlar las raciones' },
                  { value: 'knowledge',        label: 'Saber qué comer' },
                  { value: 'time',             label: 'Poco tiempo' },
                  { value: 'emotional_eating', label: 'Comer por emociones' },
                  { value: 'social_pressure',  label: 'Presión social' },
                  { value: 'other',            label: 'Otro' },
                ]}
                values={data.biggest_challenges}
                onChange={(v) => updateData({ biggest_challenges: v })}
                maxSelections={3}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              {data.biggest_challenges.length > 0 ? 'Continuar' : 'Omitir'}
            </button>
          </div>
        )

      // ── 12. Educativa: normalización ──────────────────────────────────────
      case 'education-normal':
        return (
          <EducationalScreen
            eyebrow="Sin culpa, sin presión"
            title="¡Es completamente normal!"
            text="Todos tenemos días complicados con la comida. No pasa absolutamente nada — somos humanos. La clave no es la perfección, sino el equilibrio y la consistencia a largo plazo."
            onNext={nextScreen}
            pose="pear"
          />
        )

      // ── 13. Demo IA scanner ───────────────────────────────────────────────
      case 'education-ai-scanner':
        return (
          <div className="flex-1 flex flex-col justify-between py-4">
            <div className="space-y-4">
              {/* Cabecera impactante */}
              <div className="space-y-1 text-center">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>
                  Tecnología IA
                </p>
                <h2 style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>
                  Fotografía tu plato.<br />
                  <span style={{ color: '#F97316' }}>Nuti hace el resto.</span>
                </h2>
                <p className="text-sm" style={{ color: '#78716C' }}>
                  Sin buscar. Sin escribir. Sin adivinar.
                </p>
              </div>

              <AiFoodScanner
                imageSrc="/images/food/food-chicken-ai.jpg"
                foodName="Pollo a la plancha con verduras"
                macros={{ kcal: 380, prot: 42, carbs: 12, fat: 14 }}
                confidence={97}
                detectionDots={[
                  { x: 58, y: 55, label: 'Pollo' },
                  { x: 72, y: 32, label: 'Brócoli' },
                  { x: 28, y: 45, label: 'Pimiento' },
                ]}
              />

              {/* Pills de beneficios */}
              <div className="flex gap-2 flex-wrap justify-center">
                {['30+ nutrientes', 'Instantáneo', '97% precisión'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#FFF7ED', color: '#F97316' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Quiero probarlo
            </button>
          </div>
        )

      // ── 14. Rutina de comidas ─────────────────────────────────────────────
      case 'meals-routine':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>Tu rutina</p>
                <h2 className="font-bold leading-tight mt-0.5" style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>
                  ¿Cómo es tu día<br />con la comida?
                </h2>
              </div>

              {/* Comidas al día — stepper */}
              <div className="rounded-2xl p-4" style={{ background: '#FFF7ED', border: '1px solid rgba(249,115,22,0.2)' }}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#F97316' }}>Comidas al día</p>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => updateData({ meals_per_day: Math.max(1, (data.meals_per_day ?? 3) - 1) })}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold transition-all active:scale-90"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4', color: '#F97316' }}
                  >−</button>
                  <div className="text-center">
                    <span className="font-black" style={{ fontSize: 40, color: '#1C1917', lineHeight: 1 }}>
                      {data.meals_per_day ?? 3}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: '#A8A29E' }}>comidas</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateData({ meals_per_day: Math.min(6, (data.meals_per_day ?? 3) + 1) })}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold transition-all active:scale-90"
                    style={{ background: '#F97316', border: '1px solid #F97316', color: '#FFFFFF' }}
                  >+</button>
                </div>
              </div>

              {/* Chips — 3 preguntas en filas compactas */}
              {([
                {
                  id: 'snacking_frequency',
                  label: 'Picoteo entre horas',
                  value: data.snacking_frequency,
                  onChange: (v: string) => updateData({ snacking_frequency: v as typeof data.snacking_frequency }),
                  options: [
                    { value: 'never', label: 'Nunca' },
                    { value: 'rarely', label: 'Rara vez' },
                    { value: 'sometimes', label: 'A veces' },
                    { value: 'often', label: 'A menudo' },
                    { value: 'always', label: 'Siempre' },
                  ],
                },
                {
                  id: 'cooking_frequency',
                  label: 'Cocino en casa',
                  value: data.cooking_frequency,
                  onChange: (v: string) => updateData({ cooking_frequency: v as typeof data.cooking_frequency }),
                  options: [
                    { value: 'never', label: 'Nunca' },
                    { value: 'rarely', label: 'Rara vez' },
                    { value: 'sometimes', label: 'A veces' },
                    { value: 'often', label: 'A menudo' },
                    { value: 'daily', label: 'Cada día' },
                  ],
                },
                {
                  id: 'eats_out_frequency',
                  label: 'Como fuera de casa',
                  value: data.eats_out_frequency,
                  onChange: (v: string) => updateData({ eats_out_frequency: v as typeof data.eats_out_frequency }),
                  options: [
                    { value: 'never', label: 'Nunca' },
                    { value: 'rarely', label: 'Rara vez' },
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'several_weekly', label: 'Varias/sem' },
                    { value: 'daily', label: 'Diario' },
                  ],
                },
              ] as const).map((field) => (
                <div key={field.id}>
                  <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#F97316' }}>{field.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((opt) => {
                      const isSelected = field.value === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                          style={{
                            background: isSelected ? '#F97316' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#44403C',
                            border: `1px solid ${isSelected ? '#F97316' : '#E7E5E4'}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 mt-4"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 14. Estilo de vida ────────────────────────────────────────────────
      case 'lifestyle':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>Tu estilo de vida</p>
                <h2 className="font-bold leading-tight mt-0.5" style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>
                  ¿Cómo están estos<br />aspectos de tu vida?
                </h2>
                <p className="text-sm mt-1" style={{ color: '#78716C' }}>Influyen directamente en tu energía</p>
              </div>

              {([
                {
                  id: 'water_intake',
                  label: 'Hidratación diaria',
                  value: data.water_intake,
                  onChange: (v: string) => updateData({ water_intake: v as typeof data.water_intake }),
                  options: [
                    { value: 'very_low',  label: 'Muy baja' },
                    { value: 'low',       label: 'Baja' },
                    { value: 'moderate',  label: 'Normal' },
                    { value: 'good',      label: 'Buena' },
                    { value: 'excellent', label: 'Excelente' },
                  ],
                },
                {
                  id: 'sleep_quality',
                  label: 'Calidad del sueño',
                  value: data.sleep_quality,
                  onChange: (v: string) => updateData({ sleep_quality: v as typeof data.sleep_quality }),
                  options: [
                    { value: 'poor',      label: 'Mala' },
                    { value: 'fair',      label: 'Regular' },
                    { value: 'good',      label: 'Buena' },
                    { value: 'excellent', label: 'Excelente' },
                  ],
                },
                {
                  id: 'stress_level',
                  label: 'Nivel de estrés',
                  value: data.stress_level,
                  onChange: (v: string) => updateData({ stress_level: v as typeof data.stress_level }),
                  options: [
                    { value: 'low',       label: 'Bajo' },
                    { value: 'moderate',  label: 'Moderado' },
                    { value: 'high',      label: 'Alto' },
                    { value: 'very_high', label: 'Muy alto' },
                  ],
                },
              ] as const).map((field) => (
                <div key={field.id}>
                  <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: '#F97316' }}>{field.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((opt) => {
                      const isSelected = field.value === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                          style={{
                            background: isSelected ? '#F97316' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#44403C',
                            border: `1px solid ${isSelected ? '#F97316' : '#E7E5E4'}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 mt-4"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 15. Restricciones alimentarias ────────────────────────────────────
      case 'diet-restrictions':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <MultiSelectQuestion
                question="¿Sigues alguna restricción alimentaria?"
                layout="pills"
                options={[
                  { value: 'vegetarian',   label: 'Vegetariano/a' },
                  { value: 'vegan',        label: 'Vegano/a' },
                  { value: 'gluten_free',  label: 'Sin gluten' },
                  { value: 'lactose_free', label: 'Sin lactosa' },
                  { value: 'halal',        label: 'Halal' },
                  { value: 'none',         label: 'Ninguna' },
                ]}
                values={data.diet_restrictions}
                onChange={(v) => updateData({ diet_restrictions: v })}
              />
              {/* Campo de alergias */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#78716C' }}>
                  ¿Tienes alguna alergia alimentaria? (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: frutos secos, marisco..."
                  value={data.allergies.join(', ')}
                  onChange={(e) => {
                    const vals = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    updateData({ allergies: vals })
                  }}
                  className="w-full px-4 py-3 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all text-sm"
                  style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                  onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                  onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              {data.diet_restrictions.length > 0 ? 'Continuar' : 'Omitir'}
            </button>
          </div>
        )

      // ── 16. Objetivos secundarios ─────────────────────────────────────────
      case 'secondary-goals':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <MultiSelectQuestion
                question="¿Qué cambiaría en tu vida si comieras mejor?"
                subtitle="Selecciona todo lo que resuene contigo"
                layout="pills"
                options={[
                  { value: 'more_energy',              label: 'Más energía durante el día' },
                  { value: 'sleep_energy',             label: 'Dormir mejor' },
                  { value: 'body_confidence',          label: 'Sentirme más fuerte y ágil' },
                  { value: 'reduce_stress',            label: 'Menos estrés y ansiedad' },
                  { value: 'look_feel_good',           label: 'Sentirme cómodo/a con mi cuerpo' },
                  { value: 'long_term_health',         label: 'Cuidar mi salud a largo plazo' },
                ]}
                values={data.secondary_goals}
                onChange={(v) => updateData({ secondary_goals: v })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              {data.secondary_goals.length > 0 ? 'Continuar' : 'Omitir'}
            </button>
          </div>
        )

      // ── 17. Compromiso de tiempo ──────────────────────────────────────────
      case 'commitment':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Cómo describirías tu ritmo de vida?"
                subtitle="Ajustaremos Nutria a tu día a día"
                layout="grid"
                options={[
                  { value: '5min',  label: 'Muy ocupado/a',      description: 'Necesito algo rápido y sin complicaciones' },
                  { value: '10min', label: 'Equilibrado/a',      description: 'Tengo algo de tiempo para cuidarme' },
                  { value: '15min', label: 'Comprometido/a',     description: 'Quiero implicarme de verdad' },
                  { value: '30min', label: 'Detallista',         description: 'Me gusta controlar cada aspecto' },
                ]}
                value={data.commitment_time}
                onChange={(v) => updateData({ commitment_time: v as typeof data.commitment_time })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.commitment_time}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 18. Cómo medir el progreso ────────────────────────────────────────
      case 'progress-tracking':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <MultiSelectQuestion
                question="¿Cómo sabrás que Nutria te está funcionando?"
                subtitle="Puedes elegir más de una opción"
                layout="pills"
                options={[
                  { value: 'weight',                    label: 'La báscula se mueve' },
                  { value: 'energy_levels',             label: 'Más energía y vitalidad' },
                  { value: 'health_app',                label: 'Mejoran mis analíticas' },
                  { value: 'clothes_fit',               label: 'La ropa me queda diferente' },
                  { value: 'improve_food_relationship', label: 'Mejor relación con la comida' },
                  { value: 'measurements',              label: 'Veo mis datos mejorar' },
                ]}
                values={data.progress_tracking}
                onChange={(v) => updateData({ progress_tracking: v })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              {data.progress_tracking.length > 0 ? 'Continuar' : 'Omitir'}
            </button>
          </div>
        )

      // ── 19. Situación de convivencia ──────────────────────────────────────
      case 'living-situation':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Con quién vives?"
                subtitle="Tu entorno influye en tus hábitos alimentarios"
                layout="grid"
                options={[
                  { value: 'alone',     label: 'Solo/a' },
                  { value: 'partner',   label: 'Con mi pareja' },
                  { value: 'family',    label: 'Con familia' },
                  { value: 'roommates', label: 'Con compañeros de piso' },
                ]}
                value={data.living_situation}
                onChange={(v) => updateData({ living_situation: v as typeof data.living_situation })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.living_situation}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 20. Apoyo del entorno (solo si no vive solo) ──────────────────────
      case 'household-support':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Tu entorno te apoya en tus objetivos de salud?"
                layout="grid"
                options={[
                  { value: 'very_supportive',     label: 'Mucho, me apoyan activamente' },
                  { value: 'somewhat_supportive', label: 'Algo, pero no del todo' },
                  { value: 'neutral',             label: 'Neutral, ni ayudan ni dificultan' },
                  { value: 'unsupportive',        label: 'No mucho, a veces es difícil' },
                ]}
                value={data.household_support}
                onChange={(v) => updateData({ household_support: v as typeof data.household_support })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.household_support}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 21. Educativa: entorno ────────────────────────────────────────────
      case 'education-environment':
        return (
          <EducationalScreen
            eyebrow="Tu contexto real"
            title="Tu entorno importa más de lo que crees"
            text="Dónde, cómo y con quién vives puede afectar enormemente a tus hábitos alimentarios. Nuti tendrá esto en cuenta para darte consejos adaptados a tu situación real — no a una situación ideal."
            onNext={nextScreen}
            pose="cozy"
          />
        )

      // ── 22. Preferencias de tono de la IA ────────────────────────────────
      case 'ai-preferences':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-5">
              <SingleSelectQuestion
                question="¿Cómo prefieres que te hable Nuti?"
                subtitle="Adaptamos nuestro estilo de comunicación a ti"
                layout="grid"
                options={[
                  { value: 'warm_supportive',    label: 'Cálida y comprensiva',   description: 'Como una amiga de confianza' },
                  { value: 'direct_honest',      label: 'Directa y honesta',      description: 'Sin rodeos, con claridad' },
                  { value: 'coach_motivational', label: 'Motivacional',           description: 'Un coach que te impulsa' },
                  { value: 'scientific',         label: 'Científica',             description: 'Datos y evidencia' },
                ]}
                value={data.ai_tone_preference}
                onChange={(v) => updateData({ ai_tone_preference: v as typeof data.ai_tone_preference })}
              />
            </div>
            <button
              type="button"
              onClick={nextScreen}
              disabled={!data.ai_tone_preference}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              Continuar
            </button>
          </div>
        )

      // ── 23. Screening TCA ─────────────────────────────────────────────────
      case 'tca-screening':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            <div className="space-y-3 [&>*:nth-child(2)]:!mt-0">
              <div className="text-center mb-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#FFF7ED' }}
                >
                  <Heart className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#1C1917' }}>Una pregunta importante</h2>
                <p className="text-sm mt-1" style={{ color: '#78716C' }}>Queremos apoyarte de la mejor manera posible</p>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
              >
                <p className="text-sm leading-relaxed text-center" style={{ color: '#1C1917' }}>
                  ¿Has tenido o tienes alguna relación difícil con la comida o con tu cuerpo?
                  Ya sea preocupación excesiva por comer, restricciones extremas o sentirte mal después de comer.
                </p>
                <p className="text-xs text-center mt-2" style={{ color: '#A8A29E' }}>
                  Esta información nos ayuda a personalizar tu experiencia. Es completamente opcional.
                </p>
              </div>

              <div className="space-y-2.5">
                {([
                  { value: 'no' as const,              label: 'No, me siento bien con la comida', emoji: '😊' },
                  { value: 'yes' as const,             label: 'Sí, ha sido difícil a veces',      emoji: '💛' },
                  { value: 'prefer_not_to_say' as const, label: 'Prefiero no responder',           emoji: '🤐' },
                ]).map((answer) => (
                  <button
                    key={answer.value}
                    type="button"
                    onClick={() => {
                      const flagged = answer.value === 'yes'
                      updateData({ tca_answer: answer.value, tca_flagged: flagged })
                      if (flagged) setShowTcaSupportMessage(true)
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left"
                    style={{
                      background: data.tca_answer === answer.value ? '#FFF7ED' : '#FFFFFF',
                      border: `1px solid ${data.tca_answer === answer.value ? 'rgba(249,115,22,0.4)' : '#E7E5E4'}`,
                    }}
                  >
                    <span className="text-xl flex-shrink-0">{answer.emoji}</span>
                    <span className="text-sm font-medium flex-1" style={{ color: '#1C1917' }}>{answer.label}</span>
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        border: `2px solid ${data.tca_answer === answer.value ? '#F97316' : '#D6D3D1'}`,
                        background: data.tca_answer === answer.value ? '#F97316' : 'transparent',
                      }}
                    >
                      {data.tca_answer === answer.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {showTcaSupportMessage && data.tca_answer === 'yes' && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">💛</span>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#1C1917' }}>Gracias por compartir eso con nosotros</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#57534E' }}>
                        Nuti está aquí para ayudarte a construir una relación más sana con la comida,
                        sin presiones ni juicios. Configuraremos tu experiencia con un enfoque en el
                        bienestar, no en números perfectos.
                      </p>
                      <p className="text-xs mt-2" style={{ color: '#A8A29E' }}>
                        Si crees que necesitas apoyo profesional, te recomendamos hablar con un
                        profesional de salud mental o nutricionista especializado en conducta alimentaria.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={nextScreen}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
              }}
            >
              {data.tca_answer ? 'Continuar' : 'Omitir'}
            </button>
          </div>
        )

      // ── 24. Pantalla final: plan listo ────────────────────────────────────
      case 'ready': {
        const circumference = 2 * Math.PI * 72
        const offset = circumference - (planProgress / 100) * circumference
        const loadingMessage =
          planProgress < 30 ? 'Analizando tu perfil…' :
          planProgress < 60 ? 'Calculando tu metabolismo…' :
          planProgress < 90 ? 'Personalizando tu plan…' :
          '¡Casi listo!'

        return (
          <div className="flex-1 flex flex-col">

            {/* ── Fase 1: animación de progreso ── */}
            {planPhase === 'loading' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
                <div className="relative w-44 h-44">
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }} />
                  <svg width="176" height="176" viewBox="0 0 176 176" className="rotate-[-90deg]">
                    {/* Track */}
                    <circle cx="88" cy="88" r="72" fill="none" stroke="#F0EDE9" strokeWidth="10" />
                    {/* Progress */}
                    <circle
                      cx="88" cy="88" r="72"
                      fill="none"
                      stroke="url(#progressGrad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                    />
                    <defs>
                      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Número central */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-black" style={{ fontSize: 42, color: '#F97316', lineHeight: 1 }}>
                      {planProgress}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#A8A29E' }}>%</span>
                  </div>

                  {/* Burst desde el anillo al llegar a 100% */}
                  {ringBurst && [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180
                    const r = 72 // radio del anillo en px (en el viewBox de 176)
                    // posición de origen en el borde del anillo (dentro del div 176x176)
                    const ox = 88 + r * Math.cos(rad)
                    const oy = 88 + r * Math.sin(rad)
                    const dx = 90 * Math.cos(rad)
                    const dy = 90 * Math.sin(rad)
                    const colors = ['#F97316','#FBBF24','#34D399','#60A5FA','#F43F5E','#A78BFA']
                    return (
                      <div
                        key={deg}
                        className="absolute pointer-events-none rounded-full"
                        style={{
                          width: 18, height: 18,
                          left: ox - 9,
                          top: oy - 9,
                          background: colors[i % colors.length],
                          animation: `burstOut 0.6s ${i * 0.03}s ease-out forwards`,
                          ['--dx' as string]: `${dx}px`,
                          ['--dy' as string]: `${dy}px`,
                        }}
                      />
                    )
                  })}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>Tu plan personalizado</p>
                  <p className="font-semibold text-base" style={{ color: '#1C1917' }}>{loadingMessage}</p>
                </div>
              </div>
            )}

            {/* ── Fase 2: celebración con confetti ── */}
            {planPhase === 'celebration' && (
              <div className="flex-1 relative overflow-hidden" style={{ animation: 'fadeInUp 0.4s ease both' }}>
                {/* Confetti cayendo */}
                {[
                  { left: '8%',  delay: '0s',    dur: '1.8s', color: '#F97316', size: 14, shape: 'round' },
                  { left: '18%', delay: '0.15s', dur: '2.1s', color: '#FBBF24', size: 12, shape: 'square' },
                  { left: '28%', delay: '0.05s', dur: '1.9s', color: '#34D399', size: 11, shape: 'round' },
                  { left: '38%', delay: '0.3s',  dur: '2.3s', color: '#60A5FA', size: 14, shape: 'square' },
                  { left: '50%', delay: '0.1s',  dur: '2.0s', color: '#F97316', size: 16, shape: 'round' },
                  { left: '60%', delay: '0.25s', dur: '1.7s', color: '#FBBF24', size: 13, shape: 'square' },
                  { left: '70%', delay: '0s',    dur: '2.2s', color: '#F43F5E', size: 14, shape: 'round' },
                  { left: '80%', delay: '0.2s',  dur: '1.85s',color: '#34D399', size: 12, shape: 'square' },
                  { left: '90%', delay: '0.35s', dur: '2.05s',color: '#60A5FA', size: 15, shape: 'round' },
                  { left: '14%', delay: '0.4s',  dur: '2.4s', color: '#F43F5E', size: 13, shape: 'square' },
                  { left: '44%', delay: '0.45s', dur: '1.95s',color: '#FBBF24', size: 11, shape: 'round' },
                  { left: '75%', delay: '0.5s',  dur: '2.15s',color: '#F97316', size: 14, shape: 'square' },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="absolute top-0 pointer-events-none z-10"
                    style={{
                      left: p.left,
                      width: p.size,
                      height: p.size,
                      background: p.color,
                      borderRadius: p.shape === 'round' ? '50%' : '3px',
                      animation: `confettiFall ${p.dur} ${p.delay} ease-in forwards, confettiSway ${p.dur} ${p.delay} ease-in-out infinite`,
                    }}
                  />
                ))}

                {/* Nuti a pantalla completa */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-0">
                  <NutriaImage pose="celebration" size="100%" maxWidth="100%" priority />
                </div>

                {/* Texto encima */}
                <div className="absolute top-4 inset-x-0 text-center z-10 space-y-1 px-4">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>¡Enhorabuena!</p>
                  <h2 className="font-black" style={{ color: '#1C1917', fontSize: 30, fontWeight: 900 }}>Tu plan está listo 🎉</h2>
                  <p className="text-sm" style={{ color: '#78716C' }}>Ya te conozco un poco mejor. Esto va a ir bien.</p>
                </div>
              </div>
            )}

            {/* ── Fase 3: plan revelado ── */}
            {planPhase === 'ready' && (
              <div className="flex-1 flex flex-col" style={{ animation: 'fadeInUp 0.5s ease both' }}>
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  <div className="text-center">
                    <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F97316' }}>Plan personalizado</p>
                    <h2 className="font-black mt-0.5" style={{ color: '#1C1917', fontSize: 28, fontWeight: 900 }}>¡Tu plan está listo!</h2>
                    <p className="text-sm mt-1" style={{ color: '#78716C' }}>{nutiMessages.onboarding.complete[0].text}</p>
                  </div>

                  {nutritionGoals && (
                    <>
                      <div className="rounded-[20px] p-5 text-center" style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: '#A8A29E' }}>Tu objetivo diario</p>
                        <p className="font-extrabold leading-none" style={{ color: '#F97316', fontSize: 52 }}>
                          {nutritionGoals.calorie_goal.toLocaleString()}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#A8A29E' }}>kcal · adaptado a ti</p>
                        <div className="my-3" style={{ height: 1, background: 'rgba(249,115,22,0.15)' }} />
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Proteína', value: nutritionGoals.protein_g },
                            { label: 'Carbos',   value: nutritionGoals.carbs_g },
                            { label: 'Grasa',    value: nutritionGoals.fat_g },
                          ].map((m) => (
                            <div key={m.label} className="text-center">
                              <p className="text-base font-bold" style={{ color: '#1C1917' }}>{m.value}g</p>
                              <p className="text-[11px]" style={{ color: '#A8A29E' }}>{m.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}>
                        <p className="text-sm leading-relaxed" style={{ color: '#78716C' }}>
                          Basado en tus datos, tu objetivo y tu nivel de actividad. Nuti ajustará estas cifras según tu progreso real.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="py-3">
                  <button
                    type="button"
                    onClick={nextScreen}
                    className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)', boxShadow: '0 6px 24px rgba(249,115,22,0.4)' }}
                  >
                    Guarda tu plan — es gratis
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      }

      // ── 25. Registro ──────────────────────────────────────────────────────
      case 'register':
        return (
          <div className="flex-1 flex flex-col justify-between py-3">
            {/* Spinner overlay — visible mientras se completa el code exchange de OAuth */}
            {isOAuthLoading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl" style={{ background: 'rgba(13,13,13,0.85)' }}>
                <svg className="animate-spin w-10 h-10 mb-4" style={{ color: '#F97316' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm" style={{ color: '#44403C' }}>Verificando tu cuenta…</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Error OAuth timeout */}
              {oauthError && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>
                  {oauthError}
                </div>
              )}

              {/* Header — countdown urgencia */}
              <div className="text-center space-y-3">
                <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#F97316' }}>
                  Tu plan expira en
                </p>

                {/* Countdown grande */}
                <div className="relative flex items-center justify-center mx-auto" style={{ width: 160, height: 160 }}>
                  {/* Glow pulsante */}
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)' }}
                  />
                  {/* Anillo */}
                  <svg width="160" height="160" viewBox="0 0 160 160" className="absolute inset-0">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#F0EDE9" strokeWidth="6" />
                    <circle
                      cx="80" cy="80" r="70"
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={2 * Math.PI * 70 * (1 - registerCountdown / 600)}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px', transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  {/* Tiempo */}
                  <div className="relative flex flex-col items-center justify-center">
                    <span
                      className="font-black tabular-nums leading-none"
                      style={{ fontSize: 44, color: registerCountdown < 60 ? '#EA580C' : '#F97316', letterSpacing: '-0.02em' }}
                    >
                      {String(Math.floor(registerCountdown / 60)).padStart(2, '0')}:{String(registerCountdown % 60).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-medium mt-0.5" style={{ color: '#A8A29E' }}>min · seg</span>
                  </div>
                </div>

                <div>
                  <h2 className="font-black" style={{ color: '#1C1917', fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
                    Guarda tu plan ahora
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#78716C' }}>Es gratis. Sin tarjeta de crédito.</p>
                </div>
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={isRegistering}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl font-medium text-sm transition-all disabled:opacity-50"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E7E5E4',
                  color: 'white',
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              {/* Separator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <span className="text-xs" style={{ color: '#A8A29E' }}>o</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#78716C' }}>Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isRegistering}
                  className="w-full px-4 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all disabled:opacity-50"
                  style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                  onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                  onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#78716C' }}>Contraseña</label>
                <div className="relative">
                  <input
                    type={registerShowPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isRegistering}
                    className="w-full pl-4 pr-11 py-3.5 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none transition-all disabled:opacity-50"
                    style={{ background: '#FFFFFF', border: '1px solid #E7E5E4' }}
                    onFocus={e => { e.currentTarget.style.borderColor='rgba(249,115,22,0.5)' }}
                    onBlur={e => { e.currentTarget.style.borderColor='#E7E5E4' }}
                  />
                  <button
                    type="button"
                    onClick={() => setRegisterShowPassword(!registerShowPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#A8A29E' }}
                  >
                    {registerShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error / Éxito */}
              {registerError && (
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
                >
                  <p className="text-sm" style={{ color: '#FBBF24' }}>{registerError}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleEmailRegister}
                disabled={isRegistering}
                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                  boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
                }}
              >
                {isRegistering ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creando cuenta…
                  </>
                ) : (
                  'Crear cuenta gratis'
                )}
              </button>
              <p className="text-[11px] text-center leading-relaxed" style={{ color: '#78716C' }}>
                Al registrarte aceptas nuestros{' '}
                <Link href="/terms" className="underline">Términos</Link>
                {' '}y{' '}
                <Link href="/privacy" className="underline">Privacidad</Link>.
              </p>
              <p className="text-xs text-center" style={{ color: '#78716C' }}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-semibold" style={{ color: '#F97316' }}>
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <OnboardingLayout
      currentIndex={currentIndex}
      totalScreens={totalScreens}
      onBack={currentScreen !== 'welcome' ? prevScreen : undefined}
    >
      <div
        key={currentScreen}
        className="flex-1 flex flex-col"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(6px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          animation: 'fadeInUp 0.25s ease both',
        }}
      >
        {renderScreen()}
      </div>
    </OnboardingLayout>
  )
}
