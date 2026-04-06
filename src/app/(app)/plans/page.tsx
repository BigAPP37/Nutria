'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, Lock, Sparkles, Target, Dumbbell, Scale } from 'lucide-react'
import Image from 'next/image'

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

      setPlans(plansRes.data || [])
      setIsPremium(profileRes.data?.is_premium ?? false)
      setUserPlan(userPlanRes.data)
      setLoading(false)
    }

    load()
  }, [router])

  const activePlan = plans.find(p => p.id === userPlan?.plan_id)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(160deg, #F97316 0%, #EA6C0A 100%)' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Nutrición</p>
            <h1 className="text-white text-2xl font-black leading-tight">Planes de dieta</h1>
            <p className="text-white/80 text-sm mt-1">Menús semanales creados por dietistas</p>
          </div>
          <div className="w-14 h-14 relative">
            <Image src="/nutria-reading.png" alt="Nuti" fill className="object-contain drop-shadow-md" sizes="56px" />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Plan activo */}
        {activePlan && (
          <section>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Mi plan activo</p>
            <ActivePlanCard plan={activePlan} startedAt={userPlan!.started_at} onPress={() => router.push(`/plans/${activePlan.id}`)} />
          </section>
        )}

        {/* Sin plan todavía */}
        {!activePlan && (
          <section>
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(249,115,22,0.07)', border: '1px dashed rgba(249,115,22,0.35)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#F97316' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-700">Empieza tu primer plan</p>
                <p className="text-xs text-stone-400 mt-0.5">Elige uno de los planes de abajo</p>
              </div>
            </div>
          </section>
        )}

        {/* Catálogo */}
        <section>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">
            {plans.length === 0 ? 'Próximamente' : 'Planes disponibles'}
          </p>

          {plans.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center" style={{ border: '1px solid #F0EDE9' }}>
              <p className="text-3xl mb-2">🥗</p>
              <p className="text-sm font-medium text-stone-600">Los planes se están preparando</p>
              <p className="text-xs text-stone-400 mt-1">Vuelve pronto</p>
            </div>
          ) : (
            <div className="space-y-3">
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
            <div
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)' }}
            >
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
    </div>
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
      className="w-full rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      style={{ background: 'white', border: '1.5px solid #F97316', boxShadow: '0 2px 12px rgba(249,115,22,0.15)' }}
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
      className="w-full rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      style={{ background: 'white', border: `1px solid ${isActive ? '#F97316' : '#F0EDE9'}` }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
        <MetaIcon className="w-5 h-5" style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-bold text-stone-800 truncate">{plan.title}</p>
          {locked && <Lock className="w-3 h-3 text-stone-400 flex-shrink-0" />}
        </div>
        <p className="text-xs text-stone-500 leading-snug line-clamp-2">{plan.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[10px] text-stone-400">{plan.target_calories} kcal/día</span>
          <span className="text-[10px] text-stone-400">{plan.duration_days} días</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
    </button>
  )
}
