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
  const size = 140
  const cx = size / 2
  const cy = size / 2

  // Anillo exterior — Calorías
  const r1 = 62
  const c1 = 2 * Math.PI * r1
  const p1 = goal > 0 ? Math.min(1, consumed / goal) : 0
  const o1 = c1 - p1 * c1

  // Anillo medio — Proteína
  const r2 = 52
  const c2 = 2 * Math.PI * r2
  const p2 = protein_goal > 0 ? Math.min(1, protein_consumed / protein_goal) : 0
  const o2 = c2 - p2 * c2

  // Anillo interior — Grasa
  const r3 = 43
  const c3 = 2 * Math.PI * r3
  const p3 = fat_goal > 0 ? Math.min(1, fat_consumed / fat_goal) : 0
  const o3 = c3 - p3 * c3

  const carbsPercent = carbs_goal > 0 ? Math.round((carbs_consumed / carbs_goal) * 100) : 0
  const proteinPercent = protein_goal > 0 ? Math.round((protein_consumed / protein_goal) * 100) : 0
  const fatPercent = fat_goal > 0 ? Math.round((fat_consumed / fat_goal) * 100) : 0

  return (
    <div className="flex items-center gap-4">
      {/* Anillos concéntricos */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Pistas de fondo */}
          <circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={7} />
          <circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={5} />
          <circle cx={cx} cy={cy} r={r3} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={5} />

          {/* Arcos de progreso */}
          <circle
            cx={cx} cy={cy} r={r1}
            fill="none" stroke="white" strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={c1}
            strokeDashoffset={o1}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
          <circle
            cx={cx} cy={cy} r={r2}
            fill="none" stroke="#A7F3D0" strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c2}
            strokeDashoffset={o2}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
          <circle
            cx={cx} cy={cy} r={r3}
            fill="none" stroke="#FDE68A" strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c3}
            strokeDashoffset={o3}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {/* Texto central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[28px] font-bold text-white leading-none">
            {consumed.toLocaleString()}
          </p>
          <p className="text-[10px] text-white/70 mt-1">
            de {goal.toLocaleString()} kcal
          </p>
        </div>
      </div>

      {/* Leyenda de macros con mini barras */}
      <div className="flex-1 flex flex-col gap-2.5">
        {/* Carbos */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-[11px] text-white/70">Carbos</span>
              <span className="text-xs font-medium text-white">{Math.round(carbs_consumed)}g</span>
            </div>
            <div className="h-[3px] bg-white/15 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, carbsPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Proteína */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-200 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-[11px] text-white/70">Proteína</span>
              <span className="text-xs font-medium text-white">{Math.round(protein_consumed)}g</span>
            </div>
            <div className="h-[3px] bg-white/15 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, proteinPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Grasa */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-200 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-[11px] text-white/70">Grasa</span>
              <span className="text-xs font-medium text-white">{Math.round(fat_consumed)}g</span>
            </div>
            <div className="h-[3px] bg-white/15 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-amber-200 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, fatPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
