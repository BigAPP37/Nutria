'use client'

import { useState, useEffect } from 'react'
import { Timer, User, BarChart2, CalendarDays, Pencil, Check, X } from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────
const STORAGE_KEY  = 'nutria-fast-v1'
const HISTORY_KEY  = 'nutria-fast-history-v1'

const PROTOCOLS = [
  { label: '12:12', hours: 12 },
  { label: '16:8',  hours: 16 },
  { label: '18:6',  hours: 18 },
  { label: '20:4',  hours: 20 },
]

const PHASES = [
  {
    fromH: 0, emoji: '🍽️', name: 'Digestión', color: '#64748B',
    desc: 'Tu cuerpo procesa la última comida',
    detail: 'La insulina está elevada para transportar la glucosa a las células. El organismo prioriza los hidratos de carbono como fuente de energía. El hígado almacena el exceso como glucógeno.',
    keyFact: 'Los niveles de insulina tardan entre 3 y 5 horas en normalizarse tras una comida.',
  },
  {
    fromH: 4, emoji: '📉', name: 'Glucosa baja', color: '#60A5FA',
    desc: 'La insulina empieza a descender',
    detail: 'Las reservas de glucógeno hepático empiezan a vaciarse. La insulina baja y el glucagón sube, iniciando la movilización de energía almacenada. El cuerpo entra en un estado metabólico más flexible.',
    keyFact: 'Reducir los picos de insulina mejora la sensibilidad a ella y reduce el riesgo de diabetes tipo 2.',
  },
  {
    fromH: 8, emoji: '🔥', name: 'Quema de grasa', color: '#F97316',
    desc: 'El cuerpo usa grasa como combustible',
    detail: 'El glucógeno hepático está casi agotado. El organismo activa la lipólisis: libera ácidos grasos del tejido adiposo y los convierte en energía. La oxidación de grasas aumenta significativamente.',
    keyFact: 'Estudios en el Nutrition Journal confirman que el ayuno intermitente combinado con restricción calórica reduce significativamente la masa grasa y mejora la salud cardiovascular.',
  },
  {
    fromH: 12, emoji: '⚡', name: 'Cetosis', color: '#A78BFA',
    desc: 'Se producen cetonas para el cerebro',
    detail: 'El hígado transforma los ácidos grasos en cuerpos cetónicos (beta-hidroxibutirato, acetoacetato). El cerebro los usa como combustible alternativo a la glucosa. Muchas personas reportan más claridad mental en este punto.',
    keyFact: 'La cetosis nutricional reduce la inflamación sistémica y puede mejorar la función cognitiva, según revisiones en Current Obesity Reports.',
  },
  {
    fromH: 16, emoji: '💪', name: 'Cetosis profunda', color: '#8B5CF6',
    desc: 'Máxima eficiencia metabólica',
    detail: 'Es el punto de referencia del protocolo 16:8, el más respaldado por la investigación. La producción de cetonas es alta, la oxidación de grasa está en su pico y los marcadores inflamatorios bajan. El corazón se beneficia especialmente en este rango.',
    keyFact: 'La American Heart Association y el Nutrition Journal asocian ayunos de 16+ horas con reducción del LDL, triglicéridos y presión arterial.',
  },
  {
    fromH: 18, emoji: '♻️', name: 'Autofagia', color: '#10B981',
    desc: 'Las células se limpian y regeneran',
    detail: 'La autofagia ("comerse a sí mismo" en griego) es el proceso por el que las células descomponen y reciclan sus componentes dañados. Es la respuesta de limpieza celular más potente que existe. Yoshinori Ohsumi recibió el Nobel de Medicina 2016 por describir este mecanismo.',
    keyFact: 'El National Institute on Aging señala que la autofagia protege frente al envejecimiento celular, el cáncer y enfermedades neurodegenerativas como el Alzheimer.',
  },
]

const SCIENCE_SOURCES = [
  { title: 'Intermittent fasting combined with calorie restriction is effective for weight loss and cardio-protection in obese women', journal: 'Nutrition Journal' },
  { title: 'Intermittent Fasting in Cardiovascular Disorders — An Overview', journal: 'Nutrients / MDPI' },
  { title: 'Time-Restricted Eating, Intermittent Fasting, and Fasting-Mimicking Diets in Weight Loss', journal: 'Current Obesity Reports' },
  { title: 'Intermittent fasting and weight loss', journal: 'College of Family Physicians of Canada' },
  { title: 'Intermittent fasting interventions for treatment of overweight and obesity in adults: a systematic review and meta-analysis', journal: 'JBI Database of Systematic Reviews' },
  { title: 'Calorie restriction and fasting diets: What do we know?', journal: 'National Institute on Aging (NIA)' },
  { title: 'Losing Weight', journal: 'American Heart Association' },
]

// ── Types ──────────────────────────────────────────────────────────────────────
type FastSession = { started_at: string; protocol_hours: number }
type FastRecord  = { started_at: string; ended_at: string; actual_hours: number; protocol_hours: number; completed: boolean }

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function formatHM(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(isoStr: string) {
  const d = new Date(isoStr)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === new Date(today.getTime() + 86400_000).toDateString()) return 'Mañana'
  return d.toLocaleDateString('es-ES', { weekday: 'short' })
}

function addHoursISO(isoStr: string, h: number) {
  return new Date(new Date(isoStr).getTime() + h * 3600_000).toISOString()
}

function toDatetimeLocal(isoStr: string) {
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getCurrentPhase(elapsedSecs: number) {
  const h = elapsedSecs / 3600
  let phase = PHASES[0]
  for (const p of PHASES) { if (h >= p.fromH) phase = p; else break }
  return phase
}


function secsUntilPhase(elapsedSecs: number, fromH: number) {
  return Math.max(fromH * 3600 - elapsedSecs, 0)
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function TabNav({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const tabs = [
    { Icon: Timer,       tip: 'Cronómetro' },
    { Icon: User,        tip: 'Etapas' },
    { Icon: BarChart2,   tip: 'Historial' },
    { Icon: CalendarDays,tip: 'Horario' },
  ]
  return (
    <div className="flex items-center justify-center px-6 py-4" style={{ gap: 0 }}>
      {tabs.map(({ Icon }, i) => (
        <div key={i} className="flex items-center" style={{ flex: i < tabs.length - 1 ? '1 1 auto' : undefined }}>
          <button
            onClick={() => onSelect(i)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            style={{ background: active === i ? 'white' : 'rgba(255,255,255,0.1)' }}
          >
            <Icon className="w-4 h-4" style={{ color: active === i ? '#0F1117' : 'rgba(255,255,255,0.45)' }} />
          </button>
          {i < tabs.length - 1 && (
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)', minWidth: 8 }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab 0: Cronómetro ─────────────────────────────────────────────────────────
function TimerTab({
  session, elapsed, protocol, setProtocol, onStart, onStop
}: {
  session: FastSession | null
  elapsed: number
  protocol: number
  setProtocol: (h: number) => void
  onStart: () => void
  onStop: () => void
}) {
  const targetSecs = (session?.protocol_hours ?? protocol) * 3600
  const progress   = Math.min(elapsed / targetSecs, 1)
  const done       = elapsed >= targetSecs && !!session
  const remaining  = Math.max(targetSecs - elapsed, 0)
  const phase      = getCurrentPhase(elapsed)

  const R = 72; const STROKE = 8
  const SIZE = (R + STROKE) * 2 + 4; const CENTER = SIZE / 2
  const C = 2 * Math.PI * R
  const dashOffset = C * (1 - progress)
  const ringColor  = done ? '#10B981' : phase.color

  const fatBurnSecs  = secsUntilPhase(elapsed, 8)
  const autophagySecs = secsUntilPhase(elapsed, 18)

  return (
    <div className="px-5 pb-4">
      {/* Protocol pills */}
      <div className="flex gap-1.5 justify-center mb-5">
        {PROTOCOLS.map(p => (
          <button
            key={p.label}
            onClick={() => !session && setProtocol(p.hours)}
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all"
            style={{
              background: protocol === p.hours ? phase.color + '33' : 'rgba(255,255,255,0.07)',
              color: protocol === p.hours ? phase.color : 'rgba(255,255,255,0.35)',
              border: `1px solid ${protocol === p.hours ? phase.color + '66' : 'transparent'}`,
              cursor: session ? 'default' : 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
            {session && (
              <circle
                cx={CENTER} cy={CENTER} r={R} fill="none"
                stroke={ringColor} strokeWidth={STROKE} strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s', filter: `drop-shadow(0 0 8px ${ringColor}88)` }}
              />
            )}
          </svg>
          {/* Centro del ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span style={{ fontSize: 28 }}>{session ? phase.emoji : '🌙'}</span>
            <span className="text-[10px] font-semibold text-center leading-tight px-2"
              style={{ color: session ? phase.color : 'rgba(255,255,255,0.3)' }}>
              {session ? phase.name : 'Sin ayuno'}
            </span>
          </div>
        </div>

        {/* Tiempo */}
        <p className="font-black tabular-nums mt-3"
          style={{ fontSize: 44, letterSpacing: '-2px', color: done ? '#10B981' : session ? 'white' : '#44403C' }}>
          {session ? formatTime(elapsed) : '00:00:00'}
        </p>
        {session && !done && (
          <p className="text-stone-500 text-xs mt-0.5">{formatTime(remaining)} restantes</p>
        )}
        {done && <p className="text-emerald-400 text-xs font-bold mt-0.5">¡Objetivo alcanzado! 🎉</p>}
      </div>

      {/* Mini stats */}
      {session && (
        <div className="flex gap-2 mt-4 mb-4">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <p className="text-[10px] text-stone-500 mb-1">🔥 Quema de grasa</p>
            <p className="text-sm font-bold" style={{ color: fatBurnSecs === 0 ? '#F97316' : 'rgba(255,255,255,0.7)' }}>
              {fatBurnSecs === 0 ? 'Activa' : formatTime(fatBurnSecs)}
            </p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-[10px] text-stone-500 mb-1">♻️ Autofagia</p>
            <p className="text-sm font-bold" style={{ color: autophagySecs === 0 ? '#10B981' : 'rgba(255,255,255,0.7)' }}>
              {autophagySecs === 0 ? 'Activa' : formatTime(autophagySecs)}
            </p>
          </div>
        </div>
      )}

      {/* Botón */}
      {session ? (
        <button onClick={onStop}
          className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm active:scale-[0.98] transition-transform"
          style={{ background: done ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.12)', color: done ? '#10B981' : '#F87171' }}>
          <span className="w-3 h-3 rounded-sm" style={{ background: done ? '#10B981' : '#F87171', display: 'inline-block' }} />
          {done ? 'Completar ayuno' : 'Finalizar ayuno'}
        </button>
      ) : (
        <button onClick={onStart}
          className="w-full py-3 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
          Empezar ayuno
        </button>
      )}
    </div>
  )
}

// ── Tab 1: Etapas ─────────────────────────────────────────────────────────────
function PhasesTab({ elapsed }: { elapsed: number }) {
  const elapsedH   = elapsed / 3600
  const currentIdx = PHASES.reduce((acc, p, i) => elapsedH >= p.fromH ? i : acc, 0)
  const [expanded, setExpanded] = useState<number | null>(currentIdx)
  const [showSources, setShowSources] = useState(false)

  return (
    <div className="px-5 pb-5">
      <p className="text-stone-500 text-xs mb-4 leading-relaxed">
        Cada hora de ayuno activa mecanismos fisiológicos distintos, respaldados por investigación científica. Toca cada etapa para saber más.
      </p>

      <div className="space-y-2">
        {PHASES.map((phase, i) => {
          const isActive  = i === currentIdx
          const isPassed  = i < currentIdx
          const isFuture  = i > currentIdx
          const isOpen    = expanded === i

          return (
            <div key={phase.name}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full text-left rounded-2xl p-3 transition-all active:scale-[0.99]"
                style={{
                  background: isActive ? phase.color + '18' : isOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? phase.color + '44' : isOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                  opacity: isFuture && !isOpen ? 0.45 : 1,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: isActive ? phase.color + '28' : 'rgba(255,255,255,0.07)' }}>
                    {phase.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold leading-tight"
                        style={{ color: isActive ? phase.color : isPassed ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)' }}>
                        {phase.name}
                      </p>
                      {isActive && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: phase.color + '33', color: phase.color }}>
                          Ahora
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {phase.desc}
                    </p>
                  </div>
                  <span className="text-[10px] flex-shrink-0 font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {phase.fromH}h+
                  </span>
                </div>

                {/* Contenido expandido */}
                {isOpen && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {phase.detail}
                    </p>
                    <div className="rounded-xl p-3" style={{ background: phase.color + '12', border: `1px solid ${phase.color}25` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: phase.color }}>
                        🔬 Evidencia científica
                      </p>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {phase.keyFact}
                      </p>
                    </div>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Fuentes científicas */}
      <div className="mt-5">
        <button
          onClick={() => setShowSources(v => !v)}
          className="w-full flex items-center justify-between rounded-2xl px-4 py-3 active:opacity-70 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 14 }}>📚</span>
            <span className="text-xs font-semibold text-stone-400">Fuentes científicas</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
              {SCIENCE_SOURCES.length}
            </span>
          </div>
          <span className="text-stone-600 text-xs">{showSources ? '▲' : '▼'}</span>
        </button>

        {showSources && (
          <div className="mt-2 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {SCIENCE_SOURCES.map((src, i) => (
              <div key={i}
                className="px-4 py-3"
                style={{ borderBottom: i < SCIENCE_SOURCES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: 'rgba(255,255,255,0.03)' }}
              >
                <p className="text-[11px] leading-snug text-stone-300 mb-0.5">{src.title}</p>
                <p className="text-[10px] font-semibold" style={{ color: '#818CF8' }}>{src.journal}</p>
              </div>
            ))}
            <div className="px-4 py-2.5" style={{ background: 'rgba(99,102,241,0.06)' }}>
              <p className="text-[10px] text-stone-600 leading-relaxed">
                Nutria usa estas referencias para calcular las etapas del ayuno. No sustituye el consejo médico profesional.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 2: Historial ──────────────────────────────────────────────────────────
function HistoryTab({ history, session, elapsed }: { history: FastRecord[]; session: FastSession | null; elapsed: number }) {
  // Construir los últimos 7 días
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

  const hoursPerDay = days.map(day => {
    let h = history
      .filter(r => r.started_at.startsWith(day))
      .reduce((acc, r) => acc + r.actual_hours, 0)
    // Si hay sesión activa hoy, añadir el tiempo actual
    if (session && day === new Date().toISOString().split('T')[0]) {
      h += elapsed / 3600
    }
    return Math.min(h, 24)
  })

  const maxH   = Math.max(...hoursPerDay, 1)
  const totalH = hoursPerDay.reduce((a, b) => a + b, 0)
  const avgH   = hoursPerDay.filter(h => h > 0).length
    ? totalH / hoursPerDay.filter(h => h > 0).length
    : 0

  const barMaxH = 140

  return (
    <div className="px-5 pb-5">
      <p className="text-white text-sm font-bold mb-4">Tus últimos 7 días</p>

      {/* Barras */}
      <div className="flex items-end gap-1.5" style={{ height: barMaxH }}>
        {days.map((day, i) => {
          const h      = hoursPerDay[i]
          const barH   = h > 0 ? Math.max((h / maxH) * barMaxH, 8) : 0
          const isToday = i === 6
          const label  = dayNames[new Date(day + 'T12:00:00').getDay()]

          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end gap-1.5" style={{ height: barMaxH }}>
              {h > 0 && (
                <p className="text-[9px] font-bold" style={{ color: isToday ? '#818CF8' : 'rgba(255,255,255,0.4)' }}>
                  {h.toFixed(0)}h
                </p>
              )}
              <div
                className="w-full rounded-full transition-all"
                style={{
                  height: barH || 4,
                  background: h > 0
                    ? (isToday ? 'linear-gradient(to top, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.25)')
                    : 'rgba(255,255,255,0.06)',
                  border: h === 0 ? '1.5px solid rgba(255,255,255,0.1)' : 'none',
                  boxShadow: isToday && h > 0 ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
                }}
              />
              <p className="text-[10px]" style={{ color: isToday ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>
                {label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {[
          { label: 'Total', val: `${totalH.toFixed(0)} h`, icon: '⏱️' },
          { label: 'Media diaria', val: `${avgH.toFixed(0)} h`, icon: '📊' },
        ].map(({ label, val, icon }) => (
          <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-lg">{icon}</p>
            <p className="text-white font-black text-base">{val}</p>
            <p className="text-stone-500 text-[10px]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 3: Horario ────────────────────────────────────────────────────────────
function ScheduleTab({ session, onUpdate }: {
  session: FastSession | null
  onUpdate: (newSession: FastSession) => void
}) {
  const [editingStart, setEditingStart] = useState(false)
  const [editingEnd,   setEditingEnd]   = useState(false)
  const [editVal,      setEditVal]      = useState('')

  const startISO  = session?.started_at ?? new Date().toISOString()
  const endISO    = session ? addHoursISO(session.started_at, session.protocol_hours) : null
  const startHour = new Date(startISO).getHours() + new Date(startISO).getMinutes() / 60
  const endH      = session ? session.protocol_hours : 16

  // 24h timeline visualization
  const fastStart = startHour
  const fastEnd   = (startHour + endH) % 24
  const crossesMidnight = fastStart + endH > 24

  function applyEdit(type: 'start' | 'end') {
    if (!editVal || !session) return
    const d = new Date(editVal)
    if (isNaN(d.getTime())) return

    if (type === 'start') {
      const newSession: FastSession = { started_at: d.toISOString(), protocol_hours: session.protocol_hours }
      onUpdate(newSession)
    } else {
      const startD = new Date(session.started_at)
      if (d <= startD) return
      const newHours = (d.getTime() - startD.getTime()) / 3600_000
      const newSession: FastSession = { ...session, protocol_hours: newHours }
      onUpdate(newSession)
    }
    setEditingStart(false)
    setEditingEnd(false)
  }

  return (
    <div className="px-5 pb-5">
      {session ? (
        <>
          <p className="text-white font-bold text-sm mb-1 text-center">
            Ayunando de {formatHM(startISO)} a {endISO ? formatHM(endISO) : '—'}
          </p>
          <p className="text-stone-500 text-xs text-center mb-4">
            {(session.protocol_hours).toFixed(1)}h · termina {endISO ? `${dayLabel(endISO)}, ${formatHM(endISO)}` : '—'}
          </p>

          {/* Timeline visual 24h */}
          <div className="mb-5">
            <div className="flex justify-between text-[10px] text-stone-600 mb-1.5 px-0.5">
              {['0h', '6h', '12h', '18h', '24h'].map(l => <span key={l}>{l}</span>)}
            </div>
            <div className="relative h-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {/* Segmentos */}
              {crossesMidnight ? (
                <>
                  {/* 0 → fastEnd (eating continues from yesterday's fast) */}
                  <div className="absolute top-0 h-full rounded-l-full"
                    style={{ left: 0, width: `${(fastEnd / 24) * 100}%`, background: 'rgba(99,102,241,0.5)' }} />
                  {/* fastStart → 24 */}
                  <div className="absolute top-0 h-full rounded-r-full"
                    style={{ left: `${(fastStart / 24) * 100}%`, right: 0, background: 'rgba(99,102,241,0.5)' }} />
                </>
              ) : (
                <div className="absolute top-0 h-full"
                  style={{
                    left: `${(fastStart / 24) * 100}%`,
                    width: `${(endH / 24) * 100}%`,
                    background: 'rgba(99,102,241,0.5)',
                    borderRadius: 99,
                  }} />
              )}
              {/* Indicador de ahora */}
              {(() => {
                const nowH = new Date().getHours() + new Date().getMinutes() / 60
                return (
                  <div className="absolute top-0 h-full w-0.5 bg-white/70"
                    style={{ left: `${(nowH / 24) * 100}%` }} />
                )
              })()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'rgba(99,102,241,0.5)' }} />
              <span className="text-[10px] text-stone-500">Periodo de ayuno</span>
              <span className="inline-block w-3 h-3 rounded-sm ml-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] text-stone-500">Ingesta</span>
            </div>
          </div>

          {/* Editar inicio */}
          <div className="space-y-2">
            {editingStart ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)' }}>
                <div className="p-3">
                  <p className="text-indigo-300 text-[10px] uppercase tracking-wider mb-2">Hora de inicio</p>
                  <input type="datetime-local" value={editVal} onChange={e => setEditVal(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }} />
                </div>
                <div className="grid grid-cols-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => setEditingStart(false)}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-bold active:opacity-70"
                    style={{ color: '#78716C', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                  <button onClick={() => applyEdit('start')}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-bold active:opacity-70"
                    style={{ color: '#818CF8' }}>
                    <Check className="w-3.5 h-3.5" /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setEditVal(toDatetimeLocal(startISO)); setEditingStart(true); setEditingEnd(false) }}
                className="w-full flex items-center justify-between rounded-2xl p-4 active:opacity-70 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-left">
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-0.5">Empezar ayuno</p>
                  <p className="text-white text-sm font-bold">{dayLabel(startISO)}, {formatHM(startISO)}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Pencil className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-stone-400 text-xs font-semibold">Editar</span>
                </div>
              </button>
            )}

            {/* Editar fin */}
            {endISO && (editingEnd ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)' }}>
                <div className="p-3">
                  <p className="text-indigo-300 text-[10px] uppercase tracking-wider mb-2">Hora de fin</p>
                  <input type="datetime-local" value={editVal} onChange={e => setEditVal(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }} />
                </div>
                <div className="grid grid-cols-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => setEditingEnd(false)}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-bold active:opacity-70"
                    style={{ color: '#78716C', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                  <button onClick={() => applyEdit('end')}
                    className="flex items-center justify-center gap-1.5 py-3 text-sm font-bold active:opacity-70"
                    style={{ color: '#818CF8' }}>
                    <Check className="w-3.5 h-3.5" /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setEditVal(toDatetimeLocal(endISO)); setEditingEnd(true); setEditingStart(false) }}
                className="w-full flex items-center justify-between rounded-2xl p-4 active:opacity-70 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-left">
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-0.5">Finalizar ayuno</p>
                  <p className="text-white text-sm font-bold">{dayLabel(endISO)}, {formatHM(endISO)}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Pencil className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-stone-400 text-xs font-semibold">Editar</span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">🌙</p>
          <p className="text-stone-400 text-sm">Empieza un ayuno para configurar los horarios</p>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export function FastingTracker() {
  const [session, setSession]   = useState<FastSession | null>(null)
  const [elapsed, setElapsed]   = useState(0)
  const [protocol, setProtocol] = useState(16)
  const [history, setHistory]   = useState<FastRecord[]>([])
  const [tab, setTab]           = useState(0)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    function initialize() {
      setMounted(true)
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const s = JSON.parse(raw) as FastSession
          setSession(s)
          setProtocol(s.protocol_hours)
        }
        const hist = localStorage.getItem(HISTORY_KEY)
        if (hist) setHistory(JSON.parse(hist))
      } catch {}
    }
    initialize()
  }, [])

  useEffect(() => {
    if (!session) return
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [session])

  function startFast() {
    const s: FastSession = { started_at: new Date().toISOString(), protocol_hours: protocol }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSession(s)
    setElapsed(0)
  }

  function stopFast() {
    if (!session) return
    const done = elapsed >= session.protocol_hours * 3600
    const record: FastRecord = {
      started_at:    session.started_at,
      ended_at:      new Date().toISOString(),
      actual_hours:  elapsed / 3600,
      protocol_hours: session.protocol_hours,
      completed:     done,
    }
    const newHistory = [...history, record].slice(-60)
    setHistory(newHistory)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setElapsed(0)
  }

  function updateSession(newSession: FastSession) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
    setSession(newSession)
    setProtocol(Math.round(newSession.protocol_hours))
  }

  if (!mounted) return null

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #13131A 0%, #0C0C12 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-white font-black text-base leading-tight">Ayuno intermitente</p>
        <p className="text-stone-500 text-xs mt-0.5">
          {session
            ? elapsed >= session.protocol_hours * 3600
              ? '¡Objetivo alcanzado! 🎉'
              : `Ayunando · protocolo ${session.protocol_hours % 1 === 0 ? session.protocol_hours : session.protocol_hours.toFixed(1)}h`
            : 'Elige tu protocolo y empieza'}
        </p>
      </div>

      {/* Contenido por tab */}
      <div className="pt-4">
        {tab === 0 && (
          <TimerTab
            session={session} elapsed={elapsed}
            protocol={protocol} setProtocol={setProtocol}
            onStart={startFast} onStop={stopFast}
          />
        )}
        {tab === 1 && <PhasesTab elapsed={elapsed} />}
        {tab === 2 && <HistoryTab history={history} session={session} elapsed={elapsed} />}
        {tab === 3 && <ScheduleTab session={session} onUpdate={updateSession} />}
      </div>

      {/* Tab nav */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <TabNav active={tab} onSelect={setTab} />
      </div>
    </div>
  )
}
