import type { ReactNode } from 'react'

export function AppPage({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`page-container app-grid ${className}`.trim()}>{children}</div>
}

export function AppHero({
  eyebrow,
  eyebrowClassName,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string
  eyebrowClassName?: string
  title: string
  description?: string
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="hero-surface overflow-hidden px-5 pb-6 pt-5 md:px-6">
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            {eyebrow ? <p className={`app-kicker mb-2 text-white/72 ${eyebrowClassName ?? ''}`.trim()}>{eyebrow}</p> : null}
            <h1 className="display-title text-[2rem] font-semibold leading-[1.02] text-white md:text-[2.5rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/76 md:text-[0.95rem]">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  )
}

export function AppPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`app-panel ${className}`.trim()}>{children}</section>
}

export function AppSectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="app-section-label">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-[var(--ink-2)]">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
