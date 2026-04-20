'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getTodayDateKey } from '@/lib/date'
import { ChevronLeft, ChevronRight, Lock, Clock, Flame, Beef, Wheat, Droplets, CheckCircle2, Sparkles, Target, Dumbbell, Scale, ShoppingCart } from 'lucide-react'
import { AppHero, AppPage, AppPanel, AppSectionHeader } from '@/components/ui/AppPage'
import { FULL_ACCESS_ENABLED } from '@/lib/fullAccess'

type Plan = {
  id: string
  title: string
  description: string
  goal_type: string
  duration_days: number
  target_calories: number
  is_premium: boolean
}

type PlanDay = {
  id: string
  day_number: number
  day_label: string
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
}

type Meal = {
  id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  order_index: number
  recipe: {
    id: string
    title: string
    calories_kcal: number
    protein_g: number
    ready_in_min: number
    image_url: string | null
  } | null
}

const GOAL_META = {
  lose_weight: { label: 'Pérdida de peso', icon: Scale, color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
  maintain: { label: 'Mantenimiento', icon: Target, color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)' },
  gain_muscle: { label: 'Ganancia muscular', icon: Dumbbell, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
} as const

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}
const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
}

export default function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params)
  const router = useRouter()

  const [plan, setPlan] = useState<Plan | null>(null)
  const [days, setDays] = useState<PlanDay[]>([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [meals, setMeals] = useState<Meal[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [isActivePlan, setIsActivePlan] = useState(false)
  const [isActivatingPlan, setIsActivatingPlan] = useState(false)
  const [activationError, setActivationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mealsLoading, setMealsLoading] = useState(false)
  const [screenError, setScreenError] = useState<string | null>(null)

  // Cargar plan + días + perfil
  useEffect(() => {
    const sb = createClient()
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [planRes, daysRes, profileRes, userPlanRes] = await Promise.all([
        sb.from('meal_plans').select('*').eq('id', planId).maybeSingle(),
        sb.from('meal_plan_days').select('*').eq('plan_id', planId).order('day_number'),
        sb.from('user_profiles').select('is_premium').eq('id', user.id).maybeSingle(),
        sb.from('user_meal_plans').select('plan_id').eq('user_id', user.id).eq('plan_id', planId).eq('is_active', true).maybeSingle(),
      ])

      const firstError = planRes.error ?? daysRes.error ?? profileRes.error ?? userPlanRes.error
      if (firstError) {
        setScreenError(firstError.message)
        setLoading(false)
        return
      }

      setPlan(planRes.data)
      setDays(daysRes.data || [])
      setIsPremium(FULL_ACCESS_ENABLED ? true : (profileRes.data?.is_premium ?? false))
      setIsActivePlan(!!userPlanRes.data)
      setLoading(false)
    }
    load()
  }, [planId, router])

  // Cargar comidas del día seleccionado
  useEffect(() => {
    if (!days.length) return
    const selectedPlanDay = days.find(d => d.day_number === selectedDay)
    if (!selectedPlanDay) return
    const dayId = selectedPlanDay.id

    const sb = createClient()

    async function fetchMeals() {
      setMealsLoading(true)
      const { data, error } = await sb.from('meal_plan_meals')
        .select('id, meal_type, order_index, recipe:recipes(id, title, calories_kcal, protein_g, ready_in_min, image_url)')
        .eq('day_id', dayId)
        .order('order_index')
      if (error) {
        setScreenError(error.message)
        setMealsLoading(false)
        return
      }
      setMeals((data as unknown as Meal[]) || [])
      setMealsLoading(false)
    }

    fetchMeals()
  }, [selectedDay, days])

  async function handleActivatePlan() {
    const sb = createClient()
    if (!plan || isActivatingPlan) return

    setIsActivatingPlan(true)
    setActivationError(null)

    let activationError: { message?: string } | null = null

    if (FULL_ACCESS_ENABLED) {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        setActivationError('Necesitas iniciar sesión para activar el plan.')
        setIsActivatingPlan(false)
        return
      }

      const deactivateRes = await sb
        .from('user_meal_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('plan_id', plan.id)

      if (deactivateRes.error) {
        activationError = deactivateRes.error
      } else {
        const upsertRes = await sb
          .from('user_meal_plans')
          .upsert(
            {
              user_id: user.id,
              plan_id: plan.id,
              started_at: getTodayDateKey(),
              is_active: true,
            },
            { onConflict: 'user_id,plan_id' }
          )

        activationError = upsertRes.error
      }
    } else {
      const rpcRes = await sb.rpc('activate_meal_plan_atomic', {
        p_plan_id: plan.id,
        p_started_at: getTodayDateKey(),
      })
      activationError = rpcRes.error
    }

    if (activationError) {
      setActivationError('No pudimos activar el plan. Inténtalo de nuevo.')
      setIsActivatingPlan(false)
      return
    }

    setIsActivePlan(true)
    setIsActivatingPlan(false)
  }

  if (loading || !plan) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (screenError) {
    return (
      <AppPage>
        <AppPanel className="p-6 text-center">
          <p className="text-sm font-semibold text-stone-700">No pudimos cargar este plan</p>
          <p className="mt-2 text-sm text-stone-500">{screenError}</p>
        </AppPanel>
      </AppPage>
    )
  }

  const currentDay = days.find(d => d.day_number === selectedDay)
  const locked = plan.is_premium && !isPremium
  const goalMeta = GOAL_META[(plan.goal_type as keyof typeof GOAL_META) ?? 'maintain'] ?? GOAL_META.maintain
  const GoalIcon = goalMeta.icon
  const visibleDays = locked ? days.filter((day) => day.day_number === 1) : days

  return (
    <AppPage>
      <AppHero
        eyebrow="Plan semanal"
        title={plan.title}
        description={plan.description}
        action={
          <div className="hidden h-14 w-14 md:block">
            <div className="relative h-14 w-14">
              <Image src="/nutria-reading.png" alt="Nuti" fill className="object-contain drop-shadow-md" sizes="56px" />
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.back()}
            className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/86 transition-transform active:scale-[0.98]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Volver a dietas
          </button>
          <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/86">
            <GoalIcon className="h-3.5 w-3.5" />
            {goalMeta.label}
          </span>
          <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/86">
            <Flame className="h-3.5 w-3.5" />
            {plan.target_calories} kcal/día
          </span>
          <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/86">
            <Clock className="h-3.5 w-3.5" />
            {plan.duration_days} días
          </span>
          {isActivePlan && (
            <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/86">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Plan activo
            </span>
          )}
        </div>
      </AppHero>

      <div className="space-y-6">
        {!locked && (
          <section>
            <button
              onClick={() => router.push(`/plans/${planId}/shopping-list`)}
              className="flex w-full items-center justify-between rounded-[1.5rem] px-4 py-3.5 transition-all active:scale-[0.99]"
              style={{ background: 'white', border: '1px solid #F0EDE9' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: 'rgba(249,115,22,0.08)' }}>
                  <ShoppingCart className="h-4 w-4" style={{ color: '#F97316' }} />
                </div>
                <span className="text-sm font-semibold text-stone-800">Lista de la compra</span>
              </div>
              <ChevronRight className="h-4 w-4 text-stone-300" />
            </button>
          </section>
        )}
        {!isActivePlan && !locked && (
          <section>
            <AppPanel className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(249,115,22,0.12)' }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: '#F97316' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800">Listo para empezar</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                    Activa este plan para usarlo como referencia diaria.
                  </p>
                </div>
              </div>
              <button
                onClick={handleActivatePlan}
                disabled={isActivatingPlan}
                className="mt-4 w-full rounded-2xl py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                style={{
                  background: isActivatingPlan ? '#FDBA74' : 'linear-gradient(135deg, #F97316, #EA6C0A)',
                  boxShadow: isActivatingPlan ? 'none' : '0 10px 24px rgba(249,115,22,0.24)',
                }}
              >
                {isActivatingPlan ? 'Activando...' : 'Empezar este plan'}
              </button>
              {activationError ? <p className="mt-2 text-sm text-amber-600">{activationError}</p> : null}
            </AppPanel>
          </section>
        )}

        {locked && (
          <section>
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#1C1917_0%,#2E2019_58%,#3B352B_100%)] p-5 shadow-[0_24px_46px_rgba(28,25,23,0.22)]">
              <div className="mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Plan premium</span>
              </div>
              <p className="text-base font-bold text-white">Este plan se desbloquea con Premium</p>
              <p className="mt-1 text-xs text-white/62">Verás la semana completa, las recetas y el detalle de cada día.</p>
              <button
                onClick={() => router.push('/premium')}
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA6C0A)' }}
              >
                Ver premium
              </button>
            </div>
          </section>
        )}

        {visibleDays.length > 0 && (
          <section>
            <AppSectionHeader
              title="Semana"
              description={locked ? 'Puedes explorar el primer día del plan antes de desbloquearlo.' : 'Muévete por los días para ver el menú y el reparto previsto.'}
            />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {visibleDays.map(day => {
                const isSelected = day.day_number === selectedDay

                return (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.day_number)}
                    className="flex min-w-[78px] flex-shrink-0 flex-col items-center gap-1 rounded-[1.25rem] px-4 py-3 transition-transform active:scale-[0.98]"
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #F59C62 0%, #E77D47 100%)' : '#FFFFFF',
                      border: `1px solid ${isSelected ? 'rgba(231,125,71,0.25)' : '#F0EDE9'}`,
                      boxShadow: isSelected ? '0 14px 28px rgba(231,125,71,0.18)' : 'var(--shadow-card)',
                    }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: isSelected ? 'rgba(255,255,255,0.72)' : '#B0AAA2' }}>
                      {day.day_label?.split('·')[1]?.trim() || 'día'}
                    </span>
                    <span className="text-base font-black" style={{ color: isSelected ? '#FFFDF7' : '#292524' }}>
                      {day.day_number}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {currentDay && (
          <section>
            <AppSectionHeader
              title={currentDay.day_label || `Día ${selectedDay}`}
              description="Vista rápida del reparto nutricional del día."
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { icon: Flame, label: 'Energía', val: currentDay.total_calories, suffix: 'kcal', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
                { icon: Beef, label: 'Proteína', val: currentDay.total_protein_g, suffix: 'g', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
                { icon: Wheat, label: 'Carbos', val: currentDay.total_carbs_g, suffix: 'g', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
                { icon: Droplets, label: 'Grasa', val: currentDay.total_fat_g, suffix: 'g', color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
              ].map(({ icon: Icon, label, val, suffix, color, bg }) => (
                <AppPanel key={label} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: bg }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">{label}</p>
                      <p className="mt-1 text-lg font-black text-stone-800">
                        {val}
                        <span className="ml-1 text-sm font-semibold text-stone-400">{suffix}</span>
                      </p>
                    </div>
                  </div>
                </AppPanel>
              ))}
            </div>
          </section>
        )}

        <section>
          <AppSectionHeader
            title="Comidas del día"
            description="Cada bloque abre la receta y sus detalles."
          />

          {mealsLoading ? (
            <div className="mt-3 space-y-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-24 animate-pulse rounded-[1.5rem] bg-white" style={{ border: '1px solid #F0EDE9' }} />
              ))}
            </div>
          ) : meals.length === 0 ? (
            <AppPanel className="mt-3 p-8 text-center">
              <p className="mb-2 text-3xl">🥗</p>
              <p className="text-sm font-medium text-stone-600">Todavía no hay comidas cargadas para este día</p>
            </AppPanel>
          ) : (
            <div className="mt-3 space-y-3">
              {meals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onPress={() => meal.recipe && router.push(`/plans/${planId}/recipe/${meal.recipe.id}?meal=${meal.meal_type}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppPage>
  )
}

function MealCard({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  const recipe = meal.recipe
  return (
    <button
      onClick={onPress}
      className="app-panel w-full rounded-[1.5rem] p-3 text-left transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-18 w-18 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] bg-[rgba(249,115,22,0.06)]">
          {recipe?.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              unoptimized
              className="object-cover"
              sizes="72px"
            />
          ) : (
            <span className="text-2xl">{MEAL_EMOJI[meal.meal_type] || '🍽️'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ background: 'rgba(249,115,22,0.08)', color: '#F97316' }}
            >
              {MEAL_LABELS[meal.meal_type]}
            </span>
          </div>
          <p className="line-clamp-2 text-sm font-bold leading-snug text-stone-800">
            {recipe?.title || 'Sin receta'}
          </p>
          <div className="mt-2 flex items-center gap-3">
            {recipe?.calories_kcal ? (
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Flame className="h-3 w-3" style={{ color: '#F97316' }} />
                {Math.round(recipe.calories_kcal)} kcal
              </span>
            ) : null}
            {recipe?.ready_in_min ? (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Clock className="h-3 w-3" />
                {recipe.ready_in_min} min
              </span>
            ) : null}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 flex-shrink-0 text-stone-300" />
      </div>
    </button>
  )
}
