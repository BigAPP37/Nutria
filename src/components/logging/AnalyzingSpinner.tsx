'use client'

// Pantalla de carga mientras la IA analiza la comida
// Muestra mensajes rotativos y barra de progreso indeterminada

import { useEffect, useState } from 'react'

interface AnalyzingSpinnerProps {
  method: 'photo' | 'text'
}

// Mensajes que rotan mientras se analiza
const MESSAGES = [
  'Analizando tu comida...',
  'Identificando ingredientes...',
  'Calculando nutrientes...',
  'Buscando en la base de datos...',
]

export function AnalyzingSpinner({ method }: AnalyzingSpinnerProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  // Rota los mensajes cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const subtitleMap = {
    photo: 'Procesando la imagen con inteligencia artificial',
    text: 'Interpretando tu descripción con inteligencia artificial',
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-6">
      {/* Spinner grande animado en naranja */}
      <div
        className="
          w-14 h-14 rounded-full
          border-4 border-stone-200 border-t-orange-500
          animate-spin
        "
        role="status"
        aria-label="Analizando"
      />

      {/* Mensaje rotativo */}
      <div className="text-center">
        <p className="text-base font-semibold text-stone-800 transition-all duration-500">
          {MESSAGES[messageIndex]}
        </p>
        <p className="text-sm text-stone-400 mt-1">{subtitleMap[method]}</p>
      </div>

      {/* Barra de progreso indeterminada */}
      <div className="w-full max-w-xs bg-stone-100 rounded-full h-1 overflow-hidden">
        <div
          className="h-1 bg-orange-400 rounded-full animate-pulse"
          style={{ width: '100%' }}
        />
      </div>

      {/* Texto motivacional */}
      <p className="text-xs text-stone-400 text-center">
        Esto puede tardar unos segundos
      </p>
    </div>
  )
}
