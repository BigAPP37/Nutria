// src/features/logging/photoUpload.ts
// Sube una foto de comida a Supabase Storage.
// Comprime a 1024px máximo y calidad 0.8 antes de subir.
// Path: photos/{userId}/{fecha}/{timestamp}_{mealType}.jpg

import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import { getTodayDateKey } from "@/lib/date";

const BUCKET = "meal-photos";
const MAX_SIZE = 1024;
const QUALITY = 0.8;
const UPLOAD_TIMEOUT = 15_000;

interface UploadResult {
  path: string;
  base64: string; // se reutiliza para enviar a Claude
}

/**
 * Comprime la imagen a 1024px y la sube a Supabase Storage.
 * Retorna el path en Storage y el base64 comprimido.
 */
export async function uploadMealPhoto(
  photoUri: string,
  userId: string,
  mealType: string
): Promise<UploadResult> {
  // 1. Comprimir y redimensionar
  const manipulated = await ImageManipulator.manipulateAsync(
    photoUri,
    [{ resize: { width: MAX_SIZE } }],
    {
      compress: QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!manipulated.base64) {
    throw new Error("No se pudo convertir la imagen a base64");
  }

  // 2. Construir path único
  const date = getTodayDateKey();
  const timestamp = Date.now();
  const path = `photos/${userId}/${date}/${timestamp}_${mealType}.jpg`;

  // 3. Subir a Supabase Storage con timeout
  const uploadPromise = supabase.storage
    .from(BUCKET)
    .upload(path, decode(manipulated.base64), {
      contentType: "image/jpeg",
      upsert: false,
    });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout subiendo foto")), UPLOAD_TIMEOUT)
  );

  const { error } = await Promise.race([uploadPromise, timeoutPromise]);

  if (error) {
    throw new Error(`Error subiendo foto: ${error.message}`);
  }

  return {
    path,
    base64: manipulated.base64,
  };
}
