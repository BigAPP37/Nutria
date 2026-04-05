// Componente de estado vacío reutilizable para las secciones de estadísticas
'use client'

import { BarChart2 } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '32px 16px',
    }}>
      {/* Icono en contenedor redondeado */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 20,
        background: '#F5F4F3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon ?? <BarChart2 style={{ width: 28, height: 28, color: '#C4B9B3' }} />}
      </div>

      <p style={{
        fontSize: 14,
        color: '#78716C',
        textAlign: 'center',
        maxWidth: 220,
        lineHeight: 1.5,
        fontWeight: 500,
      }}>
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
