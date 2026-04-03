// Modal de bottom sheet para registrar el peso actual
'use client'

import { useState, useEffect, useRef } from 'react'
import { Scale } from 'lucide-react'
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
      setValue('')
      setValidationError(null)
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
      className="fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-10 safe-area-bottom">
        {/* Indicador de arrastre */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />

        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
            <Scale className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Registrar peso</h2>
            {lastWeight != null && (
              <p className="text-xs text-stone-400">Último registro: {lastWeight} kg</p>
            )}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="weight-input" className="sr-only">
              Peso en kg
            </label>
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
              className="w-full h-14 px-4 text-2xl font-bold text-stone-900 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-center placeholder:text-stone-300 placeholder:font-normal placeholder:text-lg"
            />
            <p className="text-center text-xs text-stone-400 mt-1.5">kilogramos</p>
          </div>

          {/* Mensaje de error (amber, nunca rojo) */}
          {errorMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700">{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !value}
            className="w-full h-12 bg-orange-500 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:bg-orange-600 transition-colors"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}
