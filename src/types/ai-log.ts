// src/types/ai-log.ts
export interface AiLogRequest {
  method: "photo"|"text"|"barcode"; payload: string; user_id: string;
  meal_type: "breakfast"|"lunch"|"dinner"|"snack"; country_code: string;
  photo_storage_path?: string;
}
export interface AiLogResponse {
  success: boolean; plato_descripcion: string; origen_cultural: string|null;
  confianza_general: number; alimentos: AlimentoDetectado[];
  totales: NutritionTotals; ambiguedades?: string[]; log_entry_ids: string[];
  processing_ms?: number;
}
export interface AlimentoDetectado {
  nombre: string; cantidad_gramos: number; calorias_estimadas: number;
  proteina_g: number; carbohidratos_g: number; grasa_g: number; fibra_g: number;
  confianza: number; metodo_estimacion: "db_match"|"claude_estimate";
  db_food_id: string|null; db_serving_id?: string|null; notas: string|null;
}
export interface NutritionTotals { calorias: number; proteina_g: number; carbohidratos_g: number; grasa_g: number; fibra_g: number; }
export type AiLogResult = AiLogResponse | { success: false; error: string };
export function isAiLogSuccess(r: AiLogResult): r is AiLogResponse { return r.success === true; }
