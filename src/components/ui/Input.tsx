'use client'

// Componente Input reutilizable con soporte para labels, errores y prefijos/sufijos
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = '', id, type = 'text', ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
    const isNumeric = type === 'number'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-semibold text-[var(--ink-2)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Prefijo (ícono o texto a la izquierda) */}
          {prefix && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            inputMode={isNumeric ? 'numeric' : 'text'}
            pattern={isNumeric ? '[0-9]*' : undefined}
            className={[
              'w-full rounded-[1rem] border',
              'bg-white/92 text-[var(--ink-1)] placeholder:text-[var(--ink-3)]',
              'py-3 text-sm shadow-[0_12px_28px_rgba(86,49,26,0.06)]',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[rgba(201,106,43,0.18)] focus:border-[var(--color-primary-400)]',
              'disabled:bg-[var(--surface-1)] disabled:text-[var(--ink-3)] disabled:cursor-not-allowed',
              error
                ? 'border-amber-400 focus:ring-amber-400'
                : 'border-[var(--line-strong)] hover:border-[rgba(201,106,43,0.28)]',
              prefix ? 'pl-10' : 'px-3.5',
              suffix ? 'pr-10' : 'pr-3.5',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {/* Sufijo (ícono o texto a la derecha) */}
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--ink-3)]">
              {suffix}
            </div>
          )}
        </div>

        {/* Mensaje de error (usando amber en lugar de rojo) */}
        {error && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-700">
            <span>⚠</span> {error}
          </p>
        )}

        {/* Hint informativo */}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-[var(--ink-3)]">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
