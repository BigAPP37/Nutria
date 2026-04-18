// Pantalla de Progreso — orquesta todos los componentes y hooks de estadísticas
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { ChevronRight, LockKeyhole } from 'lucide-react'

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
import { PaywallModal } from '@/components/premium/PaywallModal'

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
  const [screenError, setScreenError] = useState<string | null>(null)
  const [showStatsPaywall, setShowStatsPaywall] = useState(false)

  const { isPremium } = usePremiumStore()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user }, error: authError }) => {
      if (authError) {
        setScreenError(authError.message)
        return
      }
      if (!user) return
      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('unit_weight')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setScreenError(profileError.message)
        return
      }

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

  if (screenError) {
    return (
      <AppPage>
        <AppPanel className="p-6 text-center">
          <p className="text-sm font-semibold text-stone-700">No pudimos cargar tus estadísticas</p>
          <p className="mt-2 text-sm text-stone-500">{screenError}</p>
        </AppPanel>
      </AppPage>
    )
  }

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

        {isPremium && (
          <>
            {/* 3. Objetivo calórico diario */}
            <TdeeCard tdeeState={tdeeState ?? null} todayTotals={todayTotals ?? null} isLoading={tdeeLoading} />

            {/* 3b. Sugerencia de ajuste (si aplica) */}
            {tdeeAdjustment?.shouldAdjust && userId && (
              <TdeeAdjustmentCard adjustment={tdeeAdjustment} userId={userId} />
            )}

            {/* 4. Gráfico de evolución del peso */}
            <AppPanel className="p-4">
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
            </AppPanel>

            {/* 5. Gráfico de calorías semanales */}
            <AppPanel className="p-4">
              <AppSectionHeader
                title="Calorías semanales"
                description="Compara tu intake real con el objetivo para ajustar antes de desviarte."
              />
              <CalorieChart
                snapshots={snapshots}
                goalKcal={goalKcal}
                isLoading={snapshotsLoading}
              />
            </AppPanel>

            {/* 6. Resumen nutricional de la semana actual */}
            <AppPanel className="p-4">
              <AppSectionHeader
                title="Resumen nutricional"
                description="Una lectura simple para entender cómo va tu semana."
              />
              <MacroAverages
                data={macroAverages ?? null}
                targets={tdeeState?.macro_targets ?? null}
                isLoading={macroLoading}
              />
            </AppPanel>
          </>
        )}

        {/* 7. Historial de semanas anteriores */}
        <section>
          <AppSectionHeader
            title={isPremium ? 'Historial semanal' : 'Resumen semanal'}
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

        {!isPremium && (
          <AppPanel className="overflow-hidden p-0">
            <div
              className="relative px-5 py-5 text-white"
              style={{
                background: 'linear-gradient(145deg, #0D0D0D 0%, #1C1917 62%, rgba(249,115,22,0.18) 100%)',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.2),transparent_42%)]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <LockKeyhole className="h-5 w-5 text-[var(--color-primary-500)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Desbloquea estadísticas avanzadas</p>
                    <p className="mt-1 text-sm text-white/70">
                      Tendencias, comparativas y una lectura más completa de tu progreso.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="h-3 w-24 rounded-full bg-white/20" />
                      <div className="mt-2 h-2.5 w-16 rounded-full bg-white/10" />
                    </div>
                    <div className="h-9 w-14 rounded-2xl bg-white/10" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 opacity-60 blur-[1px]">
                    <div className="h-20 rounded-2xl bg-white/10" />
                    <div className="h-20 rounded-2xl bg-white/10" />
                    <div className="h-20 rounded-2xl bg-white/10" />
                  </div>
                  <div className="h-24 rounded-[1.25rem] bg-white/8 opacity-60 blur-[1px]" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowStatsPaywall(true)}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary-500)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.24)]"
                >
                  Ver opciones
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </AppPanel>
        )}
      </main>

      {userId && (
        <WeightLogModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          lastWeight={currentWeight}
          userId={userId}
        />
      )}

      {showStatsPaywall && (
        <PaywallModal
          isOpen={showStatsPaywall}
          onClose={() => setShowStatsPaywall(false)}
          trigger="stats"
        />
      )}
    </AppPage>
  )
}
