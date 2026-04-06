'use client'

// Hook de TanStack Query para llamar a la Edge Function de análisis con IA
// Maneja upload de foto y llamada al endpoint con timeout de 25 segundos

import { useMutation } from '@tanstack/react-query'
import type { MealType } from '@/types/database'
import type { AiLogResponse } from '@/types/logging'
import { uploadPhoto } from '@/hooks/usePhotoUpload'

interface AiLogParams {
  method: 'photo' | 'text'
  userId: string
  mealType: MealType
  logDate: string
  textPayload?: string
  photoFile?: File
  countryCode?: string
}

// Convierte un Blob a string base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Error al convertir imagen a base64'))
    reader.readAsDataURL(blob)
  })
}


// Llama al Route Handler /api/ai-log con timeout de 25s
async function fetchAiLog(
  body: Record<string, unknown>
): Promise<AiLogResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25_000)

  try {
    const response = await fetch('/api/ai-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error del servidor (${response.status}): ${errorText || 'Error desconocido'}`)
    }

    const data: AiLogResponse = await response.json()
    if (!data.success) throw new Error('La IA no pudo analizar la comida. Intenta de nuevo.')
    return data
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Intenta de nuevo.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// Función principal que llama a la Edge Function de análisis
async function callAiLog(params: AiLogParams): Promise<AiLogResponse> {
  const {
    method,
    userId,
    mealType,
    logDate,
    textPayload,
    photoFile,
    countryCode = 'ES',
  } = params

  let payload = ''
  let photoStoragePath: string | undefined

  if (method === 'photo') {
    if (!photoFile) throw new Error('Se requiere una foto para el método photo')
    const { path } = await uploadPhoto(photoFile, userId, logDate)
    photoStoragePath = path
    payload = await blobToBase64(photoFile)
  } else {
    if (!textPayload?.trim()) throw new Error('Se requiere texto para el método text')
    payload = textPayload.trim()
  }

  return fetchAiLog({
    method,
    payload,
    meal_type: mealType,
    country_code: countryCode,
    photo_storage_path: photoStoragePath,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    log_date: logDate,
  })
}

// Hook que retorna la mutación de TanStack Query para el análisis con IA
export function useAiLog() {
  return useMutation<AiLogResponse, Error, AiLogParams>({
    mutationFn: callAiLog,
  })
}
