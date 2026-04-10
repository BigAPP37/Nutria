'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, BarChart2, Settings, UtensilsCrossed } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home,             label: 'Inicio'    },
  { href: '/plans',     icon: UtensilsCrossed,  label: 'Dietas'    },
  { href: '/log',       icon: PlusCircle,       label: 'Registrar', accent: true },
  { href: '/stats',     icon: BarChart2,        label: 'Progreso'  },
  { href: '/settings',  icon: Settings,         label: 'Ajustes'   },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]"
    >
      <div
        className="mx-auto flex w-full max-w-md items-center gap-1 rounded-[1.85rem] border border-[var(--line-soft)] bg-[rgba(255,252,247,0.92)] px-2 py-2 shadow-[0_-20px_38px_rgba(61,33,18,0.08)] backdrop-blur-xl"
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label, accent }) => {
          const isActive =
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

          if (accent) {
            return (
              <Link
                key={href}
                href={href}
                className="group flex flex-1 items-center justify-center"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex min-w-[5.25rem] flex-col items-center gap-1 rounded-[1.35rem] bg-[linear-gradient(145deg,var(--hero-start),var(--hero-mid),var(--hero-end))] px-3 py-2.5 shadow-[0_18px_30px_rgba(126,62,34,0.26)] transition-transform group-active:scale-[0.96]">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white/18"
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-white">
                    {label}
                  </span>
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 py-2.5 transition-colors"
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-[1.2rem] bg-[rgba(201,106,43,0.1)]" />
              )}
              <Icon
                className="relative h-5 w-5 transition-colors"
                style={{ color: isActive ? 'var(--color-primary-600)' : 'var(--ink-3)' }}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className="relative text-[10px] font-semibold transition-colors"
                style={{ color: isActive ? 'var(--color-primary-600)' : 'var(--ink-3)' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
