'use client'

// Pantalla de éxito tras registrar una comida
// Muestra animación de check y redirige al dashboard tras 2.5 segundos

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MealType } from '@/types/database'

interface LogSuccessProps {
  kcal: number
  mealType: MealType
  onLogAnother: () => void
}

// Etiquetas en español para cada tipo de comida
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'el desayuno',
  lunch: 'el almuerzo',
  dinner: 'la cena',
  snack: 'el snack',
}

const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '☕',
  lunch: '🍽',
  dinner: '🌙',
  snack: '🍎',
}

// Partículas de confeti
const CONFETTI_COLORS = ['#F97316', '#10B981', '#FDE68A', '#FB923C', '#6EE7B7', '#FDBA74', '#A7F3D0']

function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
  const left = (index * 37 + 5) % 90
  const delay = (index * 0.15) % 1.2
  const size = 6 + (index % 4) * 2
  const isCircle = index % 3 === 0

  return (
    <div
      style={{
        position: 'absolute',
        top: -10,
        left: `${left}%`,
        width: size,
        height: isCircle ? size : size * 1.6,
        borderRadius: isCircle ? '50%' : 2,
        background: color,
        animation: `confettiFall ${1.2 + delay}s ease-in forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
      }}
    />
  )
}

export function LogSuccess({ kcal, mealType, onLogAnother }: LogSuccessProps) {
  const router = useRouter()
  const [showParticles, setShowParticles] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Redirige automáticamente al dashboard tras 3 segundos
  useEffect(() => {
    setShowParticles(true)
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(countdownInterval)
    }
  }, [router])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      padding: '32px 24px',
      gap: 0,
      position: 'relative',
    }}>
      <style>{`
        @keyframes confettiFall {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(260px) rotate(360deg); }
        }
        @keyframes successPop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
          80%  { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes numberReveal {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Contenedor de partículas confeti */}
      {showParticles && (
        <div style={{ position: 'absolute', top: 40, left: 0, right: 0, height: 280, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 18 }, (_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      {/* Círculo de éxito animado */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 40px rgba(16,185,129,0.45)',
          animation: 'successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          marginBottom: 24,
          zIndex: 1,
        }}
      >
        <svg
          style={{ width: 48, height: 48, color: 'white' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Emoji de comida */}
      <div style={{
        fontSize: 36,
        marginBottom: 12,
        animation: 'fadeSlideUp 0.5s ease 0.4s both',
        zIndex: 1,
      }}>
        {MEAL_EMOJIS[mealType]}
      </div>

      {/* Texto principal */}
      <div style={{ textAlign: 'center', zIndex: 1, animation: 'fadeSlideUp 0.5s ease 0.5s both' }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#1C1917',
          letterSpacing: '-0.5px',
          marginBottom: 8,
        }}>
          ¡Registrado!
        </h1>
        <p style={{ fontSize: 16, color: '#78716C', lineHeight: 1.5, marginBottom: 4 }}>
          Añadido a {MEAL_LABELS[mealType]}
        </p>
      </div>

      {/* Número grande de calorías */}
      <div
        style={{
          margin: '20px 0',
          padding: '20px 36px',
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
          borderRadius: 20,
          border: '1.5px solid #FED7AA',
          textAlign: 'center',
          animation: 'numberReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both',
          zIndex: 1,
          boxShadow: '0 4px 20px rgba(249,115,22,0.15)',
        }}
      >
        <p style={{
          fontSize: 52,
          fontWeight: 900,
          color: '#F97316',
          lineHeight: 1,
          letterSpacing: '-2px',
        }}>
          {kcal}
        </p>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#FB923C',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          kcal
        </p>
      </div>

      {/* Redirigiendo */}
      <p
        style={{
          fontSize: 12,
          color: '#A8A29E',
          marginBottom: 24,
          animation: 'fadeSlideUp 0.5s ease 0.8s both',
          zIndex: 1,
        }}
      >
        Volviendo al dashboard en {countdown}s...
      </p>

      {/* Botón para registrar otra comida */}
      <button
        onClick={onLogAnother}
        style={{
          padding: '13px 32px',
          borderRadius: 16,
          border: '1.5px solid #E7E5E4',
          background: 'white',
          color: '#78716C',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: 48,
          zIndex: 1,
          animation: 'fadeSlideUp 0.5s ease 0.9s both',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#F97316'
          e.currentTarget.style.color = '#F97316'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E7E5E4'
          e.currentTarget.style.color = '#78716C'
        }}
      >
        Registrar otra comida
      </button>
    </div>
  )
}
