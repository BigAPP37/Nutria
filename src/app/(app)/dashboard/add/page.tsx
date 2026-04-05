'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, X, ChevronRight, PenLine, Plus, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Food, FoodServing, MealType } from '@/types/database'

// ─── Config ────────────────────────────────────────────────────────────────

const mealConfig: Record<MealType, { label: string; emoji: string; color: string; accentBg: string }> = {
  breakfast: { label: 'Desayuno',  emoji: '☕', color: '#F97316', accentBg: '#FFF7ED' },
  lunch:     { label: 'Almuerzo',  emoji: '🍽', color: '#F97316', accentBg: '#FFF7ED' },
  dinner:    { label: 'Cena',      emoji: '🌙', color: '#6366F1', accentBg: '#EEF2FF' },
  snack:     { label: 'Snack',     emoji: '🍎', color: '#10B981', accentBg: '#ECFDF5' },
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
    <div style={{ minHeight: '100vh', background: '#FAFAF9', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'white',
        borderBottom: '1px solid #E7E5E4',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: 448,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            type="button"
            onClick={() => view === 'search' ? router.push('/dashboard') : setView('search')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: '#F5F4F3',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#78716C',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {/* Meal icon */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: meal.accentBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}>
              {meal.emoji}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#1C1917',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {view === 'portion' && selectedFood
                  ? 'Ajustar porción'
                  : view === 'manual'
                  ? 'Añadir manualmente'
                  : `Añadir a ${meal.label}`}
              </h1>
              {view === 'portion' && selectedFood && (
                <p style={{
                  fontSize: 12,
                  color: '#A8A29E',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {selectedFood.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          VIEW: SEARCH
      ══════════════════════════════════════════════════ */}
      {view === 'search' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          maxWidth: 448,
          margin: '0 auto',
          width: '100%',
          padding: '16px 16px 32px',
          gap: 12,
        }}>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 16,
              color: '#A8A29E',
              pointerEvents: 'none',
            }} />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar alimento…"
              style={{
                width: '100%',
                paddingLeft: 44,
                paddingRight: query.length > 0 ? 40 : 16,
                paddingTop: 12,
                paddingBottom: 12,
                borderRadius: 16,
                border: '1.5px solid #E7E5E4',
                background: 'white',
                fontSize: 14,
                color: '#1C1917',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#E7E5E4',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#78716C',
                }}
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>

          {/* Searching spinner */}
          {isSearching && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '3px solid #FED7AA',
                borderTopColor: '#F97316',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Results list */}
          {!isSearching && results.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: 18,
              border: '1px solid #E7E5E4',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              {results.map((food, i) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => { setSelectedFood(food); setGrams('100'); setView('portion') }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 16px',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: i < results.length - 1 ? '1px solid #F9F8F8' : 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF7ED' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#1C1917',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                    }}>
                      {food.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>
                      {food.brand ? `${food.brand} · ` : ''}
                      <span style={{ fontWeight: 700, color: '#F97316' }}>{food.calories_kcal}</span> kcal/100g
                      {food.category ? ` · ${food.category}` : ''}
                    </p>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: '#C4B9B3', flexShrink: 0, marginLeft: 8 }} />
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: 14, color: '#78716C', fontWeight: 600, marginBottom: 4 }}>
                Sin resultados para «{query.trim()}»
              </p>
              <p style={{ fontSize: 12, color: '#A8A29E' }}>
                Prueba otro término o añade manualmente
              </p>
            </div>
          )}

          {/* Prompt */}
          {query.trim().length < 2 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 13, color: '#A8A29E' }}>
                Escribe al menos 2 caracteres para buscar
              </p>
            </div>
          )}

          {/* Manual entry CTA */}
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => setView('manual')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '13px',
                borderRadius: 16,
                border: '1.5px solid #E7E5E4',
                background: 'white',
                color: '#78716C',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F97316'
                e.currentTarget.style.color = '#F97316'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E7E5E4'
                e.currentTarget.style.color = '#78716C'
              }}
            >
              <PenLine style={{ width: 16, height: 16 }} />
              Añadir manualmente
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VIEW: PORTION
      ══════════════════════════════════════════════════ */}
      {view === 'portion' && selectedFood && calc && (
        <div style={{
          flex: 1,
          maxWidth: 448,
          margin: '0 auto',
          width: '100%',
          padding: '16px 16px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>

          {/* Food info card */}
          <div style={{
            background: 'white',
            borderRadius: 18,
            border: '1px solid #E7E5E4',
            padding: '16px',
          }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1917', lineHeight: 1.3, marginBottom: 4 }}>
              {selectedFood.name}
            </p>
            {selectedFood.brand && (
              <p style={{ fontSize: 12, color: '#A8A29E', marginBottom: 6 }}>{selectedFood.brand}</p>
            )}
            <div style={{
              display: 'flex',
              gap: 8,
              padding: '8px 10px',
              background: '#F9F8F8',
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 11, color: '#A8A29E' }}>
                Por 100g:
              </span>
              <span style={{ fontSize: 11, color: '#F97316', fontWeight: 700 }}>
                {selectedFood.calories_kcal} kcal
              </span>
              <span style={{ fontSize: 11, color: '#78716C' }}>
                P {selectedFood.protein_g}g
              </span>
              <span style={{ fontSize: 11, color: '#78716C' }}>
                C {selectedFood.carbs_g}g
              </span>
              <span style={{ fontSize: 11, color: '#78716C' }}>
                G {selectedFood.fat_g}g
              </span>
            </div>
          </div>

          {/* Quantity selector */}
          <div style={{
            background: 'white',
            borderRadius: 18,
            border: '1px solid #E7E5E4',
            padding: '16px',
          }}>
            <p style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#A8A29E',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              textAlign: 'center',
              marginBottom: 14,
            }}>
              Cantidad
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setGrams(String(Math.max(5, (parseFloat(grams) || 100) - 10)))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: '1.5px solid #E7E5E4',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#44403C',
                  flexShrink: 0,
                }}
              >
                <Minus style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    borderRadius: 12,
                    border: '1.5px solid #E7E5E4',
                    padding: '10px 32px 10px 16px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#1C1917',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
                />
                <span style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 12,
                  color: '#A8A29E',
                  fontWeight: 500,
                }}>g</span>
              </div>
              <button
                type="button"
                onClick={() => setGrams(String((parseFloat(grams) || 100) + 10))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: '1.5px solid #E7E5E4',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#44403C',
                  flexShrink: 0,
                }}
              >
                <Plus style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Quick presets */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[50, 100, 150, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGrams(String(preset))}
                  style={{
                    flex: 1,
                    padding: '7px 4px',
                    borderRadius: 10,
                    border: grams === String(preset) ? '1.5px solid #F97316' : '1.5px solid #E7E5E4',
                    background: grams === String(preset) ? '#FFF7ED' : 'white',
                    color: grams === String(preset) ? '#F97316' : '#78716C',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset}g
                </button>
              ))}
            </div>

            {/* Porciones predefinidas del alimento */}
            {servings.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, color: '#A8A29E', marginBottom: 8, fontWeight: 500 }}>
                  Porciones habituales
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {servings.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setGrams(String(s.grams))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 99,
                        border: grams === String(s.grams) ? '1px solid #F97316' : '1px solid #FED7AA',
                        background: grams === String(s.grams) ? '#F97316' : '#FFF7ED',
                        color: grams === String(s.grams) ? 'white' : '#F97316',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {s.label} · {s.grams}g
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Macros preview */}
          <div style={{
            background: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
            borderRadius: 20,
            padding: '18px 20px',
            color: 'white',
            boxShadow: '0 6px 24px rgba(249,115,22,0.4)',
          }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Calorías totales</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}>
                  {calc.kcal}
                </span>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>kcal</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>· {g}g</span>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}>
              {[
                { label: 'Proteína', value: calc.protein },
                { label: 'Carbos',   value: calc.carbs },
                { label: 'Grasa',    value: calc.fat },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{m.value}g</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {saveError && (
            <div style={{
              padding: '12px 16px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 12,
            }}>
              <p style={{ fontSize: 13, color: '#92400E' }}>{saveError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddFromDatabase}
            disabled={isSaving || g <= 0}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 16,
              border: 'none',
              background: isSaving || g <= 0
                ? '#E7E5E4'
                : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: isSaving || g <= 0 ? '#A8A29E' : 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: isSaving || g <= 0 ? 'not-allowed' : 'pointer',
              boxShadow: isSaving || g <= 0 ? 'none' : '0 4px 16px rgba(249,115,22,0.35)',
              transition: 'all 0.2s ease',
            }}
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
          style={{
            flex: 1,
            maxWidth: 448,
            margin: '0 auto',
            width: '100%',
            padding: '16px 16px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Nombre */}
          <div style={{
            background: 'white',
            borderRadius: 18,
            border: '1px solid #E7E5E4',
            padding: '16px',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#78716C', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Alimento
            </p>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#A8A29E', marginBottom: 6 }}>
                Nombre *
              </label>
              <input
                autoFocus
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Ej: Tostada con aceite"
                required
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1.5px solid #E7E5E4',
                  padding: '11px 14px',
                  fontSize: 14,
                  color: '#1C1917',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
              />
            </div>
          </div>

          {/* Nutrición */}
          <div style={{
            background: 'white',
            borderRadius: 18,
            border: '1px solid #E7E5E4',
            padding: '16px',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#78716C', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Información nutricional
            </p>
            <p style={{ fontSize: 11, color: '#A8A29E', marginBottom: 14 }}>
              Por porción completa
            </p>

            {/* Calorías */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#A8A29E', marginBottom: 6 }}>
                Calorías (kcal) *
              </label>
              <input
                type="number"
                min="0"
                value={manualKcal}
                onChange={(e) => setManualKcal(e.target.value)}
                placeholder="0"
                required
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1.5px solid #E7E5E4',
                  padding: '11px 14px',
                  fontSize: 14,
                  color: '#1C1917',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
              />
            </div>

            {/* Macros en grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Proteína (g)',  value: manualProtein, onChange: setManualProtein, emoji: '🥩' },
                { label: 'Carbos (g)',    value: manualCarbs,   onChange: setManualCarbs,   emoji: '🍞' },
                { label: 'Grasa (g)',     value: manualFat,     onChange: setManualFat,     emoji: '🥑' },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: 11, color: '#A8A29E', marginBottom: 5 }}>
                    {f.emoji} {f.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1.5px solid #E7E5E4',
                      padding: '9px 10px',
                      fontSize: 14,
                      color: '#1C1917',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {saveError && (
            <div style={{
              padding: '12px 16px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 12,
            }}>
              <p style={{ fontSize: 13, color: '#92400E' }}>{saveError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !manualName.trim()}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 16,
              border: 'none',
              background: isSaving || !manualName.trim()
                ? '#E7E5E4'
                : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: isSaving || !manualName.trim() ? '#A8A29E' : 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: isSaving || !manualName.trim() ? 'not-allowed' : 'pointer',
              boxShadow: isSaving || !manualName.trim() ? 'none' : '0 4px 16px rgba(249,115,22,0.35)',
              transition: 'all 0.2s ease',
            }}
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
