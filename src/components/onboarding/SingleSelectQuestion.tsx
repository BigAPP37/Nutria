'use client'

// Pregunta de selección única — tema oscuro
// layout="list" (defecto): lista vertical, ideal para 5+ opciones
// layout="grid": cuadrícula 2x2, ideal para 4 opciones con descripción breve
import type { SelectOption } from '@/types/onboarding'

interface SingleSelectQuestionProps {
  question: string
  subtitle?: string
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  layout?: 'list' | 'grid'
}

export function SingleSelectQuestion({
  question,
  subtitle,
  options,
  value,
  onChange,
  layout = 'list',
}: SingleSelectQuestionProps) {
  return (
    <div className="space-y-7">
      <div className="text-center">
        <h2 className="font-bold leading-tight" style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>
          {question}
        </h2>
        {subtitle && (
          <p className="mt-1.5" style={{ color: '#78716C', fontSize: 13 }}>
            {subtitle}
          </p>
        )}
      </div>

      {layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 w-full">
          {options.map((option) => {
            const isSelected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center transition-all duration-200 active:scale-95 min-h-[100px]"
                style={isSelected ? {
                  background: '#FFF7ED',
                  border: '1.5px solid rgba(249,115,22,0.4)',
                } : {
                  background: '#FFFFFF',
                  border: '1px solid #E7E5E4',
                }}
              >
                <span
                  className="text-sm font-medium leading-tight"
                  style={{ color: isSelected ? '#F97316' : '#1C1917' }}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs leading-snug" style={{ color: '#A8A29E' }}>
                    {option.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {options.map((option) => {
            const isSelected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className="w-full flex items-center gap-3 text-left transition-all active:scale-[0.98]"
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: isSelected ? '#FFF7ED' : '#FFFFFF',
                  border: `1px solid ${isSelected ? 'rgba(249,115,22,0.4)' : '#E7E5E4'}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-medium"
                    style={{ color: isSelected ? '#F97316' : '#1C1917' }}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <p className="text-xs mt-0.5" style={{ color: '#A8A29E' }}>
                      {option.description}
                    </p>
                  )}
                </div>
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: isSelected ? '#F97316' : 'transparent',
                    border: `2px solid ${isSelected ? '#F97316' : '#D6D3D1'}`,
                  }}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
