// =============================================================================
// NUTRIA — Tipos TypeScript para React Native
// Importar en la app: import type { ... } from '@/types/ai-log'
// =============================================================================

// ---- Request ----

export interface AiLogRequest {
  method: 'photo' | 'text' | 'barcode';
  payload: string;           // base64 (foto), texto libre, o código de barras
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  country_code: string;      // "ES", "MX", "AR"...
  photo_storage_path?: string;
}

// ---- Response ----

export interface AiLogResponse {
  success: boolean;
  plato_descripcion: string;
  origen_cultural: string | null;
  confianza_general: number;  // 0.0 – 1.0
  alimentos: AlimentoDetectado[];
  totales: NutritionTotals;
  ambiguedades?: string[];    // ej: ["¿Tortilla española o mexicana?"]
  log_entry_ids: string[];    // UUIDs de las entradas creadas
  processing_ms?: number;
}

export interface AlimentoDetectado {
  nombre: string;
  cantidad_gramos: number;
  calorias_estimadas: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasa_g: number;
  fibra_g: number;
  confianza: number;          // 0.0 – 1.0
  metodo_estimacion: 'db_match' | 'claude_estimate';
  db_food_id: string | null;
  db_serving_id?: string | null;
  notas: string | null;
}

export interface NutritionTotals {
  calorias: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasa_g: number;
  fibra_g: number;
}

// ---- Error ----

export interface AiLogError {
  success: false;
  error: string;
  barcode?: string;
  processing_ms?: number;
}

// ---- Helper para la app ----

export type AiLogResult = AiLogResponse | AiLogError;

export function isAiLogSuccess(result: AiLogResult): result is AiLogResponse {
  return result.success === true;
}

// ---- Ejemplo de uso en React Native ----
//
// import { supabase } from '@/lib/supabase';
// import type { AiLogRequest, AiLogResult, isAiLogSuccess } from '@/types/ai-log';
//
// async function logMealByPhoto(base64: string, storagePath: string) {
//   const { data, error } = await supabase.functions.invoke('ai-log', {
//     body: {
//       method: 'photo',
//       payload: base64,
//       user_id: session.user.id,
//       meal_type: 'lunch',
//       country_code: userProfile.country_code,
//       photo_storage_path: storagePath,
//     } satisfies AiLogRequest,
//   });
//
//   if (error) throw error;
//   const result = data as AiLogResult;
//
//   if (isAiLogSuccess(result)) {
//     // Mostrar resultado: result.alimentos, result.totales
//     // Si result.ambiguedades?.length > 0, mostrar picker al usuario
//   } else {
//     // Manejar error: result.error
//   }
// }
