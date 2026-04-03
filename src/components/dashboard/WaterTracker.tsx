'use client'

// Tracker de agua con barras segmentadas (estilo híbrido Yazio/Cronometer)
import { useState, useCallback } from 'react'
import { Droplets } from 'lucide-react'
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

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-stone-100">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-400" />
          <span className="text-[13px] font-semibold text-stone-800">Agua</span>
        </div>
        <span className="text-xs text-stone-400">{glasses} / {TOTAL_GLASSES}</span>
      </div>

      {/* Barras segmentadas clicables */}
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_GLASSES }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleGlassClick(i)}
            disabled={isUpdating}
            className={`flex-1 h-1.5 rounded-full transition-all duration-200 ${
              i < glasses ? 'bg-sky-400' : 'bg-stone-200'
            } ${isUpdating ? 'opacity-60' : 'hover:opacity-80 active:scale-y-150'}`}
            aria-label={`Vaso ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
