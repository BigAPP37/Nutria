// Layout raíz de la aplicación
import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope, Oswald } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-oswald',
})

export const metadata: Metadata = {
  title: 'Nutria – Tu asistente de nutrición',
  description:
    'Nutria te ayuda a alcanzar tus objetivos de salud con seguimiento inteligente de calorías y macros.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C96A2B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${fraunces.variable} ${oswald.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-[var(--surface-0)] text-[var(--ink-1)] min-h-screen">
        {children}
      </body>
    </html>
  )
}
