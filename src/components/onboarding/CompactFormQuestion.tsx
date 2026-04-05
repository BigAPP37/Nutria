'use client'

// Pantallas con múltiples campos compactos — tema oscuro
// Usado en meals-routine y lifestyle

export interface CompactSelectField {
  id: string
  label: string
  options: { value: string; label: string }[]
  value: string | null
  onChange: (value: string) => void
}

export interface CompactNumberField {
  id: string
  label: string
  type: 'number'
  min: number
  max: number
  value: number | null
  onChange: (value: number | null) => void
  suffix?: string
}

export type CompactField = CompactSelectField | CompactNumberField

interface CompactFormQuestionProps {
  question: string
  subtitle?: string
  fields: CompactField[]
}

export function CompactFormQuestion({ question, subtitle, fields }: CompactFormQuestionProps) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-bold leading-tight" style={{ color: '#1C1917', fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>
          {question}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1.5" style={{ color: '#78716C' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: '#78716C' }}
            >
              {field.label}
            </label>

            {'type' in field && field.type === 'number' ? (
              // Campo numérico
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={field.min}
                  max={field.max}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    field.onChange(isNaN(val) ? null : Math.min(field.max, Math.max(field.min, val)))
                  }}
                  className="w-full px-4 py-3.5 rounded-xl text-stone-900 outline-none transition-all"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E7E5E4',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E7E5E4'
                  }}
                />
                {field.suffix && (
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                    style={{ color: '#A8A29E' }}
                  >
                    {field.suffix}
                  </span>
                )}
              </div>
            ) : (
              // Chips de selección
              <div className="flex flex-wrap gap-2">
                {(field as CompactSelectField).options.map((opt) => {
                  const isSelected = (field as CompactSelectField).value === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => (field as CompactSelectField).onChange(opt.value)}
                      className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: isSelected ? '#F97316' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#44403C',
                        border: `1px solid ${isSelected ? '#F97316' : '#E7E5E4'}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
