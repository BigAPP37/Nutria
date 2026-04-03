'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, AlertTriangle } from 'lucide-react'
import type { MealType } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AILogItem {
  name:       string
  grams:      number
  kcal:       number
  confidence: number
}

interface AILogResult {
  dish_name:  string
  items:      AILogItem[]
  total_kcal: number
}

interface NaturalTextLoggerProps {
  userId:    string
  logDate:   string
  onSaved:   () => void   // called after confirm → dashboard reloads
  onClose:   () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch:     'Almuerzo',
  dinner:    'Cena',
  snack:     'Snack',
}

const LOADING_MESSAGES = [
  'Identificando alimentos...',
  'Estimando porciones...',
  'Calculando nutrientes...',
]

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Infiere la comida según la hora del día */
function inferMealType(): MealType {
  const h = new Date().getHours()
  if (h >= 6  && h < 11) return 'breakfast'
  if (h >= 11 && h < 16) return 'lunch'
  if (h >= 19 && h < 24) return 'dinner'
  return 'snack'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NaturalTextLogger({ userId, logDate, onSaved, onClose }: NaturalTextLoggerProps) {
  const [text,     setText]     = useState('')
  const [mealType, setMealType] = useState<MealType>(inferMealType())
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'result' | 'error'>('idle')
  const [result,   setResult]   = useState<AILogResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])

  const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortCtrl    = useRef<AbortController | null>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)

  // Rotate loading messages every 2s
  useEffect(() => {
    if (status !== 'loading') {
      if (loadingTimer.current) clearInterval(loadingTimer.current)
      return
    }
    let i = 0
    loadingTimer.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[i])
    }, 2000)
    return () => { if (loadingTimer.current) clearInterval(loadingTimer.current) }
  }, [status])

  // Cleanup abort on unmount
  useEffect(() => () => { abortCtrl.current?.abort() }, [])

  async function handleAnalyze() {
    if (!text.trim()) return

    setStatus('loading')
    setLoadingMsg(LOADING_MESSAGES[0])
    setErrorMsg(null)
    setResult(null)

    abortCtrl.current = new AbortController()
    const timeoutId = setTimeout(() => abortCtrl.current?.abort(), 25_000)

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-log`, {
        method:  'POST',
        signal:  abortCtrl.current.signal,
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          method:       'natural_text',
          payload:      text.trim(),
          user_id:      userId,
          meal_type:    mealType,
          country_code: 'ES',
          timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
          log_date:     logDate,
        }),
      })

      clearTimeout(timeoutId)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: AILogResult = await res.json()
      setResult(data)
      setStatus('result')
    } catch (err) {
      clearTimeout(timeoutId)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      setErrorMsg(
        isTimeout
          ? 'El análisis tardó demasiado. ¿Lo intentamos de nuevo?'
          : 'No pudimos analizar el texto. ¿Lo intentamos de nuevo?'
      )
      setStatus('error')
    }
  }

  function handleConfirm() {
    onSaved()   // Edge Function ya insertó — solo recargar
  }

  function handleRetry() {
    setStatus('idle')
    setErrorMsg(null)
    setResult(null)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-md rounded-t-3xl flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 leading-tight">Registrar con texto</p>
              <p className="text-xs text-stone-400">Describe lo que comiste</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Textarea */}
          <div>
            <textarea
              ref={textareaRef}
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={status === 'loading'}
              placeholder="Ej: dos huevos fritos con jamón y un café con leche"
              rows={3}
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:bg-stone-50"
            />
          </div>

          {/* Meal selector */}
          <div>
            <p className="text-xs text-stone-500 mb-2">Añadir a</p>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealType(m)}
                  disabled={status === 'loading'}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 ${
                    mealType === m
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* ── Loading ── */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-[3px] border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-sm text-stone-500 animate-pulse">{loadingMsg}</p>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && errorMsg && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{errorMsg}</p>
            </div>
          )}

          {/* ── Result ── */}
          {status === 'result' && result && (
            <div className="space-y-3">
              {/* Dish header */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
                <p className="text-[11px] text-white/70 mb-1">Plato detectado</p>
                <p className="text-base font-bold leading-snug">{result.dish_name}</p>
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-white/20">
                  <p className="text-[11px] text-white/70">Total calorías</p>
                  <p className="text-2xl font-bold leading-none">{result.total_kcal} <span className="text-sm font-normal">kcal</span></p>
                </div>
              </div>

              {/* Items list */}
              <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden">
                {result.items.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < result.items.length - 1 ? 'border-b border-stone-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-stone-800">{item.name}</p>
                        {item.confidence < 0.6 && (
                          <span className="text-[10px] font-medium bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            Estimación aproximada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">{item.grams}g</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-700 flex-shrink-0 ml-3">
                      {item.kcal} kcal
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer buttons ── */}
        <div className="px-5 pb-6 pt-3 border-t border-stone-100 flex-shrink-0 space-y-2.5">
          {(status === 'idle' || status === 'error') && (
            <>
              {status === 'error' ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:bg-orange-700 transition-colors"
                >
                  Intentar de nuevo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!text.trim()}
                  className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Analizar
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}

          {status === 'loading' && (
            <button
              type="button"
              onClick={() => { abortCtrl.current?.abort(); setStatus('idle') }}
              className="w-full py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
          )}

          {status === 'result' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:bg-orange-700 transition-colors"
              >
                Confirmar y guardar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
