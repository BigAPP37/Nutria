'use client'

// Tracker de agua con barras segmentadas (estilo híbrido Yazio/Cronometer)
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WaterTrackerProps {
  userId: string
  date: string
  initialGlasses: number
  onUpdate?: (glasses: number) => void
}

const TOTAL_GLASSES = 8

export function WaterTracker({
  userId,
  date,
  initialGlasses,
  onUpdate,
}: WaterTrackerProps) {
  const [glasses, setGlasses] = useState(initialGlasses)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleGlassClick = useCallback(async (index: number) => {
    if (isUpdating) return
    const newGlasses = index + 1 === glasses ? index : index + 1
    setGlasses(newGlasses)
    setIsUpdating(true)

    try {
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('water_log')
        .select('id')
        .eq('user_id', userId)
        .eq('log_date', date)
        .maybeSingle()

      const { error } = existing
        ? await supabase
            .from('water_log')
            .update({ amount_ml: newGlasses * 250 })
            .eq('id', existing.id)
        : await supabase
            .from('water_log')
            .insert({ user_id: userId, amount_ml: newGlasses * 250, log_date: date })

      if (error) {
        console.error('Error guardando agua:', error)
        setGlasses(initialGlasses)
      } else {
        onUpdate?.(newGlasses)
      }
    } catch (err) {
      console.error('Error inesperado guardando agua:', err)
      setGlasses(initialGlasses)
    } finally {
      setIsUpdating(false)
    }
  }, [glasses, isUpdating, userId, date, initialGlasses, onUpdate])

  const mlConsumed = glasses * 250
  const progress = glasses / TOTAL_GLASSES

  return (
    <div style={{
      background: 'white',
      borderRadius: 18,
      padding: '14px 16px',
      border: '1px solid #E7E5E4',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-2.5">
          {/* Icono de agua con gradiente */}
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #BAE6FD 0%, #38BDF8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C12 2 5 10 5 15C5 18.866 8.13401 22 12 22C15.866 22 19 18.866 19 15C19 10 12 2 12 2Z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>Agua</p>
            <p style={{ fontSize: 11, color: '#A8A29E', marginTop: 1 }}>
              {mlConsumed >= 1000 ? `${(mlConsumed / 1000).toFixed(1)}L` : `${mlConsumed}ml`} de 2L
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#0EA5E9',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}>
            {glasses}
          </span>
          <span style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>/{TOTAL_GLASSES}</span>
        </div>
      </div>

      {/* Progress bar de agua suave */}
      <div style={{
        height: 6,
        background: '#EFF6FF',
        borderRadius: 99,
        overflow: 'hidden',
        marginBottom: 10,
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, progress * 100)}%`,
          background: 'linear-gradient(90deg, #38BDF8 0%, #0EA5E9 100%)',
          borderRadius: 99,
          transition: 'width 0.4s ease',
          boxShadow: '0 0 6px rgba(14,165,233,0.4)',
        }} />
      </div>

      {/* Vasos clicables — iconos de gota */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: TOTAL_GLASSES }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleGlassClick(i)}
            disabled={isUpdating}
            aria-label={`Vaso ${i + 1}`}
            style={{
              flex: 1,
              height: 28,
              borderRadius: 8,
              border: 'none',
              cursor: isUpdating ? 'default' : 'pointer',
              background: i < glasses
                ? 'linear-gradient(135deg, #BAE6FD 0%, #38BDF8 100%)'
                : '#F1F5F9',
              opacity: isUpdating ? 0.6 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <path
                d="M5 1C5 1 1.5 5.5 1.5 8C1.5 9.933 3.067 11.5 5 11.5C6.933 11.5 8.5 9.933 8.5 8C8.5 5.5 5 1 5 1Z"
                fill={i < glasses ? 'white' : '#CBD5E1'}
              />
            </svg>
          </button>
        ))}
      </div>

      {glasses === TOTAL_GLASSES && (
        <p style={{
          fontSize: 10,
          color: '#0EA5E9',
          fontWeight: 600,
          textAlign: 'center',
          marginTop: 8,
        }}>
          ¡Meta de hidratación alcanzada! 💧
        </p>
      )}
    </div>
  )
}
