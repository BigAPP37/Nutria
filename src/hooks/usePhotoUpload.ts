// Utilidad para comprimir y subir fotos de comida a Supabase Storage
// No es un hook de React — es una función async pura

import { createClient } from '@/lib/supabase/client'

// Comprime una imagen usando canvas antes de subirla
// Máximo 1024px en cualquier dimensión, calidad 0.7
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const MAX_SIZE = 1024
      let { width, height } = img

      // Calcula las dimensiones respetando la proporción
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width)
          width = MAX_SIZE
        } else {
          width = Math.round((width * MAX_SIZE) / height)
          height = MAX_SIZE
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo comprimir la imagen'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.7
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al cargar la imagen'))
    }

    img.src = url
  })
}

// Sube una foto al bucket 'food-photos' en Supabase Storage
// Retorna la ruta y URL pública del archivo subido
export async function uploadPhoto(
  file: File,
  userId: string,
  date: string
): Promise<{ path: string; url: string }> {
  const supabase = createClient()

  // Comprime la imagen antes de subir
  const compressedBlob = await compressImage(file)

  // Construye la ruta única del archivo
  const path = `${userId}/${date}/${Date.now()}.jpg`

  // Sube al bucket de fotos de comida
  const { error } = await supabase.storage
    .from('food-photos')
    .upload(path, compressedBlob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Error al subir la foto: ${error.message}`)
  }

  // Genera una URL firmada (bucket privado) — válida 7 días
  const { data: signedData, error: signedError } = await supabase.storage
    .from('food-photos')
    .createSignedUrl(path, 60 * 60 * 24 * 7)

  if (signedError || !signedData) {
    throw new Error(`Error al obtener URL de la foto: ${signedError?.message}`)
  }

  return {
    path,
    url: signedData.signedUrl,
  }
}
