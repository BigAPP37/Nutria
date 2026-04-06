// Modal de bottom sheet para registrar el peso actual
'use client'

import { useState, useEffect, useRef } from 'react'
import { Scale, X } from 'lucide-react'
import { useLogWeight } from '@/hooks/useLogWeight'

interface WeightLogModalProps {
  isOpen: boolean
  onClose: () => void
  lastWeight: number | null
  userId: string
}

export function WeightLogModal({ isOpen, onClose, lastWeight, userId }: WeightLogModalProps) {
  const [value, setValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: logWeight, isPending, isError, error } = useLogWeight(userId)

  // Limpiar el campo cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      function reset() {
        setValue('')
        setValidationError(null)
      }
      reset()
      // Pequeño delay para que la animación del modal termine antes de hacer focus
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)

    const num = parseFloat(value)
    if (isNaN(num) || num < 20 || num > 300) {
      setValidationError('Introduce un peso válido entre 20 y 300')
      return
    }

    logWeight(
      { weight_kg: num },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  const errorMessage = validationError ?? (isError ? (error as Error)?.message ?? 'Error al guardar' : null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div style={{
        width: '100%',
        maxWidth: 448,
        margin: '0 auto',
        background: '#FAFAF9',
        borderRadius: '24px 24px 0 0',
        padding: '0 20px 36px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Drag handle */}
        <div style={{ paddingTop: 12, paddingBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#D6D3D1' }} />
        </div>

        {/* Cabecera */}
        <div className="flex items-center justify-between" style={{ marginBottom: 24, marginTop: 8 }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
            }}>
              <Scale style={{ width: 22, height: 22, color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C1917', lineHeight: 1.2 }}>
                Registrar peso
              </h2>
              {lastWeight != null && (
                <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 2 }}>
                  Último: {lastWeight} kg
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#F5F4F3',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#78716C',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="weight-input" className="sr-only">
              Peso en kg
            </label>
            {/* Input grande y centrado */}
            <div style={{
              background: 'white',
              border: '1.5px solid #E7E5E4',
              borderRadius: 18,
              padding: '16px 0 10px',
              textAlign: 'center',
              transition: 'border-color 0.2s',
            }}>
              <div className="flex items-end justify-center gap-2">
                <input
                  id="weight-input"
                  ref={inputRef}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="20"
                  max="300"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={lastWeight?.toString() ?? '70.0'}
                  style={{
                    width: 120,
                    textAlign: 'center',
                    fontSize: 48,
                    fontWeight: 900,
                    color: '#F97316',
                    letterSpacing: '-2px',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontFamily: 'inherit',
                    lineHeight: 1,
                  }}
                  onFocus={(e) => {
                    const parent = e.currentTarget.closest('div') as HTMLElement
                    if (parent) parent.style.borderColor = '#F97316'
                  }}
                  onBlur={(e) => {
                    const parent = e.currentTarget.closest('div') as HTMLElement
                    if (parent) parent.style.borderColor = '#E7E5E4'
                  }}
                />
                <span style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#A8A29E',
                  marginBottom: 8,
                }}>
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje de error */}
          {errorMessage && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 12,
              padding: '10px 14px',
            }}>
              <p style={{ fontSize: 13, color: '#92400E' }}>{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !value}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 16,
              border: 'none',
              background: isPending || !value
                ? '#E7E5E4'
                : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: isPending || !value ? '#A8A29E' : 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: isPending || !value ? 'not-allowed' : 'pointer',
              boxShadow: isPending || !value ? 'none' : '0 4px 16px rgba(249,115,22,0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {isPending ? 'Guardando…' : 'Guardar peso'}
          </button>
        </form>
      </div>
    </div>
  )
}
