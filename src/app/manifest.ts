import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nutria',
    short_name: 'Nutria',
    description: 'Tu asistente de nutrición',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FAFAF9',
    theme_color: '#F97316',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
