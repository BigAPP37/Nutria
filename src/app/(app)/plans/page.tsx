'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, Lock, Sparkles, Target, Dumbbell, Scale } from 'lucide-react'
import Image from 'next/image'
import { AppHero, AppPage, AppPanel, AppSectionHeader } from '@/components/ui/AppPage'
import { FULL_ACCESS_ENABLED } from '@/lib/fullAccess'

type MealPlan = {
  id: string
  title: string
  description: string
  goal_type: 'lose_weight' | 'maintain' | 'gain_muscle'
  duration_days: number
  target_calories: number
  is_premium: boolean
  is_sample: boolean
}

type UserMealPlan = {
  plan_id: string
  started_at: string
  is_active: boolean
}

const GOAL_META = {
  lose_weight:  { label: 'Pérdida de peso',   icon: Scale,     color: '#F97316', bg: 'rgba(249,115,22,0.08)'  },
  maintain:     { label: 'Mantenimiento',      icon: Target,    color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)'  },
  gain_muscle:  { label: 'Ganancia muscular',  icon: Dumbbell,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
}

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [userPlan, setUserPlan] = useState<UserMealPlan | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [screenError, setScreenError] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()

    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [plansRes, profileRes, userPlanRes] = await Promise.all([
        sb.from('meal_plans').select('*').order('goal_type'),
        sb.from('user_profiles').select('is_premium').eq('id', user.id).maybeSingle(),
        sb.from('user_meal_plans').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
      ])

      const firstError = plansRes.error ?? profileRes.error ?? userPlanRes.error
      if (firstError) {
        setScreenError(firstError.message)
        setLoading(false)
        return
      }

      setPlans(plansRes.data || [])
      setIsPremium(FULL_ACCESS_ENABLED ? true : (profileRes.data?.is_premium ?? false))
      setUserPlan(userPlanRes.data)
      setLoading(false)
    }

    load()
  }, [router])

  const activePlan = plans.find(p => p.id === userPlan?.plan_id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (screenError) {
    return (
      <AppPage>
        <AppPanel className="p-6 text-center">
          <p className="text-sm font-semibold text-stone-700">No pudimos cargar los planes</p>
          <p className="mt-2 text-sm text-stone-500">{screenError}</p>
        </AppPanel>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <AppHero
        eyebrow="Planificación"
        title="Comer bien también necesita estructura."
        description="Planes claros, objetivos visibles y una forma más tranquila de decidir qué toca comer cada día."
        action={
          <div className="hidden h-14 w-14 md:block">
            <div className="relative h-14 w-14">
              <Image src="/nutria-reading.png" alt="Nuti" fill className="object-contain drop-shadow-md" sizes="56px" />
            </div>
          </div>
        }
      >
        <div className="glass-pill inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/82">
          <span className="h-2 w-2 rounded-full bg-amber-200" />
          Menús semanales creados para metas distintas
        </div>
      </AppHero>

      <div className="space-y-6">

        {/* Plan activo */}
        {activePlan && (
          <section>
            <AppSectionHeader
              title="Mi plan activo"
              description="Tu referencia principal para esta semana."
            />
            <div className="mt-3">
              <ActivePlanCard plan={activePlan} startedAt={userPlan!.started_at} onPress={() => router.push(`/plans/${activePlan.id}`)} />
            </div>
          </section>
        )}

        {/* Sin plan todavía */}
        {!activePlan && (
          <section>
            <AppPanel className="flex items-center gap-3 border-dashed p-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#F97316' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-700">Empieza tu primer plan</p>
                <p className="text-xs text-stone-400 mt-0.5">Elige uno de los planes de abajo</p>
              </div>
            </AppPanel>
          </section>
        )}

        {/* Catálogo */}
        <section>
          <AppSectionHeader
            title={plans.length === 0 ? 'Próximamente' : 'Planes disponibles'}
            description="Cada plan deja claro para qué sirve y cuánto exige."
          />

          {plans.length === 0 ? (
            <AppPanel className="p-8 text-center">
              <p className="text-3xl mb-2">🥗</p>
              <p className="text-sm font-medium text-stone-600">Los planes se están preparando</p>
              <p className="text-xs text-stone-400 mt-1">Vuelve pronto</p>
            </AppPanel>
          ) : (
            <div className="mt-3 space-y-3">
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isPremium={isPremium}
                  isActive={plan.id === userPlan?.plan_id}
                  onPress={() => router.push(`/plans/${plan.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Banner premium si no es premium */}
        {!isPremium && plans.some(p => p.is_premium) && (
          <section>
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#1C1917_0%,#2E2019_58%,#3B352B_100%)] p-5 shadow-[0_24px_46px_rgba(28,25,23,0.22)]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Nutria Premium</span>
              </div>
              <p className="text-white text-base font-bold mb-1">Accede a todos los planes</p>
              <p className="text-white/60 text-xs mb-4">Planes completos · Menús personalizados · Recetas con pasos</p>
              <button
                onClick={() => router.push('/premium')}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA6C0A)', color: 'white' }}
              >
                Ver planes Premium
              </button>
            </div>
          </section>
        )}
      </div>
    </AppPage>
  )
}

function ActivePlanCard({ plan, startedAt, onPress }: { plan: MealPlan; startedAt: string; onPress: () => void }) {
  const meta = GOAL_META[plan.goal_type]
  const MetaIcon = meta.icon
  // eslint-disable-next-line react-hooks/purity
  const daysSince = Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1

  return (
    <button
      onClick={onPress}
      className="app-panel w-full flex items-center gap-3 rounded-[1.6rem] border-[1.5px] border-[var(--color-primary-400)] p-4 text-left transition-transform active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
        <MetaIcon className="w-5 h-5" style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-stone-800 truncate">{plan.title}</p>
        <p className="text-xs text-stone-400 mt-0.5">Día {daysSince} de {plan.duration_days}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
    </button>
  )
}

function PlanCard({ plan, isPremium, isActive, onPress }: {
  plan: MealPlan; isPremium: boolean; isActive: boolean; onPress: () => void
}) {
  const meta = GOAL_META[plan.goal_type]
  const MetaIcon = meta.icon
  const locked = plan.is_premium && !isPremium

  return (
    <button
      onClick={onPress}
      className={`app-panel w-full rounded-[1.6rem] p-4 text-left transition-transform active:scale-[0.98] ${
        isActive ? 'border-[var(--color-primary-400)]' : 'border-[var(--line-soft)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: meta.bg }}>
          <MetaIcon className="w-5 h-5" style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-stone-800">{plan.title}</p>
            {locked && <Lock className="h-3 w-3 flex-shrink-0 text-stone-400" />}
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-stone-500">{plan.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            <span className="text-[10px] text-stone-400">{plan.target_calories} kcal/día</span>
            <span className="text-[10px] text-stone-400">{plan.duration_days} días</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-stone-300" />
      </div>
    </button>
  )
}
