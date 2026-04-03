'use client'

// Componente de captura de foto para registro de comida
// Permite seleccionar o hacer foto y previsualizarla antes de analizar

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'

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
    <div className="flex flex-col gap-4">
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
          className="
            w-full border-2 border-dashed border-stone-300 rounded-2xl
            flex flex-col items-center justify-center gap-3
            py-16 px-6 text-stone-500
            hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500
            transition-colors min-h-[200px]
          "
        >
          <Camera className="w-12 h-12 text-stone-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-center leading-snug">
            Toca para hacer foto
            <br />
            <span className="text-stone-400 font-normal">o seleccionar de la galería</span>
          </p>
        </button>
      ) : (
        // Previsualización de la foto seleccionada
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="Foto de comida seleccionada"
              className="w-full max-h-64 object-cover"
            />
          </div>

          <div className="flex gap-3">
            {/* Botón para cambiar la foto */}
            <button
              onClick={handleChangeFoto}
              disabled={isLoading}
              className="
                flex-1 py-3 rounded-2xl border-2 border-stone-300
                text-stone-600 text-sm font-medium
                hover:bg-stone-50 transition-colors
                min-h-[44px] disabled:opacity-50
              "
            >
              Cambiar foto
            </button>

            {/* Botón principal de análisis */}
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="
                flex-[2] py-3 rounded-2xl bg-orange-500
                text-white text-sm font-medium
                hover:bg-orange-600 transition-colors
                min-h-[44px] disabled:opacity-70
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                'Analizar'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
