'use client'

// Selector del método de registro: foto, texto o búsqueda manual
// Muestra 3 tarjetas con iconos y etiquetas

import { Camera, MessageSquare, Search } from 'lucide-react'

type LogMethod = 'photo' | 'text' | 'manual'

interface LogMethodTabsProps {
  active: LogMethod | null
  onSelect: (m: LogMethod) => void
}

// Configuración de cada método de registro
const METHODS: {
  id: LogMethod
  label: string
  Icon: React.ElementType
  description: string
}[] = [
  { id: 'photo', label: 'Foto', Icon: Camera, description: 'Haz una foto' },
  { id: 'text', label: 'Describir', Icon: MessageSquare, description: 'Escribe lo que comiste' },
  { id: 'manual', label: 'Buscar', Icon: Search, description: 'Busca un alimento' },
]

export function LogMethodTabs({ active, onSelect }: LogMethodTabsProps) {
  return (
    <div className="flex gap-3">
      {METHODS.map(({ id, label, Icon }) => {
        const isSelected = active === id
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`
              flex-1 flex flex-col items-center justify-center gap-2
              border-2 rounded-2xl py-4 transition-all
              min-h-[80px]
              ${
                isSelected
                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }
            `}
            aria-pressed={isSelected}
          >
            <Icon
              className={`w-6 h-6 ${isSelected ? 'text-orange-500' : 'text-stone-400'}`}
              strokeWidth={1.75}
            />
            <span className="text-xs font-medium leading-none">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
