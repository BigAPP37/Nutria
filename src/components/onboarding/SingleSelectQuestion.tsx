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
        <h2 className="font-bold leading-tight" style={{ color: '#1C1917', fontSize: 28, fontWeight: 800, lineHeight: 1.08 }}>
          {question}
        </h2>
        {subtitle && (
          <p className="mt-2 mx-auto max-w-[32rem]" style={{ color: '#78716C', fontSize: 14, lineHeight: 1.5 }}>
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
                  padding: '16px 18px',
                  borderRadius: 18,
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(255,247,237,1) 0%, rgba(255,237,213,0.92) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,251,235,0.72) 100%)',
                  border: `1px solid ${isSelected ? 'rgba(249,115,22,0.42)' : 'rgba(231,229,228,1)'}`,
                  boxShadow: isSelected
                    ? '0 14px 34px rgba(249,115,22,0.16)'
                    : '0 8px 22px rgba(28,25,23,0.05)',
                }}
              >
                {option.emoji && (
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: isSelected
                        ? 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)'
                        : 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                      boxShadow: isSelected
                        ? '0 10px 22px rgba(249,115,22,0.24)'
                        : 'inset 0 0 0 1px rgba(249,115,22,0.08)',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{option.emoji}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span
                    className="block"
                    style={{
                      color: isSelected ? '#C2410C' : '#1C1917',
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <p
                      className="mt-1.5"
                      style={{
                        color: isSelected ? '#9A3412' : '#78716C',
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      {option.description}
                    </p>
                  )}
                </div>
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    width: 24,
                    height: 24,
                    background: isSelected ? '#F97316' : 'rgba(255,255,255,0.9)',
                    border: `2px solid ${isSelected ? '#F97316' : '#D6D3D1'}`,
                    boxShadow: isSelected ? '0 6px 14px rgba(249,115,22,0.22)' : 'none',
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
