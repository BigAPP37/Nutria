'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut, Scale, Target, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useTdeeState } from '@/hooks/useTdeeState'
import type { UserProfile } from '@/types/database'

// Monetización Premium
import { usePremiumStatus } from '@/hooks/usePremiumStatus'
import { usePremiumStore } from '@/stores/premiumStore'
import { PremiumSettingsCard } from '@/components/premium/PremiumSettingsCard'

const GOAL_LABELS: Record<UserProfile['goal'], string> = {
  lose_weight:   'Perder peso',
  maintain:      'Mantener peso',
  gain_muscle:   'Ganar músculo',
}

const ACTIVITY_LABELS: Record<UserProfile['activity_level'], string> = {
  sedentary:          'Sedentario',
  lightly_active:     'Ligeramente activo',
  moderately_active:  'Moderadamente activo',
  very_active:        'Muy activo',
  extra_active:       'Extremadamente activo',
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {children}
      </div>
    </section>
  )
}

// ── Row inside a section ─────────────────────────────────────────────────────
function Row({
  label,
  value,
  onClick,
}: {
  label: string
  value?: string | null
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-stone-50 last:border-0 text-left ${
        onClick ? 'hover:bg-stone-50 active:bg-stone-100 transition-colors' : 'cursor-default'
      }`}
    >
      <span className="text-sm text-stone-700">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-stone-400">{value}</span>}
        {onClick && <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />}
      </div>
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  // Weight entry modal
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [isSavingWeight, setIsSavingWeight] = useState(false)
  const [weightError, setWeightError] = useState<string | null>(null)

  // Goals modal
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [calorieGoal, setCalorieGoal] = useState('2000')
  const [proteinGoal, setProteinGoal] = useState('150')
  const [carbsGoal, setCarbsGoal] = useState('250')
  const [fatGoal, setFatGoal] = useState('65')
  const [isSavingGoals, setIsSavingGoals] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setEmail(user.email ?? null)
    })
  }, [router])

  const { data: tdeeState } = useTdeeState(userId)

  // Pre-poblar inputs de objetivos cuando carguen los datos del usuario
  useEffect(() => {
    if (!tdeeState) return
    setCalorieGoal(String(tdeeState.goal_kcal))
    setProteinGoal(String(tdeeState.macro_targets.protein_g))
    setCarbsGoal(String(tdeeState.macro_targets.carbs_g))
    setFatGoal(String(tdeeState.macro_targets.fat_g))
  }, [tdeeState])

  // Estado Premium del usuario — sincroniza el store global al cargar
  const { data: premiumData } = usePremiumStatus(userId)
  const { isPremium } = usePremiumStore()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleSaveWeight() {
    const useLb = profile?.unit_weight === 'lb'
    const value = parseFloat(weightInput)

    if (useLb) {
      if (!value || value < 44 || value > 660) {
        setWeightError('Introduce un peso válido (44–660 lb)')
        return
      }
    } else {
      if (!value || value < 20 || value > 300) {
        setWeightError('Introduce un peso válido (20–300 kg)')
        return
      }
    }
    if (!userId) return

    const weight_kg = useLb ? value * 0.453592 : value

    setWeightError(null)
    setIsSavingWeight(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('weight_entries').insert({
        user_id:     userId,
        weight_kg:   Math.round(weight_kg * 100) / 100,
        recorded_at: new Date().toISOString(),
        notes:       null,
      })
      if (error) { setWeightError('Error al guardar. Intenta de nuevo.'); return }
      setShowWeightModal(false)
      setWeightInput('')
    } finally {
      setIsSavingWeight(false)
    }
  }

  async function handleSaveGoals() {
    if (!userId) return
    setIsSavingGoals(true)
    try {
      const supabase = createClient()
      await supabase.from('user_tdee_state').upsert(
        {
          user_id: userId,
          goal_kcal: parseInt(calorieGoal, 10),
          macro_protein_g: parseInt(proteinGoal, 10),
          macro_carbs_g: parseInt(carbsGoal, 10),
          macro_fat_g: parseInt(fatGoal, 10),
        },
        { onConflict: 'user_id' }
      )
      await queryClient.invalidateQueries({ queryKey: ['tdeeState', userId] })
      setShowGoalsModal(false)
    } finally {
      setIsSavingGoals(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-stone-900">Ajustes</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">

        {/* ── Suscripción Premium ── */}
        {userId && (
          <section>
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-2 px-1">
              Suscripción
            </p>
            <PremiumSettingsCard
              isPremium={isPremium}
              premiumExpiresAt={premiumData?.premiumExpiresAt ?? null}
              subscriptionStatus={premiumData?.subscriptionStatus ?? 'free'}
            />
          </section>
        )}

        {/* ── Perfil ── */}
        <Section title="Perfil">
          <Row label="Nombre"     value={profile?.display_name ?? '—'} />
          <Row label="Email"      value={email ?? '—'} />
          <Row
            label="Objetivo"
            value={profile?.goal ? GOAL_LABELS[profile.goal] : '—'}
          />
          <Row
            label="Actividad"
            value={profile?.activity_level ? ACTIVITY_LABELS[profile.activity_level] : '—'}
          />
        </Section>

        {/* ── Seguimiento ── */}
        <Section title="Seguimiento">
          <Row
            label="Registrar peso"
            onClick={() => { setWeightInput(''); setWeightError(null); setShowWeightModal(true) }}
          />
          <Row
            label="Editar objetivos calóricos"
            onClick={() => setShowGoalsModal(true)}
          />
        </Section>

        {/* ── Cuenta ── */}
        <Section title="Cuenta">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 active:bg-stone-100 transition-colors"
          >
            <LogOut className="w-4 h-4 text-stone-500" />
            <span className="text-sm text-stone-600 font-medium">Cerrar sesión</span>
          </button>
        </Section>

        {/* ── Legal ── */}
        <Section title="Legal">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3.5 border-b border-stone-50 hover:bg-stone-50 transition-colors"
          >
            <span className="text-sm text-stone-700">Política de privacidad</span>
            <ExternalLink className="w-4 h-4 text-stone-300" />
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors"
          >
            <span className="text-sm text-stone-700">Términos de uso</span>
            <ExternalLink className="w-4 h-4 text-stone-300" />
          </a>
        </Section>

        <p className="text-center text-[11px] text-stone-300 pb-4">Nutria v1.0</p>
      </main>

      {/* ══ Modal: registrar peso ══ */}
      {showWeightModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowWeightModal(false) }}
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <p className="text-base font-bold text-stone-900">Registrar peso</p>
                <p className="text-xs text-stone-400">Se guarda con la fecha y hora actual</p>
              </div>
            </div>

            <div className="relative">
              <input
                autoFocus
                type="number"
                min={profile?.unit_weight === 'lb' ? '44' : '20'}
                max={profile?.unit_weight === 'lb' ? '660' : '300'}
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={profile?.unit_weight === 'lb' ? '155' : '70.5'}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-2xl font-bold text-stone-900 text-center placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                {profile?.unit_weight === 'lb' ? 'lb' : 'kg'}
              </span>
            </div>

            {weightError && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">{weightError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveWeight}
                disabled={isSavingWeight || !weightInput.trim()}
                className="flex-1 py-3 rounded-2xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {isSavingWeight ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: objetivos ══ */}
      {showGoalsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGoalsModal(false) }}
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-base font-bold text-stone-900">Objetivos diarios</p>
                <p className="text-xs text-stone-400">Ajusta tus metas de nutrición</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Calorías (kcal)', value: calorieGoal, onChange: setCalorieGoal, color: 'focus:ring-orange-400' },
                { label: 'Proteína (g)',    value: proteinGoal, onChange: setProteinGoal, color: 'focus:ring-sky-400' },
                { label: 'Carbohidratos (g)', value: carbsGoal, onChange: setCarbsGoal, color: 'focus:ring-amber-400' },
                { label: 'Grasa (g)',       value: fatGoal,     onChange: setFatGoal,    color: 'focus:ring-rose-400' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs text-stone-500 mb-1">{f.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className={`w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 ${f.color} focus:border-transparent`}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowGoalsModal(false)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGoals}
                disabled={isSavingGoals}
                className="flex-1 py-3 rounded-2xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {isSavingGoals ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
