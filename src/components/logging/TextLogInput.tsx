'use client'

// Componente de entrada de texto libre para describir comidas
// Incluye ejemplos rápidos como chips interactivos

import { Loader2 } from 'lucide-react'

interface TextLogInputProps {
  value: string
  onChange: (v: string) => void
  onAnalyze: () => void
  isLoading: boolean
}

// Ejemplos rápidos que el usuario puede pulsar para rellenar el textarea
const QUICK_EXAMPLES = [
  'Tortilla de patatas',
  'Ensalada mixta',
  'Café con leche y tostada',
  'Fruta del tiempo',
]

export function TextLogInput({
  value,
  onChange,
  onAnalyze,
  isLoading,
}: TextLogInputProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Área de texto principal */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={`Describe lo que has comido...\nEj: Un bocadillo de jamón serrano con tomate`}
        disabled={isLoading}
        className="
          w-full px-4 py-3 rounded-2xl border-2 border-stone-200
          bg-white text-stone-800 text-sm
          placeholder:text-stone-400
          focus:outline-none focus:border-orange-400
          resize-none transition-colors
          disabled:opacity-60 disabled:bg-stone-50
        "
      />

      {/* Chips de ejemplos rápidos */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-stone-400 font-medium">Ejemplos rápidos:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => onChange(example)}
              disabled={isLoading}
              className="
                px-3 py-1.5 rounded-full bg-stone-100 text-stone-600
                text-xs font-medium
                hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200
                border border-stone-200
                transition-colors min-h-[32px]
                disabled:opacity-50
              "
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Botón de análisis a pantalla completa */}
      <button
        onClick={onAnalyze}
        disabled={isLoading || !value.trim()}
        className="
          w-full py-3.5 rounded-2xl bg-orange-500 text-white
          text-sm font-semibold
          hover:bg-orange-600 transition-colors
          min-h-[44px] disabled:opacity-60
          flex items-center justify-center gap-2
        "
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analizando...
          </>
        ) : (
          'Analizar'
        )}
      </button>
    </div>
  )
}
