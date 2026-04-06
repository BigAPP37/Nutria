'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '☕',
  lunch:     '🍽',
  dinner:    '🌙',
  snack:     '🍎',
}

const LOADING_MESSAGES = [
  'Identificando alimentos...',
  'Estimando porciones...',
  'Calculando nutrientes...',
]

/** Infiere la comida según la hora del día */
function inferMealType(): MealType {
  const h = new Date().getHours()
  if (h >= 6  && h < 11) return 'breakfast'
  if (h >= 11 && h < 16) return 'lunch'
  if (h >= 19 && h < 24) return 'dinner'
  return 'snack'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NaturalTextLogger({ logDate, onSaved, onClose }: NaturalTextLoggerProps) {
  const [text,     setText]     = useState('')
  const [mealType, setMealType] = useState<MealType>(inferMealType())
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'result' | 'error'>('idle')
  const [result,   setResult]   = useState<AILogResult | null>(null)
  const [logEntryIds, setLogEntryIds] = useState<string[]>([])
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
      const res = await fetch('/api/ai-log', {
        method:  'POST',
        signal:  abortCtrl.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method:       'text',
          payload:      text.trim(),
          meal_type:    mealType,
          country_code: 'ES',
          timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
          log_date:     logDate,
        }),
      })

      clearTimeout(timeoutId)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      // Mapear AiLogResponse al formato interno de este componente
      const data = await res.json()
      if (!data.success) throw new Error('La IA no pudo analizar el texto')

      setLogEntryIds(data.log_entry_ids ?? [])
      setResult({
        dish_name:  data.plato_descripcion ?? text.trim(),
        total_kcal: Math.round(data.totales?.calorias ?? 0),
        items: (data.alimentos ?? []).map((a: {
          nombre: string; cantidad_gramos: number;
          calorias_estimadas: number; confianza: number
        }) => ({
          name:       a.nombre,
          grams:      a.cantidad_gramos,
          kcal:       Math.round(a.calorias_estimadas),
          confidence: a.confianza,
        })),
      })
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
    onSaved()   // /api/ai-log ya insertó — solo recargar dashboard
  }

  async function handleDiscard() {
    // Eliminar las entradas que /api/ai-log ya insertó
    if (logEntryIds.length > 0) {
      const supabase = createClient()
      await supabase.from('food_log_entries').delete().in('id', logEntryIds)
    }
    onClose()
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
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#FAFAF9',
        width: '100%',
        maxWidth: 448,
        borderRadius: '24px 24px 0 0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
      }}>

        {/* Drag handle */}
        <div style={{ paddingTop: 12, paddingBottom: 4, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D6D3D1' }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 16px',
          borderBottom: '1px solid #E7E5E4',
          flexShrink: 0,
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #FED7AA 0%, #FB923C 100%)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
            }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>
                Registrar con texto
              </p>
              <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>Describe lo que comiste</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#F5F4F3',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#78716C',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
              style={{
                width: '100%',
                borderRadius: 16,
                border: '1.5px solid #E7E5E4',
                padding: '14px 16px',
                fontSize: 14,
                color: '#1C1917',
                background: 'white',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
            />
          </div>

          {/* Meal selector */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Añadir a
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealType(m)}
                  disabled={status === 'loading'}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 12,
                    border: mealType === m ? '1.5px solid #F97316' : '1.5px solid #E7E5E4',
                    background: mealType === m ? '#FFF7ED' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 17 }}>{MEAL_EMOJIS[m]}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mealType === m ? '#F97316' : '#78716C',
                    lineHeight: 1,
                  }}>
                    {MEAL_LABELS[m]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Loading ── */}
          {status === 'loading' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: '32px 0',
            }}>
              {/* Spinner triple anillo naranja */}
              <div style={{ position: 'relative', width: 56, height: 56 }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '3px solid #FED7AA',
                  borderTopColor: '#F97316',
                  animation: 'spin 0.9s linear infinite',
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 8,
                  borderRadius: '50%',
                  border: '2.5px solid #FED7AA',
                  borderTopColor: '#FB923C',
                  animation: 'spin 1.2s linear infinite reverse',
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 16,
                  borderRadius: '50%',
                  border: '2px solid #FED7AA',
                  borderTopColor: '#FDBA74',
                  animation: 'spin 1.5s linear infinite',
                }} />
              </div>
              <p style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1C1917',
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                {loadingMsg}
              </p>
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
              `}</style>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 14,
            }}>
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p style={{ fontSize: 13, color: '#92400E' }}>{errorMsg}</p>
            </div>
          )}

          {/* ── Result ── */}
          {status === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Dish header */}
              <div style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                borderRadius: 18,
                padding: '18px 20px',
                color: 'white',
                boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
              }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Plato detectado
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{result.dish_name}</p>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Total calorías</p>
                  <div className="flex items-end gap-1">
                    <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>
                      {result.total_kcal}
                    </span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>kcal</span>
                  </div>
                </div>
              </div>

              {/* Items list */}
              <div style={{
                background: 'white',
                border: '1px solid #E7E5E4',
                borderRadius: 16,
                overflow: 'hidden',
              }}>
                {result.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i < result.items.length - 1 ? '1px solid #F9F8F8' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>{item.name}</p>
                        {item.confidence < 0.6 && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            background: '#FEF3C7',
                            color: '#B45309',
                            padding: '2px 7px',
                            borderRadius: 99,
                            whiteSpace: 'nowrap',
                          }}>
                            Estimación
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>{item.grams}g</p>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 12, textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>{item.kcal}</p>
                      <p style={{ fontSize: 10, color: '#A8A29E' }}>kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer buttons ── */}
        <div style={{
          padding: '12px 20px 28px',
          borderTop: '1px solid #E7E5E4',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#FAFAF9',
        }}>
          {(status === 'idle' || status === 'error') && (
            <>
              {status === 'error' ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 15,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Intentar de nuevo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!text.trim()}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: 16,
                    background: text.trim()
                      ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                      : '#E7E5E4',
                    color: text.trim() ? 'white' : '#A8A29E',
                    fontWeight: 700,
                    fontSize: 15,
                    border: 'none',
                    cursor: text.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: text.trim() ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Analizar
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 16,
                  background: 'transparent',
                  color: '#78716C',
                  fontWeight: 500,
                  fontSize: 14,
                  border: '1.5px solid #E7E5E4',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </>
          )}

          {status === 'loading' && (
            <button
              type="button"
              onClick={() => { abortCtrl.current?.abort(); setStatus('idle') }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 16,
                background: 'transparent',
                color: '#78716C',
                fontWeight: 500,
                fontSize: 14,
                border: '1.5px solid #E7E5E4',
                cursor: 'pointer',
              }}
            >
              Cancelar análisis
            </button>
          )}

          {status === 'result' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleDiscard}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: 16,
                  background: 'transparent',
                  color: '#78716C',
                  fontWeight: 600,
                  fontSize: 14,
                  border: '1.5px solid #E7E5E4',
                  cursor: 'pointer',
                }}
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 2,
                  padding: '15px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                }}
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
