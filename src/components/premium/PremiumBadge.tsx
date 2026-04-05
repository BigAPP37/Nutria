'use client'

// Badge visual para indicar el estado Premium del usuario
interface PremiumBadgeProps {
  size?: 'sm' | 'md'
}

export function PremiumBadge({ size = 'md' }: PremiumBadgeProps) {
  const isSmall = size === 'sm'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isSmall ? 3 : 4,
      padding: isSmall ? '3px 7px' : '4px 10px',
      borderRadius: isSmall ? 7 : 9,
      background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
      color: 'white',
      fontSize: isSmall ? 10 : 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      boxShadow: '0 2px 6px rgba(245,158,11,0.4)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      ✨ Premium
    </span>
  )
}
