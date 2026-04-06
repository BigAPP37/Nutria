'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Lock, Clock, Flame, Beef, Wheat, Droplets, CheckCircle2 } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [mealsLoading, setMealsLoading] = useState(false)

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
        sb.from('user_meal_plans').select('plan_id').eq('user_id', user.id).eq('plan_id', planId).maybeSingle(),
      ])

      setPlan(planRes.data)
      setDays(daysRes.data || [])
      setIsPremium(profileRes.data?.is_premium ?? false)
      setIsActivePlan(!!userPlanRes.data)
      setLoading(false)
    }
    load()
  }, [planId, router])

  // Cargar comidas del día seleccionado
  useEffect(() => {
    if (!days.length) return
    const day = days.find(d => d.day_number === selectedDay)
    if (!day) return

    const sb = createClient()

    async function fetchMeals() {
      setMealsLoading(true)
      const { data } = await sb.from('meal_plan_meals')
        .select('id, meal_type, order_index, recipe:recipes(id, title, calories_kcal, protein_g, ready_in_min, image_url)')
        .eq('day_id', day.id)
        .order('order_index')
      setMeals((data as unknown as Meal[]) || [])
      setMealsLoading(false)
    }

    fetchMeals()
  }, [selectedDay, days])

  async function handleActivatePlan() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user || !plan) return

    // Desactivar cualquier plan activo anterior antes de activar el nuevo
    await sb.from('user_meal_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    await sb.from('user_meal_plans')
      .upsert(
        { user_id: user.id, plan_id: plan.id, started_at: new Date().toISOString().split('T')[0], is_active: true },
        { onConflict: 'user_id,plan_id' }
      )
    setIsActivePlan(true)
  }

  if (loading || !plan) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  const currentDay = days.find(d => d.day_number === selectedDay)
  const locked = plan.is_premium && !isPremium

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div
        className="relative px-4 pt-12 pb-6"
        style={{ background: 'linear-gradient(160deg, #F97316 0%, #EA6C0A 100%)' }}
      >
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/80 mb-4 active:opacity-70">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Dietas</span>
        </button>
        <h1 className="text-white text-xl font-black leading-tight">{plan.title}</h1>
        <p className="text-white/75 text-xs mt-1 leading-relaxed">{plan.description}</p>

        {/* Macro resumen */}
        <div className="flex gap-3 mt-4">
          {[
            { icon: Flame,    val: `${plan.target_calories}`, unit: 'kcal' },
            { icon: Beef,     val: `${plan.duration_days}`,   unit: 'días' },
          ].map(({ icon: Icon, val, unit }) => (
            <div key={unit} className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <Icon className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-bold">{val}</span>
              <span className="text-white/70 text-xs">{unit}</span>
            </div>
          ))}
          {isActivePlan && (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-bold">Plan activo</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Botón activar plan */}
        {!isActivePlan && !locked && (
          <button
            onClick={handleActivatePlan}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA6C0A)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}
          >
            Empezar este plan
          </button>
        )}

        {/* Paywall */}
        {locked && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1C1917, #292524)' }}
          >
            <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-bold">Plan Premium</p>
              <p className="text-white/60 text-xs mt-0.5">Hazte premium para ver todos los días y recetas</p>
            </div>
            <button
              onClick={() => router.push('/premium')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: '#F97316', color: 'white' }}
            >
              Ver
            </button>
          </div>
        )}

        {/* Selector de días */}
        {days.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">Semana</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {days.map(day => {
                const isSelected = day.day_number === selectedDay
                const isDayLocked = locked && day.day_number > 1
                return (
                  <button
                    key={day.id}
                    onClick={() => !isDayLocked && setSelectedDay(day.day_number)}
                    className="flex-shrink-0 flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2.5 transition-all active:scale-95"
                    style={{
                      background: isSelected ? '#F97316' : 'white',
                      border: `1px solid ${isSelected ? '#F97316' : '#F0EDE9'}`,
                      minWidth: 64,
                      opacity: isDayLocked ? 0.5 : 1,
                    }}
                  >
                    <span className="text-[10px] font-medium" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#A8A29E' }}>
                      {day.day_label?.split('·')[1]?.trim() || `Día ${day.day_number}`}
                    </span>
                    <span className="text-sm font-black" style={{ color: isSelected ? 'white' : '#292524' }}>
                      {day.day_number}
                    </span>
                    {isDayLocked && <Lock className="w-3 h-3" style={{ color: isSelected ? 'white' : '#A8A29E' }} />}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Macros del día */}
        {currentDay && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Flame,   label: 'kcal',    val: currentDay.total_calories,        color: '#F97316' },
              { icon: Beef,    label: 'proteína', val: `${currentDay.total_protein_g}g`, color: '#10B981' },
              { icon: Wheat,   label: 'carbos',   val: `${currentDay.total_carbs_g}g`,  color: '#F59E0B' },
              { icon: Droplets,label: 'grasa',    val: `${currentDay.total_fat_g}g`,    color: '#6366F1' },
            ].map(({ icon: Icon, label, val, color }) => (
              <div key={label} className="rounded-xl bg-white p-2.5 text-center" style={{ border: '1px solid #F0EDE9' }}>
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <p className="text-sm font-black text-stone-800">{val}</p>
                <p className="text-[9px] text-stone-400 uppercase">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Comidas del día */}
        <section>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">
            {currentDay?.day_label || 'Comidas'}
          </p>

          {mealsLoading ? (
            <div className="space-y-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="rounded-2xl bg-white h-20 animate-pulse" style={{ border: '1px solid #F0EDE9' }} />
              ))}
            </div>
          ) : meals.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center" style={{ border: '1px solid #F0EDE9' }}>
              <p className="text-2xl mb-1">🥗</p>
              <p className="text-sm text-stone-500">Sin comidas para este día</p>
            </div>
          ) : (
            <div className="space-y-3">
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
    </div>
  )
}

function MealCard({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  const recipe = meal.recipe
  return (
    <button
      onClick={onPress}
      className="w-full rounded-2xl bg-white flex items-center gap-3 p-3 text-left active:scale-[0.98] transition-transform"
      style={{ border: '1px solid #F0EDE9' }}
    >
      {/* Imagen o emoji */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-stone-50">
        {recipe?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{MEAL_EMOJI[meal.meal_type] || '🍽️'}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#F97316' }}>
          {MEAL_LABELS[meal.meal_type]}
        </p>
        <p className="text-sm font-bold text-stone-800 leading-snug line-clamp-2">
          {recipe?.title || 'Sin receta'}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          {recipe?.calories_kcal && (
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <Flame className="w-3 h-3" style={{ color: '#F97316' }} />
              {Math.round(recipe.calories_kcal)} kcal
            </span>
          )}
          {recipe?.ready_in_min && (
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recipe.ready_in_min} min
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
    </button>
  )
}
