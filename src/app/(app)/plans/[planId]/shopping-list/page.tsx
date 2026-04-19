'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ShoppingCart, Share2, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'
import { AppPage, AppPanel, AppSectionHeader } from '@/components/ui/AppPage'
import { aggregateIngredients, groupByCategory, type ShoppingItem } from '@/lib/shopping'

type WeekFilter = 'all' | 'week1' | 'week2'

const WEEK_OPTIONS: { key: WeekFilter; label: string }[] = [
  { key: 'all',   label: 'Todo el plan' },
  { key: 'week1', label: 'Semana 1' },
  { key: 'week2', label: 'Semana 2' },
]

function storageKey(planId: string, week: WeekFilter) {
  return `nutria-shopping-${planId}-${week}`
}

function loadChecked(planId: string, week: WeekFilter): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(planId, week))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveChecked(planId: string, week: WeekFilter, checked: Set<string>) {
  try {
    localStorage.setItem(storageKey(planId, week), JSON.stringify([...checked]))
  } catch { /* noop */ }
}

function fmt(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(1).replace('.0', '')} kg`
  return `${g} g`
}

export default function ShoppingListPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params)
  const router = useRouter()

  const [planTitle, setPlanTitle] = useState('')
  const [durationDays, setDurationDays] = useState(7)
  const [week, setWeek] = useState<WeekFilter>('all')
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchItems = useCallback(async (planId: string, filter: WeekFilter, duration: number) => {
    const sb = createClient()

    const allDaysRes = await sb
      .from('meal_plan_days')
      .select('id, day_number')
      .eq('plan_id', planId)
      .order('day_number')
    const allDays = allDaysRes.data ?? []

    const dayIds = allDays
      .filter(d => {
        if (filter === 'week1') return d.day_number <= 7
        if (filter === 'week2') return d.day_number > 7
        return true
      })
      .map(d => d.id)

    if (!dayIds.length) { setItems([]); return }

    const mealsRes = await sb
      .from('meal_plan_meals')
      .select('recipe_id')
      .in('day_id', dayIds)
    const recipeIds = [...new Set((mealsRes.data ?? []).map(m => m.recipe_id).filter(Boolean))]

    if (!recipeIds.length) { setItems([]); return }

    const ingrRes = await sb
      .from('recipe_ingredients')
      .select('ingredient_name, quantity, unit')
      .in('recipe_id', recipeIds)
    const raw = ingrRes.data ?? []

    setItems(aggregateIngredients(raw))
    setChecked(loadChecked(planId, filter))
  }, [])

  useEffect(() => {
    const sb = createClient()
    async function init() {
      setLoading(true)
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const planRes = await sb
        .from('meal_plans')
        .select('title, duration_days')
        .eq('id', planId)
        .maybeSingle()
      const plan = planRes.data
      if (plan) {
        setPlanTitle(plan.title)
        setDurationDays(plan.duration_days ?? 7)
      }

      await fetchItems(planId, 'all', plan?.duration_days ?? 7)
      setLoading(false)
    }
    init()
  }, [planId, router, fetchItems])

  async function handleWeekChange(next: WeekFilter) {
    setWeek(next)
    setLoading(true)
    await fetchItems(planId, next, durationDays)
    setLoading(false)
  }

  function toggle(name: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      saveChecked(planId, week, next)
      return next
    })
  }

  function toggleCategory(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(next.has(key) ? key : ''); else next.add(key)
      // toggle
      if (prev.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  function clearChecked() {
    const empty = new Set<string>()
    setChecked(empty)
    saveChecked(planId, week, empty)
  }

  async function handleShare() {
    const groups = groupByCategory(items)
    const lines: string[] = [`🛒 Lista de compra — ${planTitle}`, '']
    for (const { category, items: catItems } of groups) {
      lines.push(`${category.emoji} ${category.label}`)
      for (const item of catItems) {
        const check = checked.has(item.name) ? '✅' : '◻️'
        const price = item.priceEur != null ? ` (~€${item.priceEur.toFixed(2)})` : ''
        lines.push(`${check} ${item.name} — ${fmt(item.totalGrams)}${price}`)
      }
      lines.push('')
    }
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  const groups = groupByCategory(items)
  const totalPrice = items.reduce((acc, i) => acc + (i.priceEur ?? 0), 0)
  const checkedCount = items.filter(i => checked.has(i.name)).length
  const has2Weeks = durationDays > 7

  return (
    <AppPage>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: 'white', border: '1px solid #F0EDE9' }}
        >
          <ChevronLeft className="h-4 w-4 text-stone-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Lista de compra</p>
          <p className="truncate text-sm font-bold text-stone-800">{planTitle}</p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all active:scale-95"
          style={{ background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.08)', color: copied ? '#10B981' : '#F97316' }}
        >
          <Share2 className="h-3.5 w-3.5" />
          {copied ? 'Copiado' : 'Compartir'}
        </button>
      </div>

      {/* Filtro semanas (solo si el plan dura >7 días) */}
      {has2Weeks && (
        <section className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {WEEK_OPTIONS.map(opt => {
              const active = week === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => handleWeekChange(opt.key)}
                  className="flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: active ? 'linear-gradient(135deg,#F97316,#EA6C0A)' : 'white',
                    color: active ? 'white' : '#78716C',
                    border: `1px solid ${active ? 'transparent' : '#F0EDE9'}`,
                    boxShadow: active ? '0 4px 12px rgba(249,115,22,0.24)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Resumen */}
      {!loading && items.length > 0 && (
        <section className="mb-4">
          <AppPanel className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: 'rgba(249,115,22,0.08)' }}>
                  <ShoppingCart className="h-4 w-4" style={{ color: '#F97316' }} />
                </div>
                <div>
                  <p className="text-sm font-black text-stone-800">{items.length} ingredientes</p>
                  <p className="text-xs text-stone-400">{checkedCount} en el carro · est. €{totalPrice.toFixed(2)}</p>
                </div>
              </div>
              {checkedCount > 0 && (
                <button
                  onClick={clearChecked}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'rgba(120,113,108,0.08)', color: '#78716C' }}
                >
                  Limpiar
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-stone-400">
              * Precios orientativos Mercadona España. Toca un ingrediente para marcarlo.
            </p>
          </AppPanel>
        </section>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-[1.5rem] bg-white" style={{ border: '1px solid #F0EDE9' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <AppPanel className="p-8 text-center">
          <p className="mb-2 text-3xl">🛒</p>
          <p className="text-sm font-medium text-stone-600">No hay ingredientes para este rango</p>
        </AppPanel>
      ) : (
        <div className="space-y-4">
          {groups.map(({ category, items: catItems }) => {
            const isCollapsed = collapsed.has(category.key)
            const catChecked = catItems.filter(i => checked.has(i.name)).length
            return (
              <section key={category.key}>
                <button
                  onClick={() => toggleCategory(category.key)}
                  className="mb-2 flex w-full items-center justify-between px-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{category.emoji}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                      {category.label}
                    </span>
                    {catChecked > 0 && (
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                        {catChecked}/{catItems.length}
                      </span>
                    )}
                  </div>
                  {isCollapsed
                    ? <ChevronDown className="h-3.5 w-3.5 text-stone-300" />
                    : <ChevronUp className="h-3.5 w-3.5 text-stone-300" />
                  }
                </button>

                {!isCollapsed && (
                  <div className="rounded-[1.5rem] bg-white overflow-hidden" style={{ border: '1px solid #F0EDE9' }}>
                    {catItems.map((item, idx) => {
                      const isChecked = checked.has(item.name)
                      return (
                        <button
                          key={item.name}
                          onClick={() => toggle(item.name)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-stone-50"
                          style={{ borderBottom: idx < catItems.length - 1 ? '1px solid #F5F5F4' : 'none' }}
                        >
                          {isChecked
                            ? <CheckSquare className="h-4 w-4 flex-shrink-0" style={{ color: '#10B981' }} />
                            : <Square className="h-4 w-4 flex-shrink-0 text-stone-200" />
                          }
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium capitalize leading-snug"
                              style={{ color: isChecked ? '#A8A29E' : '#292524', textDecoration: isChecked ? 'line-through' : 'none' }}
                            >
                              {item.name}
                            </p>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-sm font-bold text-stone-700">{fmt(item.totalGrams)}</span>
                            {item.priceEur != null && (
                              <span className="text-[10px] text-stone-400">~€{item.priceEur.toFixed(2)}</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}

          <p className="pb-6 text-center text-[10px] text-stone-400">
            Precios orientativos · referencia Mercadona España 2025
          </p>
        </div>
      )}
    </AppPage>
  )
}
