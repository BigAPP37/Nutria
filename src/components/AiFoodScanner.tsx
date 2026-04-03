'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export interface AiFoodScannerProps {
  imageSrc: string
  foodName: string
  macros: {
    kcal: number
    prot: number
    carbs: number
    fat: number
  }
  confidence?: number
  detectionDots?: Array<{
    x: number   // % desde izquierda
    y: number   // % desde arriba
    label: string
  }>
  className?: string
}

// Cuenta de 0 hasta target con easeOut en ~800ms
function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const duration = 800

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, active])

  return value
}

const DEFAULT_DOTS = [
  { x: 38, y: 42, label: 'Pollo' },
  { x: 62, y: 28, label: 'Tomate' },
  { x: 24, y: 65, label: 'Lechuga' },
]

export function AiFoodScanner({
  imageSrc,
  foodName,
  macros,
  confidence = 97,
  detectionDots = DEFAULT_DOTS,
  className = '',
}: AiFoodScannerProps) {
  const [active, setActive] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const [dotsVisible, setDotsVisible] = useState<boolean[]>([])

  const kcal = useCountUp(macros.kcal, active)
  const prot = useCountUp(macros.prot, active)
  const carbs = useCountUp(macros.carbs, active)
  const fat = useCountUp(macros.fat, active)

  useEffect(() => {
    // Arranca la animación tras el primer frame
    const t1 = setTimeout(() => setActive(true), 100)

    // Barra de confianza llena en 1.2s
    const t2 = setTimeout(() => setBarWidth(confidence), 300)

    // Dots aparecen con delay escalonado
    const timers = detectionDots.map((_, i) =>
      setTimeout(() => {
        setDotsVisible((prev) => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, 600 + i * 350)
    )

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      timers.forEach(clearTimeout)
    }
  }, [confidence, detectionDots])

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-stone-900 ${className}`}
      style={{ height: 280 }}
    >
      {/* Imagen de fondo */}
      <Image
        src={imageSrc}
        alt={foodName}
        fill
        className="object-cover opacity-80"
        priority
      />

      {/* Grid de líneas tenues */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,180,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,180,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Línea de escaneo animada */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, #00FFB4, transparent)',
          boxShadow: '0 0 12px 3px rgba(0,255,180,0.5)',
          animation: 'nuti-scan 2s linear infinite',
        }}
      />

      {/* Esquinas tipo visor */}
      {[
        { top: '8%',  left:  '5%',  borderTop: 2, borderLeft:  2 },
        { top: '8%',  right: '5%',  borderTop: 2, borderRight: 2 },
        { bottom: '22%', left:  '5%',  borderBottom: 2, borderLeft:  2 },
        { bottom: '22%', right: '5%',  borderBottom: 2, borderRight: 2 },
      ].map((style, i) => (
        <div
          key={i}
          className="absolute w-5 h-5 pointer-events-none"
          style={{ ...style, borderColor: '#00FFB4', borderStyle: 'solid' }}
        />
      ))}

      {/* Puntos de detección */}
      {detectionDots.map((dot, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: dotsVisible[i] ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* Ring expand */}
          <div
            className="absolute rounded-full"
            style={{
              inset: -6,
              border: '1.5px solid rgba(0,255,180,0.5)',
              animation: dotsVisible[i] ? 'nuti-ring 1.5s ease-out infinite' : 'none',
            }}
          />
          {/* Dot central con pulse */}
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: '#00FFB4',
              boxShadow: '0 0 6px rgba(0,255,180,0.8)',
              animation: dotsVisible[i] ? 'nuti-pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          {/* Etiqueta */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{
              background: 'rgba(0,0,0,0.75)',
              color: '#00FFB4',
              border: '1px solid rgba(0,255,180,0.35)',
            }}
          >
            {dot.label}
          </div>
        </div>
      ))}

      {/* Panel macros — arriba derecha */}
      <div
        className="absolute top-3 right-3 rounded-xl px-3 py-2 text-right"
        style={{ background: 'rgba(0,0,0,0.85)', minWidth: 80 }}
      >
        <p
          className="text-lg font-bold leading-none"
          style={{ color: '#F97316' }}
        >
          {kcal}
          <span className="text-[10px] font-normal ml-0.5 opacity-80">kcal</span>
        </p>
        <div className="mt-1 space-y-0.5">
          {[
            { label: 'P', value: prot },
            { label: 'C', value: carbs },
            { label: 'G', value: fat },
          ].map(({ label, value }) => (
            <p key={label} className="text-[11px] text-white leading-none">
              <span className="opacity-60">{label} </span>
              <span className="font-semibold">{value}g</span>
            </p>
          ))}
        </div>
      </div>

      {/* Barra inferior — nombre + confianza */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 70%, transparent)' }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-white">{foodName}</p>
          <p className="text-[11px] font-medium" style={{ color: '#00FFB4' }}>
            {barWidth}%
          </p>
        </div>
        {/* Barra de confianza */}
        <div className="h-1 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              background: 'linear-gradient(90deg, #00FFB4, #34D399)',
              transition: 'width 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          />
        </div>
        <p className="text-[10px] text-white/50 mt-1">Confianza del análisis</p>
      </div>

      {/* Keyframes via <style> */}
      <style>{`
        @keyframes nuti-scan {
          0%   { top: 8%; }
          100% { top: 78%; }
        }
        @keyframes nuti-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(0.8); }
        }
        @keyframes nuti-ring {
          0%   { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
