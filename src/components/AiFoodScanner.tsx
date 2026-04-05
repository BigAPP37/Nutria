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
    x: number
    y: number
    label: string
  }>
  className?: string
}

type Phase = 'phone' | 'flash' | 'expanding' | 'scanning'

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const duration = 900

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
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
  { x: 58, y: 55, label: 'Pollo' },
  { x: 72, y: 32, label: 'Brócoli' },
  { x: 28, y: 45, label: 'Pimiento' },
]

export function AiFoodScanner({
  imageSrc,
  foodName,
  macros,
  confidence = 97,
  detectionDots = DEFAULT_DOTS,
  className = '',
}: AiFoodScannerProps) {
  const [phase, setPhase] = useState<Phase>('phone')
  const [barWidth, setBarWidth] = useState(0)
  const [dotsVisible, setDotsVisible] = useState<boolean[]>([])
  const [active, setActive] = useState(false)

  const kcal = useCountUp(macros.kcal, active)
  const prot = useCountUp(macros.prot, active)
  const carbs = useCountUp(macros.carbs, active)
  const fat = useCountUp(macros.fat, active)

  const isPhone = phase === 'phone'
  const isFlash = phase === 'flash'
  const isExpanding = phase === 'expanding'
  const isScanning = phase === 'scanning'

  useEffect(() => {
    const timers = [
      // Flash de cámara
      setTimeout(() => setPhase('flash'), 1800),
      // Empieza a expandirse
      setTimeout(() => setPhase('expanding'), 2050),
      // Scanner activo
      setTimeout(() => { setPhase('scanning'); setActive(true) }, 3000),
      // Barra de confianza
      setTimeout(() => setBarWidth(confidence), 3200),
      // Dots escalonados
      ...detectionDots.map((_, i) =>
        setTimeout(() => {
          setDotsVisible((prev) => {
            const next = [...prev]
            next[i] = true
            return next
          })
        }, 3500 + i * 380)
      ),
    ]
    return () => timers.forEach(clearTimeout)
  }, [confidence, detectionDots])

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ height: 280, background: '#000' }}
    >
      {/* Imagen de fondo — siempre full-size */}
      <Image
        src={imageSrc}
        alt={foodName}
        fill
        className="object-cover"
        priority
        style={{
          opacity: isPhone || isFlash ? 0.25 : 0.82,
          transition: 'opacity 0.8s ease',
        }}
      />

      {/* Overlay oscuro — cubre todo menos el "teléfono" */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.75)',
          opacity: isPhone || isFlash ? 1 : 0,
          transition: 'opacity 0.7s ease',
          zIndex: 1,
        }}
      />

      {/* Teléfono + cámara */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 112,
          height: 210,
          top: '50%',
          left: '50%',
          marginTop: -105,
          marginLeft: -56,
          borderRadius: isExpanding ? 0 : 22,
          border: isExpanding ? 'none' : '7px solid #1c1c1e',
          overflow: 'hidden',
          transform: isExpanding || isScanning
            ? 'scale(4.5)'
            : 'scale(1)',
          opacity: isScanning ? 0 : 1,
          transition: [
            'transform 0.95s cubic-bezier(0.2, 1, 0.3, 1)',
            'border-radius 0.4s ease',
            'border 0.2s ease',
            'opacity 0.2s ease',
          ].join(', '),
          zIndex: 2,
        }}
      >
        {/* Imagen dentro del teléfono */}
        <Image src={imageSrc} alt="" fill className="object-cover" />

        {/* HUD cámara */}
        <div
          style={{
            position: 'absolute', inset: 0,
            opacity: isPhone ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          {/* Barra superior cámara */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '6px 8px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, letterSpacing: 0.5 }}>FOTO</span>
            {/* Flash icon */}
            <span style={{ color: 'rgba(255,220,0,0.9)', fontSize: 8 }}>⚡</span>
          </div>

          {/* Cuadro de enfoque */}
          <div
            style={{
              position: 'absolute',
              top: '28%', left: '18%', right: '18%', bottom: '28%',
              border: '1.5px solid rgba(255,255,255,0.75)',
              borderRadius: 3,
            }}
          />
          {/* Esquinas del visor */}
          {[
            { top: '28%', left: '18%' },
            { top: '28%', right: '18%' },
            { bottom: '28%', left: '18%' },
            { bottom: '28%', right: '18%' },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 8, height: 8,
              ...pos,
              borderTop: i < 2 ? '2px solid #F97316' : undefined,
              borderBottom: i >= 2 ? '2px solid #F97316' : undefined,
              borderLeft: i % 2 === 0 ? '2px solid #F97316' : undefined,
              borderRight: i % 2 === 1 ? '2px solid #F97316' : undefined,
            }} />
          ))}

          {/* Texto inferior */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '5px 8px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              textAlign: 'center',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 7 }}>
              Analizando con IA...
            </span>
          </div>
        </div>
      </div>

      {/* Flash de cámara */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'white',
          opacity: isFlash ? 0.92 : 0,
          transition: isFlash ? 'opacity 0.08s ease-in' : 'opacity 0.3s ease-out',
          zIndex: 5,
        }}
      />

      {/* ── Scanner HUD (solo en fase scanning) ── */}

      {/* Grid de líneas tenues */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,180,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,180,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: isScanning ? 1 : 0,
          transition: 'opacity 0.5s ease',
          zIndex: 3,
        }}
      />

      {/* Línea de escaneo */}
      {isScanning && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: 2,
            background: 'linear-gradient(90deg, transparent, #00FFB4, transparent)',
            boxShadow: '0 0 12px 3px rgba(0,255,180,0.5)',
            animation: 'nuti-scan 2s linear infinite',
            zIndex: 4,
          }}
        />
      )}

      {/* Esquinas tipo visor */}
      {isScanning && [
        { top: '8%',  left:  '5%',  borderTop: 2, borderLeft:  2 },
        { top: '8%',  right: '5%',  borderTop: 2, borderRight: 2 },
        { bottom: '22%', left:  '5%',  borderBottom: 2, borderLeft:  2 },
        { bottom: '22%', right: '5%',  borderBottom: 2, borderRight: 2 },
      ].map((style, i) => (
        <div
          key={i}
          className="absolute w-5 h-5 pointer-events-none"
          style={{ ...style, borderColor: '#00FFB4', borderStyle: 'solid', zIndex: 4 }}
        />
      ))}

      {/* Puntos de detección */}
      {isScanning && detectionDots.map((dot, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: dotsVisible[i] ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 4,
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: -6,
              border: '1.5px solid rgba(0,255,180,0.5)',
              animation: dotsVisible[i] ? 'nuti-ring 1.5s ease-out infinite' : 'none',
            }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: '#00FFB4',
              boxShadow: '0 0 6px rgba(0,255,180,0.8)',
              animation: dotsVisible[i] ? 'nuti-pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
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

      {/* Panel macros */}
      {isScanning && (
        <div
          className="absolute top-3 right-3 rounded-xl px-3 py-2 text-right"
          style={{ background: 'rgba(0,0,0,0.85)', minWidth: 80, zIndex: 4 }}
        >
          <p className="text-lg font-bold leading-none" style={{ color: '#F97316' }}>
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
      )}

      {/* Barra inferior */}
      {isScanning && (
        <div
          className="absolute bottom-0 left-0 right-0 px-4 py-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 70%, transparent)', zIndex: 4 }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold text-white">{foodName}</p>
            <p className="text-[11px] font-medium" style={{ color: '#00FFB4' }}>{barWidth}%</p>
          </div>
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
      )}

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
