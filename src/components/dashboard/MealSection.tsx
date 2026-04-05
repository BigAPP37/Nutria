'use client'

// Sección de comidas con emojis y cards individuales (estilo Yazio)
import type { FoodLogEntry, MealType } from '@/types/database'

interface MealSectionProps {
  mealType: MealType
  entries: FoodLogEntry[]
  onAddEntry: (mealType: MealType) => void
}

const mealConfig: Record<
  MealType,
  {
    label: string
    emoji: string
    accentColor: string
    iconBg: string
    plusBg: string
    plusColor: string
  }
> = {
  breakfast: {
    label: 'Desayuno',
    emoji: '☕',
    accentColor: '#F97316',
    iconBg: 'rgba(249,115,22,0.1)',
    plusBg: 'rgba(249,115,22,0.12)',
    plusColor: '#F97316',
  },
  lunch: {
    label: 'Almuerzo',
    emoji: '🍽',
    accentColor: '#F97316',
    iconBg: 'rgba(249,115,22,0.1)',
    plusBg: 'rgba(249,115,22,0.12)',
    plusColor: '#F97316',
  },
  dinner: {
    label: 'Cena',
    emoji: '🌙',
    accentColor: '#818CF8',
    iconBg: 'rgba(129,140,248,0.1)',
    plusBg: 'rgba(129,140,248,0.12)',
    plusColor: '#818CF8',
  },
  snack: {
    label: 'Snack',
    emoji: '🍎',
    accentColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.1)',
    plusBg: 'rgba(16,185,129,0.12)',
    plusColor: '#10B981',
  },
}

export function MealSection({ mealType, entries, onAddEntry }: MealSectionProps) {
  const config = mealConfig[mealType]
  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories_kcal || 0), 0)

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      border: '1px solid #E7E5E4',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header de la comida */}
      <div className="flex items-center justify-between" style={{ padding: '14px 16px' }}>
        <div className="flex items-center gap-3">
          {/* Icono de comida */}
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 19,
            flexShrink: 0,
          }}>
            {config.emoji}
          </div>

          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>
              {config.label}
            </p>
            {entries.length > 0 ? (
              <div className="flex items-center gap-1.5" style={{ marginTop: 2 }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: config.accentColor,
                  lineHeight: 1,
                }}>
                  {Math.round(totalCalories)}
                </span>
                <span style={{ fontSize: 11, color: '#A8A29E', lineHeight: 1 }}>
                  kcal · {entries.length} {entries.length === 1 ? 'alimento' : 'alimentos'}
                </span>
              </div>
            ) : (
              <p style={{ fontSize: 11, color: '#C4B9B3', marginTop: 2 }}>Toca + para registrar</p>
            )}
          </div>
        </div>

        {/* Botón añadir */}
        <button
          type="button"
          onClick={() => onAddEntry(mealType)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: config.plusBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.15s ease, opacity 0.15s ease',
          }}
          aria-label={`Agregar alimento a ${config.label}`}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)' }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="7" y1="2" x2="7" y2="12" stroke={config.plusColor} strokeWidth={2.5} strokeLinecap="round" />
            <line x1="2" y1="7" x2="12" y2="7" stroke={config.plusColor} strokeWidth={2.5} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Lista de alimentos */}
      {entries.length > 0 && (
        <div style={{ borderTop: '1px solid #F5F4F3' }}>
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center justify-between"
              style={{
                padding: '10px 16px',
                borderBottom: i < entries.length - 1 ? '1px solid #F9F8F8' : 'none',
              }}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Dot de color */}
                <div style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: config.accentColor,
                  flexShrink: 0,
                  opacity: 0.6,
                }} />
                <span style={{
                  fontSize: 13,
                  color: '#44403C',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {entry.custom_description || entry.food_id || 'Alimento'}
                </span>
              </div>
              <div className="flex-shrink-0 ml-3 flex items-center gap-1">
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1C1917',
                }}>
                  {Math.round(entry.calories_kcal || 0)}
                </span>
                <span style={{ fontSize: 11, color: '#A8A29E' }}>kcal</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
