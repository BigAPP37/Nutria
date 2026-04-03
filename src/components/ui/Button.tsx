'use client'

// Componente Button reutilizable
// Variantes: primary (naranja), secondary (verde menta), ghost, outline
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'warm'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 hover:bg-orange-600 text-white shadow-sm active:bg-orange-700',
  secondary:
    'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:bg-emerald-700',
  warm: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:bg-amber-700',
  ghost:
    'bg-transparent hover:bg-stone-100 text-stone-700 active:bg-stone-200',
  outline:
    'border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 active:bg-stone-100',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center gap-2',
          'font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
