'use client'

import Image from 'next/image'
import type { NutiPose } from '@/constants/nuti-messages'

export type { NutiPose }

interface NutriaImageProps {
  pose?: NutiPose
  size?: number | string
  className?: string
  priority?: boolean
  withGlow?: boolean
  maxWidth?: string
}

export function NutriaImage({
  pose = 'broccoli',
  size = '100%',
  className,
  priority = false,
  withGlow = false,
  maxWidth = '420px',
}: NutriaImageProps) {
  // Calcular sizes hint para el optimizador de Next.js
  const sizesHint =
    typeof size === 'number'
      ? `${size}px`
      : `(max-width: 768px) 100vw, ${maxWidth}`

  // Altura mínima del contenedor para evitar layout shift
  const minH = typeof size === 'number' ? size : 200

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        maxWidth: maxWidth,
        minHeight: minH,
        margin: '0 auto',
      }}
    >
      {withGlow && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-20px',
            background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 65%)',
          }}
        />
      )}
      <div className="relative z-10 w-full" style={{ aspectRatio: '1 / 1' }}>
        <Image
          src={`/nutria-${pose}.png`}
          alt="Nuti"
          fill
          sizes={sizesHint}
          priority={priority}
          className={`object-contain drop-shadow-lg${className ? ` ${className}` : ''}`}
        />
      </div>
    </div>
  )
}
