'use client'

// Tarjeta de sugerencia de ajuste de TDEE basada en el historial de peso real del usuario
import { useState } from 'react'
import { TrendingDown, TrendingUp, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import type { TdeeAdjustment } from '@/hooks/useTdeeAdjustment'

interface TdeeAdjustmentCardProps {
  adjustment: TdeeAdjustment
  userId: string
}

export function TdeeAdjustmentCard({ adjustment, userId }: TdeeAdjustmentCardProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'dismissed'>('idle')
  const queryClient = useQueryClient()

  if (status === 'done' || status === 'dismissed') return null

  async function handleApply() {
    setStatus('saving')
    try {
      const supabase = createClient()
      await supabase.from('user_tdee_state').upsert(
        { user_id: userId, goal_kcal: adjustment.suggestedKcal },
        { onConflict: 'user_id' }
      )
      await queryClient.invalidateQueries({ queryKey: ['tdeeState', userId] })
      await queryClient.invalidateQueries({ queryKey: ['tdeeAdjustment', userId] })
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  const isDown = adjustment.direction === 'down'

  return (
    <div style={{
      background: isDown ? 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)' : 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
      border: `1px solid ${isDown ? '#FED7AA' : '#A7F3D0'}`,
      borderRadius: 18,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isDown ? '#FED7AA' : '#A7F3D0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDown
            ? <TrendingDown size={18} color="#C2410C" />
            : <TrendingUp size={18} color="#059669" />
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>
            Sugerencia de ajuste
          </p>
          <p style={{ fontSize: 12, color: '#78716C', marginTop: 3, lineHeight: 1.4 }}>
            {adjustment.reason}
          </p>
        </div>
        <button
          onClick={() => setStatus('dismissed')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#A8A29E', flexShrink: 0 }}
          aria-label="Ignorar sugerencia"
        >
          <X size={14} />
        </button>
      </div>

      {/* Cambio propuesto */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 12px',
      }}>
        <span style={{ fontSize: 13, color: '#78716C' }}>
          Meta actual: <strong style={{ color: '#1C1917' }}>{adjustment.suggestedKcal + (isDown ? adjustment.delta : -adjustment.delta)} kcal</strong>
        </span>
        <span style={{ color: isDown ? '#C2410C' : '#059669', fontWeight: 700, fontSize: 13 }}>
          → {adjustment.suggestedKcal} kcal
        </span>
        <span style={{ fontSize: 11, color: isDown ? '#C2410C' : '#059669', fontWeight: 600, marginLeft: 'auto' }}>
          {isDown ? `-${adjustment.delta}` : `+${adjustment.delta}`} kcal/día
        </span>
      </div>

      {/* Botón de aplicar */}
      <button
        onClick={handleApply}
        disabled={status === 'saving'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '11px',
          borderRadius: 12, border: 'none',
          background: isDown ? '#F97316' : '#10B981',
          color: 'white',
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer', opacity: status === 'saving' ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <Check size={14} />
        {status === 'saving' ? 'Aplicando...' : `Aplicar nueva meta: ${adjustment.suggestedKcal} kcal`}
      </button>
    </div>
  )
}
