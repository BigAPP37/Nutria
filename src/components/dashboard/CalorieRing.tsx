'use client'

// Anillo concéntrico de calorías + macros (estilo Cronometer en header naranja Yazio)
// Anillo exterior: calorías | Medio: proteína | Interior: grasa
// NUNCA usa rojo

interface CalorieRingProps {
  consumed: number
  goal: number
  protein_consumed: number
  protein_goal: number
  carbs_consumed: number
  carbs_goal: number
  fat_consumed: number
  fat_goal: number
}

export function CalorieRing({
  consumed,
  goal,
  protein_consumed,
  protein_goal,
  carbs_consumed,
  carbs_goal,
  fat_consumed,
  fat_goal,
}: CalorieRingProps) {
  const size = 160
  const cx = size / 2
  const cy = size / 2

  // Anillo exterior — Calorías
  const r1 = 70
  const c1 = 2 * Math.PI * r1
  const p1 = goal > 0 ? Math.min(1, consumed / goal) : 0
  const o1 = c1 - p1 * c1

  // Anillo medio — Proteína
  const r2 = 58
  const c2 = 2 * Math.PI * r2
  const p2 = protein_goal > 0 ? Math.min(1, protein_consumed / protein_goal) : 0
  const o2 = c2 - p2 * c2

  // Anillo interior — Grasa
  const r3 = 47
  const c3 = 2 * Math.PI * r3
  const p3 = fat_goal > 0 ? Math.min(1, fat_consumed / fat_goal) : 0
  const o3 = c3 - p3 * c3

  const carbsPercent = carbs_goal > 0 ? Math.round((carbs_consumed / carbs_goal) * 100) : 0
  const proteinPercent = protein_goal > 0 ? Math.round((protein_consumed / protein_goal) * 100) : 0
  const fatPercent = fat_goal > 0 ? Math.round((fat_consumed / fat_goal) * 100) : 0

  const remaining = Math.max(0, goal - consumed)

  return (
    <div className="flex items-center gap-5">
      {/* Anillos concéntricos */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Pistas de fondo con más opacidad para mejor contraste */}
          <circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={9} />
          <circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
          <circle cx={cx} cy={cy} r={r3} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />

          {/* Arcos de progreso */}
          <circle
            cx={cx} cy={cy} r={r1}
            fill="none" stroke="white" strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={c1}
            strokeDashoffset={o1}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1)', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))' }}
          />
          <circle
            cx={cx} cy={cy} r={r2}
            fill="none" stroke="#6EE7B7" strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={c2}
            strokeDashoffset={o2}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.1s', filter: 'drop-shadow(0 0 4px rgba(110,231,183,0.5))' }}
          />
          <circle
            cx={cx} cy={cy} r={r3}
            fill="none" stroke="#FDE68A" strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={c3}
            strokeDashoffset={o3}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.2s', filter: 'drop-shadow(0 0 4px rgba(253,230,138,0.5))' }}
          />
        </svg>

        {/* Texto central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <p style={{ fontSize: '30px', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-0.5px' }}>
            {consumed.toLocaleString()}
          </p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
            de {goal.toLocaleString()}
          </p>
          <div style={{
            marginTop: '4px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '2px 8px',
          }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {remaining > 0 ? `−${remaining.toLocaleString()} kcal` : '¡Meta!'}
            </p>
          </div>
        </div>
      </div>

      {/* Leyenda de macros con mini barras */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Carbos */}
        <div className="flex items-center gap-2.5">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Carbos</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{Math.round(carbs_consumed)}g</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, carbsPercent)}%`,
                  background: 'white',
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Proteína */}
        <div className="flex items-center gap-2.5">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6EE7B7', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Proteína</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{Math.round(protein_consumed)}g</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, proteinPercent)}%`,
                  background: '#6EE7B7',
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Grasa */}
        <div className="flex items-center gap-2.5">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDE68A', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Grasa</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{Math.round(fat_consumed)}g</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, fatPercent)}%`,
                  background: '#FDE68A',
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
