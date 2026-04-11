// Pantalla de Progreso — orquesta todos los componentes y hooks de estadísticas
'use client'

import dynamic from 'next/dynamic'
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
import { MacroAverages } from '@/components/stats/MacroAverages'
import { WeeklySnapshotCard } from '@/components/stats/WeeklySnapshotCard'
import { WeightLogModal } from '@/components/stats/WeightLogModal'
import { FastingTracker } from '@/components/stats/FastingTracker'
import { useTodayTotals } from '@/hooks/useTodayTotals'
import { useTdeeAdjustment } from '@/hooks/useTdeeAdjustment'
import { TdeeAdjustmentCard } from '@/components/stats/TdeeAdjustmentCard'
import { AppHero, AppPage, AppPanel, AppSectionHeader } from '@/components/ui/AppPage'

// Monetización Premium
import { usePremiumStore } from '@/stores/premiumStore'
import { StatsPaywallOverlay } from '@/components/premium/StatsPaywallOverlay'

const WeightChart = dynamic(
  () => import('@/components/stats/WeightChart').then((mod) => mod.WeightChart),
  { ssr: false }
)

const CalorieChart = dynamic(
  () => import('@/components/stats/CalorieChart').then((mod) => mod.CalorieChart),
  { ssr: false }
)

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
    <AppPage>
      <AppHero
        eyebrow="Tu evolución"
        eyebrowClassName="[font-family:var(--font-oswald)] text-sm tracking-[0.22em] not-italic font-medium"
        title="Tu progreso merece una lectura más clara."
        description="Peso, consistencia y energía en una sola vista. El objetivo es detectar cambios útiles sin perderte entre widgets."
        action={
          <div className="soft-ring relative hidden h-16 w-16 rounded-[1.4rem] bg-white/10 p-2 md:block">
            <Image src="/nutria-trophy.png" alt="Nuti" fill className="object-contain drop-shadow-md" sizes="56px" />
          </div>
        }
      >
        <div className="glass-pill inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/82">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Seguimiento semanal y señales de ajuste
        </div>
      </AppHero>

      <main className="space-y-4">
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
          <AppSectionHeader
            title="Ayuno"
            description="Una referencia rápida para entender tu patrón diario."
          />
          <div className="mt-3">
            <FastingTracker />
          </div>
        </section>

        {/* 3. Objetivo calórico diario */}
        <TdeeCard tdeeState={tdeeState ?? null} todayTotals={todayTotals ?? null} isLoading={tdeeLoading} />

        {/* 3b. Sugerencia de ajuste de TDEE (si aplica) */}
        {tdeeAdjustment?.shouldAdjust && userId && (
          <TdeeAdjustmentCard adjustment={tdeeAdjustment} userId={userId} />
        )}

        {/* 4. Gráfico de evolución del peso */}
        <AppPanel className="relative p-4">
          <AppSectionHeader
            title="Peso"
            description="Observa la tendencia, no solo el número del día."
          />
          <WeightChart
            data={weightHistory}
            unit={weightUnit}
            onAddWeight={() => setShowWeightModal(true)}
            isLoading={weightLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </AppPanel>

        {/* 5. Gráfico de calorías semanales */}
        <AppPanel className="relative p-4">
          <AppSectionHeader
            title="Calorías semanales"
            description="Compara tu intake real con el objetivo para ajustar antes de desviarte."
          />
          <CalorieChart
            snapshots={snapshots}
            goalKcal={goalKcal}
            isLoading={snapshotsLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </AppPanel>

        {/* 6. Macros promedio de la semana actual */}
        <AppPanel className="relative p-4">
          <AppSectionHeader
            title="Macros esta semana"
            description="Detecta desequilibrios antes de que se conviertan en hábito."
          />
          <MacroAverages
            data={macroAverages ?? null}
            targets={tdeeState?.macro_targets ?? null}
            isLoading={macroLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </AppPanel>

        {/* 7. Historial de semanas anteriores */}
        <section>
          <AppSectionHeader
            title="Historial semanal"
            description="Semanas anteriores para entender consistencia, no perfección."
          />
          {snapshotsLoading ? (
            <div className="mt-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-[1.4rem] bg-[var(--surface-1)]" />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <AppPanel className="p-4">
              <p className="text-center text-sm text-[var(--ink-3)]">Aún no hay semanas registradas</p>
            </AppPanel>
          ) : (
            <div className="mt-3 space-y-2">
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
    </AppPage>
  )
}
