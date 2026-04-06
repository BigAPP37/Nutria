'use client'

// Dashboard principal de Nutria — Rediseño híbrido Yazio + Cronometer
// Header naranja con anillos concéntricos, micronutrientes, agua segmentada, comidas con emojis
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Settings, MessageSquarePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useTdeeState } from '@/hooks/useTdeeState'
import Link from 'next/link'
import { CalorieRing } from '@/components/dashboard/CalorieRing'
import { MicronutrientRow } from '@/components/dashboard/MicronutrientRow'
import { WaterTracker } from '@/components/dashboard/WaterTracker'
import { MealSection } from '@/components/dashboard/MealSection'
import { NaturalTextLogger } from '@/components/dashboard/NaturalTextLogger'
import { EditEntrySheet } from '@/components/dashboard/EditEntrySheet'
import { ReminderBanner } from '@/components/dashboard/ReminderBanner'
import type { FoodLogEntry, MealType } from '@/types/database'
import { usePsychFlag } from '@/hooks/usePsychFlag'
import { PsychSupportCard } from '@/components/psych/PsychSupportCard'
import { getMessageKey, getMessageContent } from '@/lib/psychMessages'
import type { FlagType } from '@/types/psych'

function getFormattedDate(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}


export default function DashboardPage() {
  const router = useRouter()
  const { data: profile, isLoading: profileLoading } = useProfile()

  const [userId, setUserId] = useState<string | null>(null)
  const [foodEntries, setFoodEntries] = useState<FoodLogEntry[]>([])
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [isLoggingComplete, setIsLoggingComplete] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showTextLogger, setShowTextLogger] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null)

  const today = getTodayISO()
  const formattedDate = getFormattedDate()

  const { data: tdeeState, isLoading: tdeeLoading } = useTdeeState(userId)
  const { data: psychFlag } = usePsychFlag(userId)

  // Obtener el usuario actual
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
      } else {
        router.push('/login')
      }
    })
  }, [router])

  // Calcular racha de días consecutivos (contando desde ayer hacia atrás)
  useEffect(() => {
    if (!userId) return
    async function loadStreak() {
      if (!userId) return
      const supabase = createClient()
      const { data } = await supabase
        .from('daily_log_status')
        .select('log_date')
        .eq('user_id', userId)
        .eq('is_day_complete', true)
        .order('log_date', { ascending: false })

      if (!data || data.length === 0) return

      // Contar días consecutivos hacia atrás desde ayer
      let streak = 0
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      for (let i = 0; i < data.length; i++) {
        const expected = new Date(yesterday)
        expected.setDate(expected.getDate() - i)
        const expectedStr = expected.toISOString().split('T')[0]
        if (data[i].log_date === expectedStr) {
          streak++
        } else {
          break
        }
      }
      setStreakDays(streak)
    }
    loadStreak()
  }, [userId])

  // Cargar datos del día
  useEffect(() => {
    if (!userId) return

    async function loadDailyData() {
      if (!userId) return
      const supabase = createClient()

      // Cargar entradas de comida del día
      const { data: entries } = await supabase
        .from('food_log_entries')
        .select('*, foods(name)')
        .eq('user_id', userId)
        .eq('log_date', today)
        .is('deleted_at', null)
        .order('id', { ascending: true })

      setFoodEntries((entries as FoodLogEntry[]) || [])

      // Cargar estado diario
      const { data: status } = await supabase
        .from('daily_log_status')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle()

      if (status) {
        setIsLoggingComplete(status.is_day_complete || false)
      }

      // Cargar agua del día
      const { data: waterData } = await supabase
        .from('water_log')
        .select('amount_ml')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle()

      if (waterData) {
        setWaterGlasses(Math.round((waterData.amount_ml || 0) / 250))
      }

      setIsLoadingData(false)
    }

    loadDailyData()
  }, [userId, today])

  // Calcular totales del día
  const totals = foodEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories_kcal || 0),
      protein: acc.protein + (entry.protein_g || 0),
      carbs: acc.carbs + (entry.carbs_g || 0),
      fat: acc.fat + (entry.fat_g || 0),
      fiber: acc.fiber + (entry.fiber_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  )

  // Objetivos reales del usuario desde user_tdee_state
  const goals = tdeeState
    ? {
        calories: tdeeState.goal_kcal,
        protein_g: tdeeState.macro_targets.protein_g,
        carbs_g: tdeeState.macro_targets.carbs_g,
        fat_g: tdeeState.macro_targets.fat_g,
      }
    : null

  // Filtrar entradas por tipo de comida
  function getEntriesByMeal(mealType: MealType): FoodLogEntry[] {
    return foodEntries.filter((e) => e.meal_type === mealType)
  }

  // Agregar alimento — navega al formulario
  function handleAddEntry(mealType: MealType) {
    router.push(`/dashboard/add?meal=${mealType}&date=${today}`)
  }

  // Recargar entradas tras guardar o editar
  async function reloadFoodEntries() {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('food_log_entries')
      .select('*, foods(name)')
      .eq('user_id', userId)
      .eq('log_date', today)
      .is('deleted_at', null)
      .order('id', { ascending: true })
    setFoodEntries((data as FoodLogEntry[]) || [])
  }


  const displayName = profile?.display_name || 'amigo'

  // Micronutrientes simulados (se calcularán de verdad cuando haya datos)
  const microPercents = {
    vitaminC: goals && totals.calories > 0 ? Math.min(100, Math.round((totals.calories / goals.calories) * 65)) : 0,
    iron: goals && totals.calories > 0 ? Math.min(100, Math.round((totals.calories / goals.calories) * 30)) : 0,
    calcium: goals && totals.calories > 0 ? Math.min(100, Math.round((totals.calories / goals.calories) * 45)) : 0,
    fiber: totals.fiber > 0 ? Math.min(100, Math.round((totals.fiber / 25) * 100)) : 0,
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ============ HEADER NARANJA ============ */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-4 pb-6">
        {/* Fila superior: fecha, nombre, acciones */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/75 capitalize">{formattedDate}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-lg font-semibold text-white">
                Hola, {displayName} 👋
              </p>
              {streakDays > 0 && (
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  🔥 {streakDays}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/settings"
            className="w-[34px] h-[34px] rounded-full bg-white/15 flex items-center justify-center"
            aria-label="Ajustes"
          >
            <Settings className="w-4 h-4 text-white" />
          </Link>
        </div>

        {/* Anillo concéntrico + macros */}
        {(tdeeLoading || (isLoadingData && !goals)) ? (
          // Skeleton mientras cargan los objetivos
          <div className="flex items-center gap-4 py-1">
            <div className="w-[140px] h-[140px] rounded-full bg-white/10 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 bg-white/10 rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
                  <div className="h-[3px] bg-white/10 rounded animate-pulse w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : goals ? (
          <CalorieRing
            consumed={Math.round(totals.calories)}
            goal={goals.calories}
            protein_consumed={totals.protein}
            protein_goal={goals.protein_g}
            carbs_consumed={totals.carbs}
            carbs_goal={goals.carbs_g}
            fat_consumed={totals.fat}
            fat_goal={goals.fat_g}
          />
        ) : (
          // No hay datos TDEE — usuario sin onboarding completo
          <div className="py-4 text-center">
            <p className="text-sm text-white/70">
              Completa el onboarding para ver tu plan personalizado
            </p>
          </div>
        )}

        {/* Mensaje contextual de Nuti */}
        {!tdeeLoading && goals && (
          <p className="text-center text-xs text-white/80 italic mt-2">
            {totals.calories === 0
              ? '¡Buenos días! Empieza registrando tu primer alimento 🦦'
              : totals.calories / goals.calories <= 0.30
              ? 'Buen comienzo, sigue así 💪'
              : totals.calories / goals.calories <= 0.60
              ? '¡Vas genial! A mitad de camino 🌊'
              : totals.calories / goals.calories <= 0.90
              ? 'Casi lo tienes, último tramo 🎯'
              : totals.calories / goals.calories < 1
              ? '¡Increíble! Meta casi alcanzada ✨'
              : '¡Meta del día completada! Nuti está orgulloso 🦦🎉'}
          </p>
        )}
      </div>

      {/* ============ CONTENIDO ============ */}
      <div className="px-4 -mt-0 pt-4 space-y-3">
        {/* Tarjeta de soporte psicológico (si hay un flag activo) */}
        {psychFlag && userId && (
          <PsychSupportCard
            flagId={psychFlag.id}
            flagType={psychFlag.flag_type}
            messageKey={getMessageKey(psychFlag.flag_type as FlagType)}
            messageContent={getMessageContent(psychFlag.flag_type as FlagType)}
            userId={userId}
          />
        )}

        {/* Micronutrientes */}
        <MicronutrientRow
          vitaminC_percent={microPercents.vitaminC}
          iron_percent={microPercents.iron}
          calcium_percent={microPercents.calcium}
          fiber_percent={microPercents.fiber}
        />

        {/* Agua */}
        {userId && (
          <WaterTracker
            userId={userId}
            date={today}
            initialGlasses={waterGlasses}
            onUpdate={setWaterGlasses}
          />
        )}

        {/* Recordatorio contextual */}
        <ReminderBanner entries={foodEntries} />

        {/* Comidas */}
        <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wide pt-1">
          Comidas
        </p>

        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
          <MealSection
            key={meal}
            mealType={meal}
            entries={getEntriesByMeal(meal)}
            onAddEntry={handleAddEntry}
            onEntryTap={setEditingEntry}
          />
        ))}

        {/* Registrar con texto */}
        {userId && (
          <button
            type="button"
            onClick={() => setShowTextLogger(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-50 active:bg-stone-100 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4 text-orange-400" />
            Registrar con texto
          </button>
        )}

        {/* Marcar día como completo */}
        <button
          onClick={async () => {
            if (!userId) return
            const newValue = !isLoggingComplete
            setIsLoggingComplete(newValue)
            const supabase = createClient()
            await supabase.from('daily_log_status').upsert(
              { user_id: userId, log_date: today, is_day_complete: newValue },
              { onConflict: 'user_id,log_date' }
            )
          }}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
            isLoggingComplete
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-white border-stone-100 text-stone-400'
          }`}
        >
          {isLoggingComplete ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isLoggingComplete ? 'Día completado ✓' : 'He terminado de registrar hoy'}
          </span>
        </button>

        {/* Espaciado inferior */}
        <div className="h-6" />
      </div>

      {/* Sheet: editar/eliminar entrada */}
      {editingEntry && (
        <EditEntrySheet
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdated={async () => {
            setEditingEntry(null)
            await reloadFoodEntries()
          }}
        />
      )}

      {/* Modal: logger de texto natural */}
      {showTextLogger && userId && (
        <NaturalTextLogger
          userId={userId}
          logDate={today}
          onSaved={async () => {
            setShowTextLogger(false)
            await reloadFoodEntries()
          }}
          onClose={() => setShowTextLogger(false)}
        />
      )}
    </div>
  )
}
