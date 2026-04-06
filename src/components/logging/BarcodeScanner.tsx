'use client'

// Escáner de código de barras usando BarcodeDetector Web API + stream de cámara
// Compatible con Chrome 83+, Edge 83+, Safari iOS 17+

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void
  isSearching: boolean
}

export function BarcodeScanner({ onDetected, isSearching }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const detectedRef = useRef(false)

  const [status, setStatus] = useState<'loading' | 'scanning' | 'unsupported' | 'error' | 'found'>('loading')

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }, [])

  useEffect(() => {
    async function init() {
      if (!('BarcodeDetector' in window)) {
        setStatus('unsupported')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // @ts-expect-error — BarcodeDetector no está en los tipos de TS todavía
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        })

        setStatus('scanning')

        intervalRef.current = setInterval(async () => {
          if (detectedRef.current || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const results = await detector.detect(videoRef.current)
            if (results.length > 0) {
              detectedRef.current = true
              setStatus('found')
              stopCamera()
              onDetected(results[0].rawValue as string)
            }
          } catch {
            // Continuar escaneando
          }
        }, 400)
      } catch {
        setStatus('error')
      }
    }

    init()
    return stopCamera
  }, [onDetected, stopCamera])

  if (status === 'unsupported') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>📷</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', marginBottom: 6 }}>
          Escáner no disponible
        </p>
        <p style={{ fontSize: 13, color: '#78716C', lineHeight: 1.5 }}>
          Tu navegador no soporta el escáner de códigos de barras.{' '}
          Prueba con Chrome o Safari iOS 17+.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🚫</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', marginBottom: 6 }}>
          Sin acceso a la cámara
        </p>
        <p style={{ fontSize: 13, color: '#78716C' }}>
          Permite el acceso a la cámara en los ajustes del navegador e inténtalo de nuevo.
        </p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
      {/* Stream de vídeo */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Overlay con visor */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Visor de escaneo */}
        <div style={{
          position: 'relative',
          width: '72%',
          aspectRatio: '3/2',
          borderRadius: 12,
        }}>
          {/* Esquinas del visor */}
          {(['tl','tr','bl','br'] as const).map((pos) => (
            <div key={pos} style={{
              position: 'absolute',
              width: 24, height: 24,
              borderColor: status === 'found' ? '#10B981' : 'white',
              borderStyle: 'solid',
              borderWidth: 0,
              ...(pos === 'tl' && { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: '6px 0 0 0' }),
              ...(pos === 'tr' && { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderRadius: '0 6px 0 0' }),
              ...(pos === 'bl' && { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: '0 0 0 6px' }),
              ...(pos === 'br' && { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: '0 0 6px 0' }),
            }} />
          ))}

          {/* Línea de escaneo animada */}
          {status === 'scanning' && (
            <div style={{
              position: 'absolute', left: 4, right: 4, height: 2,
              background: 'rgba(249,115,22,0.9)',
              borderRadius: 1,
              animation: 'scanLine 1.8s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(249,115,22,0.8)',
            }} />
          )}
        </div>

        {/* Texto de estado */}
        <p style={{
          marginTop: 16,
          fontSize: 13,
          fontWeight: 600,
          color: 'white',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          textAlign: 'center',
        }}>
          {status === 'loading' && 'Iniciando cámara...'}
          {status === 'scanning' && 'Apunta al código de barras'}
          {status === 'found' && '✓ Código detectado'}
        </p>
      </div>

      {/* Spinner de carga o búsqueda */}
      {(status === 'loading' || isSearching) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={36} color="white" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* CSS animation */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; opacity: 1; }
          50%  { top: 85%; opacity: 1; }
          100% { top: 10%; opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
