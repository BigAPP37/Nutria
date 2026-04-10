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
    'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white shadow-[0_18px_32px_rgba(169,83,34,0.22)] active:bg-[var(--color-primary-700)]',
  secondary:
    'bg-[var(--forest)] hover:bg-[var(--color-secondary-700)] text-white shadow-[0_18px_32px_rgba(40,89,79,0.18)] active:bg-[var(--color-secondary-700)]',
  warm: 'bg-[#f3b843] hover:bg-[#de9e22] text-[var(--ink-1)] shadow-[0_18px_32px_rgba(243,184,67,0.18)] active:bg-[#c98e1e]',
  ghost:
    'bg-transparent hover:bg-[var(--surface-1)] text-[var(--ink-2)] active:bg-[var(--surface-1)]',
  outline:
    'border border-[var(--line-strong)] bg-white/88 hover:bg-[var(--surface-2)] text-[var(--ink-2)] active:bg-[var(--surface-1)] shadow-[0_10px_24px_rgba(86,49,26,0.04)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-sm rounded-xl',
  md: 'px-4.5 py-2.5 text-sm rounded-[1rem]',
  lg: 'px-6 py-3.5 text-base rounded-[1.25rem]',
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
          'font-semibold tracking-[-0.01em]',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(201,106,43,0.32)] focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
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
