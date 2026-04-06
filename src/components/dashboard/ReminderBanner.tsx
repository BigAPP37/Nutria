'use client'

// Banner de recordatorio contextual — aparece si no has registrado una comida a su hora habitual
import { useState } from 'react'
import { X } from 'lucide-react'
import type { FoodLogEntry, MealType } from '@/types/database'

interface ReminderBannerProps {
  entries: FoodLogEntry[]
}

function getReminder(entries: FoodLogEntry[]): { emoji: string; text: string } | null {
  const hour = new Date().getHours()
  const hasMeal = (type: MealType) => entries.some(e => e.meal_type === type)

  if (hour >= 8 && hour < 11 && !hasMeal('breakfast')) {
    return { emoji: '☕', text: 'Buenos días — ¿ya desayunaste? Toca + para registrarlo' }
  }
  if (hour >= 13 && hour < 16 && !hasMeal('lunch')) {
    return { emoji: '🍽', text: 'Hora del almuerzo — recuerda registrarlo' }
  }
  if (hour >= 20 && hour < 23 && !hasMeal('dinner')) {
    return { emoji: '🌙', text: '¿Ya cenaste? No olvides anotarlo' }
  }
  return null
}

export function ReminderBanner({ entries }: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const reminder = getReminder(entries)

  if (!reminder || dismissed) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderRadius: 14,
      background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)',
      border: '1px solid #FED7AA',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{reminder.emoji}</span>
      <p style={{ flex: 1, fontSize: 13, color: '#92400E', fontWeight: 500, lineHeight: 1.3 }}>
        {reminder.text}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Cerrar"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, color: '#D97706' }}
      >
        <X size={13} />
      </button>
    </div>
  )
}
