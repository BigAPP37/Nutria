'use client'

// Componente de captura de foto para registro de comida
// Permite seleccionar o hacer foto y previsualizarla antes de analizar

import { useRef, useState } from 'react'
import { Camera, Loader2, RefreshCw, Sparkles } from 'lucide-react'

interface PhotoCaptureProps {
  onAnalyze: (file: File) => void
  isLoading: boolean
}

export function PhotoCapture({ onAnalyze, isLoading }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Maneja la selección del archivo de imagen
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Limpia la URL anterior para evitar memory leaks
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(url)
  }

  // Abre el selector de archivos / cámara
  function handleAreaClick() {
    inputRef.current?.click()
  }

  // Envía el archivo al handler de análisis
  function handleAnalyze() {
    if (selectedFile) {
      onAnalyze(selectedFile)
    }
  }

  // Reinicia la selección para cambiar la foto
  function handleChangeFoto() {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    // Limpia el valor del input para permitir seleccionar la misma foto
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Input oculto — accede a la cámara en móvil */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        // Zona de selección con área táctil grande
        <button
          onClick={handleAreaClick}
          style={{
            width: '100%',
            border: '2px dashed #E7E5E4',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '48px 24px',
            background: 'white',
            cursor: 'pointer',
            minHeight: 220,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#F97316'
            e.currentTarget.style.background = '#FFF7ED'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E7E5E4'
            e.currentTarget.style.background = 'white'
          }}
        >
          {/* Icono de cámara con gradiente */}
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
          }}>
            <Camera style={{ width: 32, height: 32, color: 'white' }} strokeWidth={1.75} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', marginBottom: 6 }}>
              Haz una foto de tu comida
            </p>
            <p style={{ fontSize: 13, color: '#A8A29E', lineHeight: 1.5 }}>
              o selecciona una de la galería
            </p>
          </div>

          {/* Badge de IA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: 99,
          }}>
            <Sparkles style={{ width: 12, height: 12, color: '#F97316' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#F97316' }}>IA analiza los nutrientes</span>
          </div>
        </button>
      ) : (
        // Previsualización de la foto seleccionada
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            position: 'relative',
            borderRadius: 20,
            overflow: 'hidden',
            background: '#F5F4F3',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="Foto de comida seleccionada"
              style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
            />
            {/* Overlay de carga */}
            {isLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Analizando...</p>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Botón para cambiar la foto */}
            <button
              onClick={handleChangeFoto}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: 14,
                border: '1.5px solid #E7E5E4',
                background: 'white',
                color: '#78716C',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <RefreshCw style={{ width: 15, height: 15 }} />
              Cambiar foto
            </button>

            {/* Botón principal de análisis */}
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              style={{
                flex: 2,
                padding: '13px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles style={{ width: 16, height: 16 }} />
                  Analizar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
