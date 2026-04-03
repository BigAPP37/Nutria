'use client'

// Badge visual para indicar el estado Premium del usuario
interface PremiumBadgeProps {
  size?: 'sm' | 'md'
}

export function PremiumBadge({ size = 'md' }: PremiumBadgeProps) {
  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 rounded-md'
      : 'text-xs px-2 py-1 rounded-lg'

  return (
    <span className={`bg-amber-50 text-amber-600 font-medium inline-flex items-center gap-0.5 ${sizeClasses}`}>
      ✨ Premium
    </span>
  )
}
