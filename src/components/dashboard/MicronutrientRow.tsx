'use client'

// Fila de micronutrientes compacta (estilo Cronometer)
// Muestra 4 micronutrientes clave con porcentaje y color semántico

interface MicronutrientRowProps {
  vitaminC_percent: number
  iron_percent: number
  calcium_percent: number
  fiber_percent: number
}

function getColor(percent: number): string {
  if (percent >= 60) return 'text-emerald-500'
  if (percent >= 40) return 'text-amber-500'
  return 'text-orange-500'
}

export function MicronutrientRow({
  vitaminC_percent,
  iron_percent,
  calcium_percent,
  fiber_percent,
}: MicronutrientRowProps) {
  const nutrients = [
    { label: 'Vit. C', percent: vitaminC_percent },
    { label: 'Hierro', percent: iron_percent },
    { label: 'Calcio', percent: calcium_percent },
    { label: 'Fibra', percent: fiber_percent },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {nutrients.map((n) => (
        <div
          key={n.label}
          className="bg-white rounded-xl py-2.5 px-1.5 text-center border border-stone-100"
        >
          <p className={`text-[15px] font-bold ${getColor(n.percent)}`}>
            {Math.round(n.percent)}%
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">{n.label}</p>
        </div>
      ))}
    </div>
  )
}
