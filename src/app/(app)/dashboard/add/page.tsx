'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, X, ChevronRight, PenLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Food, FoodServing, MealType } from '@/types/database'

// ─── Config ────────────────────────────────────────────────────────────────

const mealConfig: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Desayuno',  emoji: '☕', color: 'text-orange-500' },
  lunch:     { label: 'Almuerzo',  emoji: '🍽', color: 'text-orange-500' },
  dinner:    { label: 'Cena',      emoji: '🌙', color: 'text-blue-400'   },
  snack:     { label: 'Snack',     emoji: '🍎', color: 'text-emerald-500' },
}

function isMealType(v: string | null): v is MealType {
  return v === 'breakfast' || v === 'lunch' || v === 'dinner' || v === 'snack'
}

// ─── Main component (needs Suspense) ───────────────────────────────────────

type View = 'search' | 'portion' | 'manual'

function AddFoodContent() {
  const router = useRouter()
  const params = useSearchParams()

  const rawMeal = params.get('meal')
  const mealType: MealType = isMealType(rawMeal) ? rawMeal : 'breakfast'
  const logDate = params.get('date') ?? new Date().toISOString().split('T')[0]
  const meal = mealConfig[mealType]

  // ── State ────────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [servings, setServings] = useState<FoodServing[]>([])
  const [grams, setGrams] = useState('100')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Manual form
  const [manualName, setManualName] = useState('')
  const [manualKcal, setManualKcal] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${trimmed}%`)
        .eq('is_active', true)
        .limit(20)

      setResults((data as Food[]) ?? [])
      setIsSearching(false)
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  // ── Fetch servings when food is selected ────────────────────────────────
  useEffect(() => {
    if (!selectedFood) { setServings([]); return }
    const supabase = createClient()
    supabase
      .from('food_servings')
      .select('*')
      .eq('food_id', selectedFood.id)
      .order('grams', { ascending: true })
      .then(({ data }) => setServings((data as FoodServing[]) ?? []))
  }, [selectedFood])

  // ── Calculated macros for portion panel ──────────────────────────────────
  const g = Math.max(0, parseFloat(grams) || 0)
  const calc = selectedFood
    ? {
        kcal:    Math.round((selectedFood.calories_kcal / 100) * g),
        protein: Math.round((selectedFood.protein_g     / 100) * g * 10) / 10,
        carbs:   Math.round((selectedFood.carbs_g       / 100) * g * 10) / 10,
        fat:     Math.round((selectedFood.fat_g         / 100) * g * 10) / 10,
        fiber:   selectedFood.fiber_g != null
                   ? Math.round((selectedFood.fiber_g / 100) * g * 10) / 10
                   : null,
      }
    : null

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function getUserId(): Promise<string | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }

  async function handleAddFromDatabase() {
    if (!selectedFood || !calc) return
    setSaveError(null)
    setIsSaving(true)

    try {
      const userId = await getUserId()
      if (!userId) { router.push('/login'); return }

      const supabase = createClient()
      const { error } = await supabase.from('food_log_entries').insert({
        user_id:        userId,
        food_id:        selectedFood.id,
        log_date:       logDate,
        meal_type:      mealType,
        quantity_grams: g,
        calories_kcal:  (selectedFood.calories_kcal / 100) * g,
        protein_g:      (selectedFood.protein_g     / 100) * g,
        carbs_g:        (selectedFood.carbs_g       / 100) * g,
        fat_g:          (selectedFood.fat_g         / 100) * g,
        fiber_g:        selectedFood.fiber_g != null
                          ? (selectedFood.fiber_g / 100) * g
                          : null,
        logging_method: 'manual',
      })

      if (error) { setSaveError('Error al guardar. Intenta de nuevo.'); return }
      router.push('/dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault()
    if (!manualName.trim()) return
    setSaveError(null)
    setIsSaving(true)

    try {
      const userId = await getUserId()
      if (!userId) { router.push('/login'); return }

      const supabase = createClient()
      const { error } = await supabase.from('food_log_entries').insert({
        user_id:            userId,
        food_id:            null,
        log_date:           logDate,
        meal_type:          mealType,
        quantity_grams:     100,
        calories_kcal:      parseFloat(manualKcal)   || 0,
        protein_g:          parseFloat(manualProtein) || 0,
        carbs_g:            parseFloat(manualCarbs)   || 0,
        fat_g:              parseFloat(manualFat)     || 0,
        fiber_g:            null,
        custom_description: manualName.trim(),
        logging_method:     'manual',
      })

      if (error) { setSaveError('Error al guardar. Intenta de nuevo.'); return }
      router.push('/dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => view === 'search' ? router.push('/dashboard') : setView('search')}
            className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{meal.emoji}</span>
            <div>
              <h1 className="text-sm font-bold text-stone-900 leading-tight">
                {view === 'portion' && selectedFood
                  ? 'Ajustar porción'
                  : view === 'manual'
                  ? 'Añadir manualmente'
                  : `Añadir a ${meal.label}`}
              </h1>
              {view === 'portion' && selectedFood && (
                <p className="text-xs text-stone-400 truncate max-w-[200px]">{selectedFood.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          VIEW: SEARCH
      ══════════════════════════════════════════════════ */}
      {view === 'search' && (
        <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-6">

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar alimento…"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          {isSearching && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-4">
              {results.map((food, i) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => { setSelectedFood(food); setGrams('100'); setView('portion') }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 active:bg-stone-100 transition-colors ${
                    i < results.length - 1 ? 'border-b border-stone-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{food.name}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {food.brand ? `${food.brand} · ` : ''}
                      {food.calories_kcal} kcal
                      {food.category ? ` · ${food.category}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-stone-400">Sin resultados para «{query.trim()}»</p>
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="text-center py-8">
              <p className="text-xs text-stone-400">Escribe al menos 2 caracteres para buscar</p>
            </div>
          )}

          {/* Manual entry CTA */}
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={() => setView('manual')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-stone-200 bg-white text-stone-600 text-sm font-medium hover:bg-stone-50 active:bg-stone-100 transition-colors"
            >
              <PenLine className="w-4 h-4" />
              Añadir manualmente
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VIEW: PORTION
      ══════════════════════════════════════════════════ */}
      {view === 'portion' && selectedFood && calc && (
        <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-6 space-y-4">

          {/* Food card */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <p className="text-base font-semibold text-stone-900">{selectedFood.name}</p>
            {selectedFood.brand && (
              <p className="text-xs text-stone-400 mt-0.5">{selectedFood.brand}</p>
            )}
            <p className="text-xs text-stone-400 mt-1">
              Valores por 100 g — {selectedFood.calories_kcal} kcal ·
              P {selectedFood.protein_g}g · C {selectedFood.carbs_g}g · G {selectedFood.fat_g}g
            </p>
          </div>

          {/* Quantity selector */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4">
            <label className="block text-sm font-semibold text-stone-700 mb-3">Cantidad</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGrams(String(Math.max(5, (parseFloat(grams) || 100) - 10)))}
                className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 text-lg font-medium flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
              >−</button>
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="w-full text-center rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">g</span>
              </div>
              <button
                type="button"
                onClick={() => setGrams(String((parseFloat(grams) || 100) + 10))}
                className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 text-lg font-medium flex items-center justify-center hover:bg-stone-200 transition-colors flex-shrink-0"
              >+</button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 mt-3">
              {[50, 100, 150, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGrams(String(preset))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    grams === String(preset)
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {preset}g
                </button>
              ))}
            </div>

            {/* Porciones predefinidas del alimento */}
            {servings.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-stone-400 mb-2">Porciones habituales</p>
                <div className="flex flex-wrap gap-2">
                  {servings.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setGrams(String(s.grams))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        grams === String(s.grams)
                          ? 'bg-orange-500 text-white'
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      }`}
                    >
                      {s.label} · {s.grams}g
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Calculated macros */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[11px] text-white/70">Calorías totales</p>
                <p className="text-3xl font-bold leading-none">{calc.kcal}</p>
                <p className="text-[11px] text-white/70 mt-0.5">kcal · {g}g</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20">
              {[
                { label: 'Proteína', value: calc.protein, unit: 'g' },
                { label: 'Carbos',   value: calc.carbs,   unit: 'g' },
                { label: 'Grasa',    value: calc.fat,     unit: 'g' },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-sm font-semibold">{m.value}{m.unit}</p>
                  <p className="text-[10px] text-white/70">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-700">{saveError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddFromDatabase}
            disabled={isSaving || g <= 0}
            className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Guardando…' : `Añadir ${calc.kcal} kcal a ${meal.label}`}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VIEW: MANUAL
      ══════════════════════════════════════════════════ */}
      {view === 'manual' && (
        <form
          onSubmit={handleAddManual}
          className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-6 space-y-4"
        >
          {/* Name */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-stone-700">Alimento</p>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Nombre *</label>
              <input
                autoFocus
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Ej: Tostada con aceite"
                required
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Nutrition */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-stone-700">Información nutricional (por porción)</p>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Calorías (kcal) *</label>
              <input
                type="number"
                min="0"
                value={manualKcal}
                onChange={(e) => setManualKcal(e.target.value)}
                placeholder="0"
                required
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Proteína (g)',  value: manualProtein, onChange: setManualProtein },
                { label: 'Carbos (g)',    value: manualCarbs,   onChange: setManualCarbs   },
                { label: 'Grasa (g)',     value: manualFat,     onChange: setManualFat     },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs text-stone-500 mb-1">{f.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-700">{saveError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !manualName.trim()}
            className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Guardando…' : 'Guardar alimento'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Export con Suspense (requerido por useSearchParams en Next.js 14) ──────

export default function AddFoodPage() {
  return (
    <Suspense>
      <AddFoodContent />
    </Suspense>
  )
}
