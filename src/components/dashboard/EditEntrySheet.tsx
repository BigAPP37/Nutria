'use client'

// Bottom sheet para editar o eliminar una entrada del diario de comidas
import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { FoodLogEntry } from '@/types/database'
import { useDeleteEntry } from '@/hooks/useDeleteEntry'
import { useUpdateEntry } from '@/hooks/useUpdateEntry'

interface EditEntrySheetProps {
  entry: FoodLogEntry
  onClose: () => void
  onUpdated: () => void
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 12,
          border: '1.5px solid #E7E5E4',
          fontSize: 14,
          color: '#1C1917',
          background: '#FAFAF9',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
      />
    </div>
  )
}

export function EditEntrySheet({ entry, onClose, onUpdated }: EditEntrySheetProps) {
  const displayName = entry.custom_description || entry.foods?.name || 'Alimento'

  const [description, setDescription] = useState(displayName)
  const [kcal, setKcal]       = useState(String(Math.round(entry.calories_kcal || 0)))
  const [protein, setProtein] = useState(String(Math.round((entry.protein_g || 0) * 10) / 10))
  const [carbs, setCarbs]     = useState(String(Math.round((entry.carbs_g || 0) * 10) / 10))
  const [fat, setFat]         = useState(String(Math.round((entry.fat_g || 0) * 10) / 10))

  const deleteMutation = useDeleteEntry(() => { onUpdated(); onClose() })
  const updateMutation = useUpdateEntry(() => { onUpdated(); onClose() })

  const isBusy = deleteMutation.isPending || updateMutation.isPending

  function handleSave() {
    updateMutation.mutate({
      entryId: entry.id,
      custom_description: description.trim() || displayName,
      calories_kcal: Math.max(0, parseFloat(kcal) || 0),
      protein_g:     Math.max(0, parseFloat(protein) || 0),
      carbs_g:       Math.max(0, parseFloat(carbs) || 0),
      fat_g:         Math.max(0, parseFloat(fat) || 0),
    })
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'white',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        maxWidth: 480,
        margin: '0 auto',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#D6D3D1' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C1917' }}>Editar alimento</h3>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#F5F4F3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Cerrar"
          >
            <X size={14} color="#78716C" />
          </button>
        </div>

        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nombre */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1.5px solid #E7E5E4',
                fontSize: 14,
                color: '#1C1917',
                background: '#FAFAF9',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
              placeholder="Nombre del alimento"
            />
          </div>

          {/* Macros en grid 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NumInput label="Calorías (kcal)" value={kcal}    onChange={setKcal} />
            <NumInput label="Proteína (g)"    value={protein} onChange={setProtein} />
            <NumInput label="Carbohidratos (g)" value={carbs} onChange={setCarbs} />
            <NumInput label="Grasa (g)"       value={fat}     onChange={setFat} />
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              onClick={() => deleteMutation.mutate(entry.id)}
              disabled={isBusy}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 16px',
                borderRadius: 14,
                border: '1.5px solid #E7E5E4',
                background: 'white',
                color: '#78716C',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isBusy ? 0.5 : 1,
              }}
            >
              <Trash2 size={14} />
              Eliminar
            </button>

            <button
              onClick={handleSave}
              disabled={isBusy}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 14,
                border: 'none',
                background: '#F97316',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: isBusy ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
