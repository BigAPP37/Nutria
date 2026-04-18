import path from "node:path";
import type { NextConfig } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const appUrlObject = new URL(appUrl)
const appOrigin = appUrlObject.origin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseUrlObject = supabaseUrl ? new URL(supabaseUrl) : null
const supabaseOrigin = supabaseUrlObject?.origin
const supabaseHostname = supabaseUrlObject?.hostname
const isDevelopment = process.env.NODE_ENV !== 'production'
const connectSrc = [
  "'self'",
  appOrigin,
  supabaseOrigin,
  'https://api.anthropic.com',
  'https://*.upstash.io',
  'https://*.vercel-insights.com',
  'https://*.stripe.com',
].filter(Boolean).join(' ')

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDevelopment ? "'unsafe-eval'" : null,
    'https://js.stripe.com',
    'https://*.vercel-insights.com',
  ].filter(Boolean).join(' '),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  ["img-src 'self' data: blob:", supabaseOrigin].filter(Boolean).join(' '),
  `connect-src ${connectSrc}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            port: '',
            pathname: '/storage/v1/object/**',
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
