'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, BarChart2, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home,      label: 'Inicio'    },
  { href: '/log',       icon: PlusCircle, label: 'Registrar', accent: true },
  { href: '/stats',     icon: BarChart2,  label: 'Progreso'  },
  { href: '/settings',  icon: Settings,   label: 'Ajustes'   },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid #F0EDE9',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label, accent }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

        if (accent) {
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90 group-active:scale-90"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
                  boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
                  marginTop: -20,
                }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-[10px] font-semibold mt-0.5"
                style={{ color: '#F97316' }}
              >
                {label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors"
          >
            <Icon
              className="w-5 h-5 transition-colors"
              style={{ color: isActive ? '#F97316' : '#A8A29E' }}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              className="text-[10px] font-medium transition-colors"
              style={{ color: isActive ? '#F97316' : '#A8A29E' }}
            >
              {label}
            </span>
            {isActive && (
              <div
                className="absolute bottom-0 w-6 rounded-full"
                style={{ height: 3, background: '#F97316' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
