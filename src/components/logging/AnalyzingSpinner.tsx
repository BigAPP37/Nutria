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

const DOTS_COUNT = 3

export function AnalyzingSpinner({ method }: AnalyzingSpinnerProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [dotIndex, setDotIndex] = useState(0)

  // Rota los mensajes cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Anima los dots cada 400ms
  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % (DOTS_COUNT + 1))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const subtitleMap = {
    photo: 'Procesando la imagen con inteligencia artificial',
    text: 'Interpretando tu descripción con inteligencia artificial',
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: 28,
    }}>
      {/* Spinner con múltiples anillos naranja */}
      <div style={{ position: 'relative', width: 88, height: 88 }}>
        {/* Anillo exterior lento */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '4px solid #FED7AA',
          borderTopColor: '#F97316',
          animation: 'spinSlow 1.2s linear infinite',
        }} />
        {/* Anillo medio inverso */}
        <div style={{
          position: 'absolute',
          inset: 10,
          borderRadius: '50%',
          border: '3.5px solid #FDE68A',
          borderTopColor: '#FB923C',
          animation: 'spinMed 1s linear infinite reverse',
        }} />
        {/* Anillo interior rápido */}
        <div style={{
          position: 'absolute',
          inset: 20,
          borderRadius: '50%',
          border: '3px solid #E7E5E4',
          borderTopColor: '#FDBA74',
          animation: 'spinFast 0.8s linear infinite',
        }} />
        {/* Punto central pulsante */}
        <div style={{
          position: 'absolute',
          inset: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)',
          animation: 'pulseDot 1s ease-in-out infinite',
          boxShadow: '0 0 12px rgba(249,115,22,0.5)',
        }} />
      </div>

      <style>{`
        @keyframes spinSlow   { to { transform: rotate(360deg); } }
        @keyframes spinMed    { to { transform: rotate(360deg); } }
        @keyframes spinFast   { to { transform: rotate(360deg); } }
        @keyframes pulseDot   { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(0.7); opacity:0.6; } }
        @keyframes slideMsg   { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        @keyframes progressKF { 0% { left:-40%; width:40%; } 100% { left:100%; width:40%; } }
      `}</style>

      {/* Texto con animación de entrada */}
      <div style={{ textAlign: 'center' }}>
        <p
          key={messageIndex}
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#1C1917',
            marginBottom: 6,
            animation: 'slideMsg 0.4s ease-out',
          }}
        >
          {MESSAGES[messageIndex]}
        </p>
        <p style={{ fontSize: 13, color: '#A8A29E', lineHeight: 1.5 }}>
          {subtitleMap[method]}
        </p>
      </div>

      {/* Barra de progreso indeterminada */}
      <div style={{
        width: '100%',
        maxWidth: 260,
        height: 5,
        background: '#F5F4F3',
        borderRadius: 99,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          height: '100%',
          width: '40%',
          background: 'linear-gradient(90deg, transparent, #F97316, transparent)',
          borderRadius: 99,
          animation: 'progressKF 1.4s ease-in-out infinite',
        }} />
      </div>

      {/* Dots animados */}
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: DOTS_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i < dotIndex ? '#F97316' : '#E7E5E4',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
