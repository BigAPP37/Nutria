// Pantalla de Progreso — orquesta todos los componentes y hooks de estadísticas
'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

// Monetización Premium
import { usePremiumStore } from '@/stores/premiumStore'
import { StatsPaywallOverlay } from '@/components/premium/StatsPaywallOverlay'

export default function StatsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [showWeightModal, setShowWeightModal] = useState(false)

  // Estado Premium desde el store global
  const { isPremium } = usePremiumStore()

  // Obtener userId y preferencias del usuario al montar
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Cargar la unidad de peso preferida desde el perfil
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

  // ── Carga de datos con TanStack Query ────────────────────────────────────
  const { data: tdeeState, isLoading: tdeeLoading } = useTdeeState(userId)
  const { data: snapshots = [], isLoading: snapshotsLoading } = useWeeklySnapshots(userId)
  const { data: weightHistory = [], isLoading: weightLoading } = useWeightHistory(userId)
  const { data: streakData, isLoading: streakLoading } = useStreakDays(userId)
  const { data: macroAverages, isLoading: macroLoading } = useMacroAverages(userId)

  // ── Datos derivados ───────────────────────────────────────────────────────
  const lastWeightEntry = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null
  const currentWeight = lastWeightEntry?.weight_kg ?? null

  const daysLogged = streakData?.totalComplete ?? 0
  const streak = streakData?.streak ?? 0

  // Objetivo calórico para el gráfico de barras (2000 por defecto si no hay estado aún)
  const goalKcal = tdeeState?.goal_kcal ?? 2000

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Cabecera sticky */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center active:bg-stone-200 transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-stone-900">Progreso</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4 pb-12">
        {/* 1. Tarjetas de resumen rápido */}
        <QuickStats
          daysLogged={daysLogged}
          currentWeight={currentWeight}
          streak={streak}
          weightUnit={weightUnit}
          isLoading={streakLoading || weightLoading}
        />

        {/* 2. Objetivo calórico diario */}
        <TdeeCard tdeeState={tdeeState ?? null} isLoading={tdeeLoading} />

        {/* 3. Gráfico de evolución del peso — con overlay Premium si es usuario gratuito */}
        <section className="relative bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-3">
            Peso
          </p>
          <WeightChart
            data={weightHistory}
            unit={weightUnit}
            onAddWeight={() => setShowWeightModal(true)}
            isLoading={weightLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </section>

        {/* 4. Gráfico de calorías semanales — con overlay Premium si es usuario gratuito */}
        <section className="relative bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-3">
            Calorías semanales
          </p>
          <CalorieChart
            snapshots={snapshots}
            goalKcal={goalKcal}
            isLoading={snapshotsLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </section>

        {/* 5. Macros promedio de la semana actual — con overlay Premium si es usuario gratuito */}
        <section className="relative bg-white rounded-2xl border border-stone-100 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-3">
            Macros esta semana
          </p>
          <MacroAverages
            data={macroAverages ?? null}
            targets={tdeeState?.macro_targets ?? null}
            isLoading={macroLoading}
          />
          {!isPremium && <StatsPaywallOverlay />}
        </section>

        {/* 6. Historial de semanas anteriores */}
        <section>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide mb-3">
            Historial semanal
          </p>
          {snapshotsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-stone-100 rounded-2xl h-16 w-full"
                />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="text-sm text-stone-400 text-center">
                Aún no hay semanas registradas
              </p>
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

      {/* Modal de registro de peso — solo se monta cuando hay userId */}
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
