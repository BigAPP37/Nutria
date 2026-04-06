// Pantalla de Progreso — orquesta todos los componentes y hooks de estadísticas
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

// Hooks de datos
import { useTdeeState } from '@/hooks/useTdeeState'
import { useWeeklySnapshots } from '@/hooks/useWeeklySnapshots'
import { useWeightHistory } from '@/hooks/useWeightHistory'
import { useStreakDays } from '@/hooks/useStreakDays'
import { useMacroAverages } from '@/hooks/useMacroAverages'

// Componentes de la sección de estadísticas
import { QuickStats } from '@/components/stats/QuickStats'
import { TdeeCard } from '@/components/stats/TdeeCard'
import { WeightChart } from '@/components/stats/WeightChart'
import { CalorieChart } from '@/components/stats/CalorieChart'
import { MacroAverages } from '@/components/stats/MacroAverages'
import { WeeklySnapshotCard } from '@/components/stats/WeeklySnapshotCard'
import { WeightLogModal } from '@/components/stats/WeightLogModal'
import { FastingTracker } from '@/components/stats/FastingTracker'
import { useTodayTotals } from '@/hooks/useTodayTotals'
import { useTdeeAdjustment } from '@/hooks/useTdeeAdjustment'
import { TdeeAdjustmentCard } from '@/components/stats/TdeeAdjustmentCard'

// Monetización Premium
import { usePremiumStore } from '@/stores/premiumStore'
import { StatsPaywallOverlay } from '@/components/premium/StatsPaywallOverlay'

export default function StatsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [showWeightModal, setShowWeightModal] = useState(false)

  const { isPremium } = usePremiumStore()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('unit_weight')
        .eq('id', user.id)
        .single()

      if (profile?.unit_weight) {
        setWeightUnit(profile.unit_weight as 'kg' | 'lb')
      }
    })
  }, [])

  const { data: tdeeState, isLoading: tdeeLoading } = useTdeeState(userId)
  const { data: snapshots = [], isLoading: snapshotsLoading } = useWeeklySnapshots(userId)
  const { data: weightHistory = [], isLoading: weightLoading } = useWeightHistory(userId)
  const { data: streakData, isLoading: streakLoading } = useStreakDays(userId)
  const { data: macroAverages, isLoading: macroLoading } = useMacroAverages(userId)
  const { data: todayTotals } = useTodayTotals(userId)
  const { data: tdeeAdjustment } = useTdeeAdjustment(userId)

  const lastWeightEntry = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null
  const currentWeight = lastWeightEntry?.weight_kg ?? null
  const daysLogged = streakData?.totalComplete ?? 0
  const streak = streakData?.streak ?? 0
  const goalKcal = tdeeState?.goal_kcal ?? 2000

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header con gradiente naranja */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(160deg, #F97316 0%, #EA6C0A 100%)' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Tu evolución</p>
            <h1 className="text-white text-2xl font-black leading-tight">Progreso</h1>
            <p className="text-white/80 text-sm mt-1">Estadísticas y seguimiento</p>
          </div>
          <div className="w-14 h-14 relative">
            <Image src="/nutria-trophy.png" alt="Nuti" fill className="object-contain drop-shadow-md" sizes="56px" />
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4 pb-24">
        {/* 1. Tarjetas de resumen rápido */}
        <QuickStats
          daysLogged={daysLogged}
          currentWeight={currentWeight}
          streak={streak}
          weightUnit={weightUnit}
          isLoading={streakLoading || weightLoading}
        />

        {/* 2. Ayuno intermitente */}
        <section>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">Ayuno</p>
          <FastingTracker />
        </section>

        {/* 3. Objetivo calórico diario */}
        <TdeeCard tdeeState={tdeeState ?? null} todayTotals={todayTotals ?? null} isLoading={tdeeLoading} />

        {/* 3b. Sugerencia de ajuste de TDEE (si aplica) */}
        {tdeeAdjustment?.shouldAdjust && userId && (
          <TdeeAdjustmentCard adjustment={tdeeAdjustment} userId={userId} />
        )}

        {/* 4. Gráfico de evolución del peso */}
        <section className="relative bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Peso</p>
          <WeightChart
            data={weightHistory}
            unit={weightUnit}
            onAddWeight={() => setShowWeightModal(true)}
            isLoading={weightLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </section>

        {/* 5. Gráfico de calorías semanales */}
        <section className="relative bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Calorías semanales</p>
          <CalorieChart
            snapshots={snapshots}
            goalKcal={goalKcal}
            isLoading={snapshotsLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </section>

        {/* 6. Macros promedio de la semana actual */}
        <section className="relative bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Macros esta semana</p>
          <MacroAverages
            data={macroAverages ?? null}
            targets={tdeeState?.macro_targets ?? null}
            isLoading={macroLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </section>

        {/* 7. Historial de semanas anteriores */}
        <section>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">Historial semanal</p>
          {snapshotsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-16 w-full" />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="text-sm text-stone-400 text-center">Aún no hay semanas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snapshot) => (
                <WeeklySnapshotCard key={snapshot.week_start} snapshot={snapshot} />
              ))}
            </div>
          )}
        </section>
      </main>

      {userId && (
        <WeightLogModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          lastWeight={currentWeight}
          userId={userId}
        />
      )}
    </div>
  )
}
