'use client'

import type { NutiPose } from '@/constants/nuti-messages'

export type { NutiPose }

interface NutriaImageProps {
  pose?: NutiPose
  size?: number | string // Allow '100%' or string values
  className?: string
  priority?: boolean
  withGlow?: boolean
  maxWidth?: string // Added maxWidth for flexible sizing
}

export function NutriaImage({
  pose = 'broccoli',
  size = '100%',
  className,
  withGlow = false,
  maxWidth = '420px',
}: NutriaImageProps) {
  const img = (
    <img
      src={`/images/mascot/nutria-${pose}.png`}
      alt="Nuti"
      onError={(e) => {
        e.currentTarget.src = `/images/mascot/nutria-${pose}.jpg`;
      }}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
      }}
      className={className ?? 'drop-shadow-lg'}
    />
  )

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        maxWidth: maxWidth,
        minHeight: '200px', // Prevent layout shift (flicker)
        overflow: 'hidden',
        border: 'none',
        borderRadius: '0',
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
      <div className="relative z-10 w-full">{img}</div>
    </div>
  )
}
