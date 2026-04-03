'use client'

// Pregunta de selección múltiple — tema oscuro
// layout="list" (defecto): lista vertical con checkbox
// layout="pills": pills horizontales en wrap, ideal para 4+ opciones
import { Check } from 'lucide-react'
import type { SelectOption } from '@/types/onboarding'

interface MultiSelectQuestionProps {
  question: string
  subtitle?: string
  options: SelectOption[]
  values: string[]
  onChange: (values: string[]) => void
  maxSelections?: number
  layout?: 'list' | 'pills'
}

export function MultiSelectQuestion({
  question,
  subtitle,
  options,
  values,
  onChange,
  maxSelections,
  layout = 'list',
}: MultiSelectQuestionProps) {
  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value))
    } else {
      if (maxSelections && values.length >= maxSelections) return
      onChange([...values, value])
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-bold leading-tight" style={{ color: '#FFFFFF', fontSize: 22 }}>
          {question}
        </h2>
        {subtitle && (
          <p className="mt-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {subtitle}
          </p>
        )}
        {maxSelections && (
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Elige hasta {maxSelections}
          </p>
        )}
      </div>

      {layout === 'pills' ? (
        <div className="flex flex-wrap gap-2.5 justify-center">
          {options.map((option) => {
            const isSelected = values.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
                style={isSelected ? {
                  background: '#F97316',
                  color: 'white',
                  boxShadow: '0 0 16px rgba(249,115,22,0.4)',
                } : {
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {options.map((option) => {
            const isSelected = values.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="w-full flex items-center gap-3 text-left transition-all active:scale-[0.98]"
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: isSelected ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isSelected ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: isSelected ? '#F97316' : 'rgba(255,255,255,0.85)' }}
                >
                  {option.label}
                </span>
                <div
                  className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: isSelected ? '#F97316' : 'transparent',
                    border: `2px solid ${isSelected ? '#F97316' : 'rgba(255,255,255,0.2)'}`,
                  }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
