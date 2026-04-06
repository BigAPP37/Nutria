'use client'

// Selector del método de registro: foto, texto o búsqueda manual
// Muestra 3 tarjetas con iconos y etiquetas

import { Camera, MessageSquare, Search, Barcode } from 'lucide-react'

type LogMethod = 'photo' | 'text' | 'manual' | 'barcode'

interface LogMethodTabsProps {
  active: LogMethod | null
  onSelect: (m: LogMethod) => void
}

const METHODS: {
  id: LogMethod
  label: string
  description: string
  Icon: React.ElementType
  emoji: string
}[] = [
  { id: 'photo',   label: 'Foto',     description: 'Haz una foto',          Icon: Camera,        emoji: '📸' },
  { id: 'text',    label: 'Describir', description: 'Escribe lo que comiste', Icon: MessageSquare, emoji: '✏️' },
  { id: 'manual',  label: 'Buscar',   description: 'Busca un alimento',      Icon: Search,        emoji: '🔍' },
  { id: 'barcode', label: 'Código',   description: 'Escanea el código',      Icon: Barcode,       emoji: '📦' },
]

export function LogMethodTabs({ active, onSelect }: LogMethodTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {METHODS.map(({ id, label, description, Icon }) => {
        const isSelected = active === id
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            aria-pressed={isSelected}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 8px',
              borderRadius: 18,
              border: isSelected ? '2px solid #F97316' : '2px solid #E7E5E4',
              background: isSelected ? '#FFF7ED' : 'white',
              cursor: 'pointer',
              minHeight: 90,
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 4px 16px rgba(249,115,22,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isSelected
                ? 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)'
                : '#F5F4F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
            }}>
              <Icon
                style={{
                  width: 18,
                  height: 18,
                  color: isSelected ? 'white' : '#78716C',
                }}
                strokeWidth={2}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: 12,
                fontWeight: 700,
                color: isSelected ? '#F97316' : '#44403C',
                lineHeight: 1.2,
              }}>
                {label}
              </p>
              <p style={{
                fontSize: 10,
                color: isSelected ? '#FB923C' : '#A8A29E',
                marginTop: 2,
                lineHeight: 1.2,
              }}>
                {description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
