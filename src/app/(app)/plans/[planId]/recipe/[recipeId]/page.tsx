'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTodayDateKey } from '@/lib/date'
import { ChevronLeft, Flame, Clock, Users, CheckCircle2, Plus } from 'lucide-react'
import type { MealType } from '@/types/database'

type Recipe = {
  id: string
  title: string
  description: string | null
  cuisine: string | null
  prep_time_min: number | null
  cook_time_min: number | null
  ready_in_min: number | null
  servings: number
  calories_kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  image_url: string | null
  source_url: string | null
}

type Ingredient = {
  id: string
  ingredient_name: string
  quantity: number | null
  unit: string | null
  notes: string | null
  order_index: number
}

type Step = {
  id: string
  step_number: number
  instruction: string
  duration_min: number | null
}

const MACRO_ITEMS = [
  { key: 'calories_kcal', label: 'Calorías', unit: 'kcal', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
  { key: 'protein_g',     label: 'Proteína', unit: 'g',    color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  { key: 'carbs_g',       label: 'Carbos',   unit: 'g',    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { key: 'fat_g',         label: 'Grasa',    unit: 'g',    color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
] as const

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snack',
}
const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '☕', lunch: '🍽', dinner: '🌙', snack: '🍎',
}
const VALID_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function RecipePage({ params }: { params: Promise<{ planId: string; recipeId: string }> }) {
  const { recipeId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Usar el meal_type del contexto del plan (query param) o dejar al usuario elegir
  const paramMeal = searchParams.get('meal') as MealType | null
  const defaultMeal: MealType = VALID_MEAL_TYPES.includes(paramMeal as MealType) ? (paramMeal as MealType) : 'lunch'

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [logged, setLogged] = useState(false)
  const [mealType, setMealType] = useState<MealType>(defaultMeal)

  useEffect(() => {
    const sb = createClient()
    async function load() {
      const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
        sb.from('recipes').select('*').eq('id', recipeId).maybeSingle(),
        sb.from('recipe_ingredients').select('*').eq('recipe_id', recipeId).order('order_index'),
        sb.from('recipe_steps').select('*').eq('recipe_id', recipeId).order('step_number'),
      ])
      setRecipe(recipeRes.data)
      setIngredients(ingredientsRes.data || [])
      setSteps(stepsRes.data || [])
      setLoading(false)
    }
    load()
  }, [recipeId])

  async function handleLogToDay() {
    if (!recipe) return
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    const today = getTodayDateKey()
    // Los macros de la receta son para 1 ración (servings=1) o el total de la receta.
    // Usamos los valores tal cual ya que representan la porción que se va a comer.
    const servings = recipe.servings || 1
    const { error } = await sb.from('food_log_entries').insert({
      user_id:            user.id,
      log_date:           today,
      meal_type:          mealType,
      logging_method:     'manual',
      calories_kcal:      Math.round((recipe.calories_kcal || 0) / servings),
      protein_g:          Math.round(((recipe.protein_g || 0) / servings) * 10) / 10,
      carbs_g:            Math.round(((recipe.carbs_g || 0) / servings) * 10) / 10,
      fat_g:              Math.round(((recipe.fat_g || 0) / servings) * 10) / 10,
      fiber_g:            recipe.fiber_g != null ? Math.round((recipe.fiber_g / servings) * 10) / 10 : null,
      quantity_grams:     1,   // 1 = "1 ración"; no es un alimento en gramos
      custom_description: `${recipe.title} (1 ración)`,
      deleted_at:         null,
    })
    if (!error) setLogged(true)
  }

  function toggleStep(n: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n); else next.add(n)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center gap-2">
        <p className="text-2xl">🤷</p>
        <p className="text-stone-500 text-sm">Receta no encontrada</p>
        <button onClick={() => router.back()} className="text-orange-500 text-sm font-medium mt-2">Volver</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Imagen hero */}
      <div className="relative">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full object-cover"
            style={{ height: 260 }}
          />
        ) : (
          <div className="w-full flex items-center justify-center" style={{ height: 200, background: 'linear-gradient(160deg, #F97316 0%, #EA6C0A 100%)' }}>
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />

        {/* Botón atrás */}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 w-9 h-9 rounded-full flex items-center justify-center active:opacity-70"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Contenido */}
      <div className="px-4 -mt-4 relative z-10">
        {/* Tarjeta título */}
        <div className="rounded-2xl bg-white p-4 mb-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          {recipe.cuisine && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block"
              style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
              {recipe.cuisine}
            </span>
          )}
          <h1 className="text-lg font-black text-stone-800 leading-snug">{recipe.title}</h1>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-3">
            {recipe.ready_in_min && (
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Clock className="w-3.5 h-3.5" />
                {recipe.ready_in_min} min
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-stone-500">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} {recipe.servings === 1 ? 'ración' : 'raciones'}
            </span>
            {recipe.calories_kcal && (
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Flame className="w-3.5 h-3.5" style={{ color: '#F97316' }} />
                {Math.round(recipe.calories_kcal)} kcal
              </span>
            )}
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {MACRO_ITEMS.map(({ key, label, unit, color, bg }) => {
              const val = recipe[key]
              return (
                <div key={key} className="rounded-xl p-2 text-center" style={{ background: bg }}>
                  <p className="text-sm font-black" style={{ color }}>
                    {val != null ? Math.round(val as number) : '—'}
                    <span className="text-[9px] font-medium ml-0.5">{unit}</span>
                  </p>
                  <p className="text-[9px] text-stone-500 mt-0.5">{label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Ingredientes */}
        {ingredients.length > 0 && (
          <section className="mb-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">
              Ingredientes · {ingredients.length}
            </p>
            <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #F0EDE9' }}>
              {ingredients.map((ing, i) => (
                <div
                  key={ing.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < ingredients.length - 1 ? '1px solid #F5F5F4' : 'none' }}
                >
                  <div className="flex-1">
                    <span className="text-sm text-stone-700 font-medium capitalize">{ing.ingredient_name}</span>
                    {ing.notes && <span className="text-xs text-stone-400 ml-1">({ing.notes})</span>}
                  </div>
                  {ing.quantity != null && (
                    <span className="text-sm font-bold text-stone-800 ml-3">
                      {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(1)}
                      {ing.unit && <span className="font-normal text-stone-500 ml-0.5">{ing.unit}</span>}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Preparación */}
        {steps.length > 0 && (
          <section className="mb-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">
              Preparación · {steps.length} pasos
            </p>
            <div className="space-y-2">
              {steps.map(step => {
                const done = completedSteps.has(step.step_number)
                return (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.step_number)}
                    className="w-full rounded-2xl bg-white p-4 flex items-start gap-3 text-left active:scale-[0.99] transition-all"
                    style={{
                      border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : '#F0EDE9'}`,
                      background: done ? 'rgba(16,185,129,0.04)' : 'white',
                    }}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[11px] font-black text-white"
                        style={{ background: '#F97316', minWidth: 20 }}>
                        {step.step_number}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed flex-1" style={{ color: done ? '#A8A29E' : '#292524', textDecoration: done ? 'line-through' : 'none' }}>
                      {step.instruction}
                    </p>
                    {step.duration_min && (
                      <span className="text-[10px] text-stone-400 flex-shrink-0 ml-1 mt-0.5">{step.duration_min}min</span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Registrar en diario */}
        <div className="pb-6 space-y-3">
          {/* Selector de tipo de comida */}
          {!logged && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Añadir a
              </p>
              <div className="grid grid-cols-4 gap-2">
                {VALID_MEAL_TYPES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType(m)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 12,
                      border: mealType === m ? '1.5px solid #F97316' : '1.5px solid #E7E5E4',
                      background: mealType === m ? '#FFF7ED' : 'white',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{MEAL_EMOJIS[m]}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: mealType === m ? '#F97316' : '#78716C' }}>
                      {MEAL_LABELS[m]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleLogToDay}
            disabled={logged}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{
              background: logged ? 'rgba(16,185,129,0.1)' : 'linear-gradient(135deg, #F97316, #EA6C0A)',
              color: logged ? '#10B981' : 'white',
              boxShadow: logged ? 'none' : '0 4px 14px rgba(249,115,22,0.35)',
            }}
          >
            {logged ? (
              <><CheckCircle2 className="w-4 h-4" /> Registrado en {MEAL_LABELS[mealType]}</>
            ) : (
              <><Plus className="w-4 h-4" /> Registrar en {MEAL_LABELS[mealType]}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
