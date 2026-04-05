'use client'

// Componente de entrada de texto libre para describir comidas
// Incluye ejemplos rápidos como chips interactivos

import { Loader2, Sparkles } from 'lucide-react'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Área de texto principal */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={'Describe lo que has comido...\nEj: Un bocadillo de jamón serrano con tomate'}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 16,
            border: '1.5px solid #E7E5E4',
            background: isLoading ? '#FAFAF9' : 'white',
            color: '#1C1917',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s',
            opacity: isLoading ? 0.6 : 1,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E7E5E4' }}
        />
        {/* Contador de caracteres */}
        {value.length > 0 && (
          <p style={{
            position: 'absolute',
            bottom: 10,
            right: 14,
            fontSize: 10,
            color: '#C4B9B3',
          }}>
            {value.length} car.
          </p>
        )}
      </div>

      {/* Chips de ejemplos rápidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#A8A29E',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Sugerencias rápidas
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => onChange(example)}
              disabled={isLoading}
              style={{
                padding: '7px 14px',
                borderRadius: 99,
                background: value === example ? '#FFF7ED' : 'white',
                color: value === example ? '#F97316' : '#44403C',
                fontSize: 12,
                fontWeight: 500,
                border: value === example ? '1px solid #FDBA74' : '1px solid #E7E5E4',
                cursor: 'pointer',
                minHeight: 34,
                transition: 'all 0.15s ease',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Botón de análisis */}
      <button
        onClick={onAnalyze}
        disabled={isLoading || !value.trim()}
        style={{
          width: '100%',
          padding: '15px',
          borderRadius: 16,
          border: 'none',
          background: isLoading || !value.trim()
            ? '#E7E5E4'
            : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          color: isLoading || !value.trim() ? '#A8A29E' : 'white',
          fontSize: 15,
          fontWeight: 700,
          cursor: isLoading || !value.trim() ? 'not-allowed' : 'pointer',
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: isLoading || !value.trim() ? 'none' : '0 4px 16px rgba(249,115,22,0.35)',
          transition: 'all 0.2s ease',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
            Analizando...
          </>
        ) : (
          <>
            <Sparkles style={{ width: 18, height: 18 }} />
            Analizar con IA
          </>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
