// Layout raíz de la aplicación
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Nutria – Tu asistente de nutrición',
  description:
    'Nutria te ayuda a alcanzar tus objetivos de salud con seguimiento inteligente de calorías y macros.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F97316',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans bg-[#FAFAF9] text-stone-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
