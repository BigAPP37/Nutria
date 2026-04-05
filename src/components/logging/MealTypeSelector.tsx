'use client'

// Selector de tipo de comida con 4 opciones en formato pill
// Desayuno, Almuerzo, Cena, Snack

import type { MealType } from '@/types/database'

interface MealTypeSelectorProps {
  value: MealType
  onChange: (m: MealType) => void
}

// Configuración de cada tipo de comida
const MEAL_OPTIONS: { type: MealType; label: string; emoji: string; activeColor: string; activeBg: string; activeBorder: string }[] = [
  { type: 'breakfast', label: 'Desayuno', emoji: '☀️', activeColor: '#F97316', activeBg: '#FFF7ED', activeBorder: '#FDBA74' },
  { type: 'lunch',     label: 'Almuerzo', emoji: '🍽',  activeColor: '#F97316', activeBg: '#FFF7ED', activeBorder: '#FDBA74' },
  { type: 'dinner',    label: 'Cena',     emoji: '🌙',  activeColor: '#6366F1', activeBg: '#EEF2FF', activeBorder: '#A5B4FC' },
  { type: 'snack',     label: 'Snack',    emoji: '🍎',  activeColor: '#10B981', activeBg: '#ECFDF5', activeBorder: '#6EE7B7' },
]

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {MEAL_OPTIONS.map(({ type, label, emoji, activeColor, activeBg, activeBorder }) => {
        const isSelected = value === type
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            aria-pressed={isSelected}
            style={{
              flex: 1,
              borderRadius: 14,
              padding: '10px 4px',
              border: isSelected ? `1.5px solid ${activeBorder}` : '1.5px solid #E7E5E4',
              background: isSelected ? activeBg : 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              minHeight: 52,
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? `0 2px 8px ${activeBorder}60` : 'none',
              transform: isSelected ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>{emoji}</span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: isSelected ? activeColor : '#78716C',
              lineHeight: 1,
              letterSpacing: '0.01em',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
