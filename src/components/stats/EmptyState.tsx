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
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      {icon ?? <BarChart2 className="w-10 h-10 text-stone-300" />}
      <p className="text-sm text-stone-400 text-center max-w-[200px]">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium active:opacity-80 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
