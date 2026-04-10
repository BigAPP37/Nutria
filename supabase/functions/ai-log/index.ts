// =============================================================================
// NUTRIA — Edge Function: /ai-log
// Pipeline completo de IA para logging de comidas
// Maneja: foto (Claude Vision), texto natural, barcode
// Runtime: Supabase Edge Functions (Deno)
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// =============================================================================
// TIPOS
// =============================================================================

interface AiLogRequest {
  method: "photo" | "text" | "barcode";
  payload: string; // base64 image, texto libre, o código de barras
  user_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  country_code: string; // "ES", "MX", "AR", etc.
  photo_storage_path?: string; // si la foto ya está en Storage
}

interface AlimentoDetectado {
  nombre: string;
  cantidad_gramos: number;
  calorias_estimadas: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasa_g: number;
  fibra_g: number;
  confianza: number;
  metodo_estimacion: "db_match" | "claude_estimate";
  db_food_id: string | null;
  db_serving_id?: string | null;
  notas: string | null;
}

interface NutritionTotals {
  calorias: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasa_g: number;
  fibra_g: number;
}

interface AiLogResponse {
  success: boolean;
  plato_descripcion: string;
  origen_cultural: string | null;
  confianza_general: number;
  alimentos: AlimentoDetectado[];
  totales: NutritionTotals;
  ambiguedades?: string[];
  log_entry_ids: string[];
}

interface ClaudeAlimento {
  nombre: string;
  cantidad_gramos: number;
  calorias_estimadas: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasa_g: number;
  fibra_g: number;
  confianza: number;
  notas: string | null;
}

interface ClaudeResponse {
  plato_descripcion: string;
  origen_cultural: string | null;
  confianza_general: number;
  alimentos: ClaudeAlimento[];
  totales: NutritionTotals;
  ambiguedades?: string[];
}

interface FoodMatch {
  food_id: string;
  food_name: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  combined_rank: number;
}

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CLAUDE_MODEL = "claude-haiku-4-5-20250514";
const MATCH_THRESHOLD = 0.6;
const MAX_TOKENS_PHOTO = 1200;
const MAX_TOKENS_TEXT = 800;
const MAX_FREE_PHOTO_LOGS_PER_DAY = 3;

interface PremiumProfile {
  is_premium: boolean | null;
  premium_expires_at?: string | null;
  subscription_status?: string | null;
}

// =============================================================================
// PROMPT PARA CLAUDE (español, con few-shot)
// =============================================================================

const SYSTEM_PROMPT = `Eres el motor de análisis nutricional de Nutria, una app de conteo de calorías para hispanohablantes. Tu trabajo es identificar alimentos y estimar sus macronutrientes con precisión.

REGLAS ESTRICTAS:
1. Responde SOLO con JSON válido. Sin texto antes ni después.
2. Todos los valores nutricionales son por la CANTIDAD INDICADA, no por 100g.
3. Las cantidades en gramos deben ser REALISTAS:
   - Un huevo ≈ 55-65g
   - Una rebanada de pan ≈ 30-40g
   - Un plato de arroz ≈ 180-250g
   - Un vaso de leche ≈ 200-250ml
   - Una cucharada de aceite ≈ 13g
   - Una porción de carne/pescado ≈ 120-180g
4. Si la imagen está borrosa, oscura o no puedes identificar bien un alimento, asigna confianza < 0.5.
5. NUNCA pongas confianza > 0.85 a menos que estés muy seguro.
6. Para platos complejos (paella, cocido, fabada), desglosa los 3-5 ingredientes principales.
7. Interpreta contexto cultural según el país:
   - "tortilla" → España: tortilla de patatas (~250g porción) | México: tortilla de maíz (~30g)
   - "taco" → México: taco con relleno | España: raro, probablemente se refiere a taco mexicano
   - "frijoles" → México/Centroamérica | "judías/alubias" → España
8. Si detectas una ambigüedad cultural que no puedes resolver con el país, añádela al array "ambiguedades".

FORMATO DE RESPUESTA (JSON estricto):
{
  "plato_descripcion": "descripción natural breve en español",
  "origen_cultural": "ES" | "MX" | "AR" | "CO" | "CL" | "PE" | null,
  "confianza_general": 0.0-1.0,
  "alimentos": [
    {
      "nombre": "nombre del alimento",
      "cantidad_gramos": 150,
      "calorias_estimadas": 245,
      "proteina_g": 12.5,
      "carbohidratos_g": 8.0,
      "grasa_g": 18.0,
      "fibra_g": 2.1,
      "confianza": 0.0-1.0,
      "notas": null
    }
  ],
  "totales": {
    "calorias": 245,
    "proteina_g": 12.5,
    "carbohidratos_g": 8.0,
    "grasa_g": 18.0,
    "fibra_g": 2.1
  }
}`;

// Few-shot examples para mejorar consistencia
const FEW_SHOT_PHOTO = `Ejemplo — Foto de tortilla española con ensalada:
{
  "plato_descripcion": "Porción de tortilla española de patatas con ensalada mixta",
  "origen_cultural": "ES",
  "confianza_general": 0.82,
  "alimentos": [
    {
      "nombre": "tortilla española de patatas",
      "cantidad_gramos": 200,
      "calorias_estimadas": 310,
      "proteina_g": 14.0,
      "carbohidratos_g": 22.0,
      "grasa_g": 18.5,
      "fibra_g": 1.8,
      "confianza": 0.85,
      "notas": "Porción mediana, aparenta 2 huevos"
    },
    {
      "nombre": "ensalada mixta con tomate y lechuga",
      "cantidad_gramos": 120,
      "calorias_estimadas": 35,
      "proteina_g": 1.5,
      "carbohidratos_g": 5.0,
      "grasa_g": 0.8,
      "fibra_g": 2.5,
      "confianza": 0.75,
      "notas": "Sin aliño visible, estimación sin aceite"
    }
  ],
  "totales": {
    "calorias": 345,
    "proteina_g": 15.5,
    "carbohidratos_g": 27.0,
    "grasa_g": 19.3,
    "fibra_g": 4.3
  }
}`;

const FEW_SHOT_TEXT = `Ejemplo — Texto: "me comí dos huevos fritos con jamón serrano y un café con leche":
{
  "plato_descripcion": "Desayuno de dos huevos fritos con jamón serrano y café con leche",
  "origen_cultural": "ES",
  "confianza_general": 0.80,
  "alimentos": [
    {
      "nombre": "huevo frito",
      "cantidad_gramos": 120,
      "calorias_estimadas": 222,
      "proteina_g": 14.8,
      "carbohidratos_g": 0.8,
      "grasa_g": 17.6,
      "fibra_g": 0.0,
      "confianza": 0.85,
      "notas": "2 unidades, frito en aceite de oliva"
    },
    {
      "nombre": "jamón serrano",
      "cantidad_gramos": 30,
      "calorias_estimadas": 69,
      "proteina_g": 9.6,
      "carbohidratos_g": 0.0,
      "grasa_g": 3.4,
      "fibra_g": 0.0,
      "confianza": 0.78,
      "notas": "2-3 lonchas finas"
    },
    {
      "nombre": "café con leche",
      "cantidad_gramos": 200,
      "calorias_estimadas": 48,
      "proteina_g": 3.2,
      "carbohidratos_g": 4.8,
      "grasa_g": 1.8,
      "fibra_g": 0.0,
      "confianza": 0.72,
      "notas": "Taza estándar, leche semidesnatada asumida"
    }
  ],
  "totales": {
    "calorias": 339,
    "proteina_g": 27.6,
    "carbohidratos_g": 5.6,
    "grasa_g": 22.8,
    "fibra_g": 0.0
  }
}`;

// =============================================================================
// FUNCIONES CORE
// =============================================================================

/**
 * Llama a Claude API con imagen o texto
 */
async function callClaude(
  method: "photo" | "text",
  payload: string,
  countryCode: string,
  mealType: string
): Promise<ClaudeResponse> {
  const countryContext = getCountryContext(countryCode);
  const mealContext = getMealContext(mealType);

  let userContent: any[];

  if (method === "photo") {
    // Detectar si es base64 o URL
    const isUrl = payload.startsWith("http");
    const imageContent = isUrl
      ? { type: "image", source: { type: "url", url: payload } }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: detectMediaType(payload),
            data: payload,
          },
        };

    userContent = [
      imageContent,
      {
        type: "text",
        text: `Analiza esta foto de comida. País del usuario: ${countryCode} (${countryContext}). Comida: ${mealContext}.

${FEW_SHOT_PHOTO}

Responde SOLO con JSON válido siguiendo exactamente el formato mostrado.`,
      },
    ];
  } else {
    userContent = [
      {
        type: "text",
        text: `El usuario dice: "${payload}"

País del usuario: ${countryCode} (${countryContext}). Comida: ${mealContext}.

${FEW_SHOT_TEXT}

Extrae cada alimento mencionado, estima cantidades realistas si no se especifican, y responde SOLO con JSON válido.`,
      },
    ];
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: method === "photo" ? MAX_TOKENS_PHOTO : MAX_TOKENS_TEXT,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  // Limpiar posibles artefactos (```json...```)
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as ClaudeResponse;
  } catch {
    throw new Error(`Claude devolvió JSON inválido: ${cleaned.slice(0, 200)}`);
  }
}

/**
 * Busca match en la DB para un alimento detectado por Claude
 */
async function matchFood(
  supabase: any,
  nombre: string,
  countryCode: string
): Promise<FoodMatch | null> {
  const { data, error } = await supabase.rpc("search_foods", {
    p_query: nombre,
    p_embedding: null, // En v2: generar embedding del nombre
    p_country: countryCode,
    p_limit: 3,
  });

  if (error || !data || data.length === 0) return null;

  const best = data[0];
  if (best.combined_rank < MATCH_THRESHOLD) return null;

  return {
    food_id: best.food_id,
    food_name: best.food_name,
    calories_kcal: best.calories_kcal,
    protein_g: best.protein_g,
    carbs_g: best.carbs_g,
    fat_g: best.fat_g,
    combined_rank: best.combined_rank,
  };
}

/**
 * Busca alimento por código de barras
 */
async function lookupBarcode(
  supabase: any,
  barcode: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from("foods")
    .select(
      `
      id, name, brand, food_source,
      calories_kcal, protein_g, carbs_g, fat_g, fiber_g,
      sugar_g, sodium_mg, is_verified,
      food_servings (id, serving_name, serving_grams, is_default)
    `
    )
    .eq("barcode", barcode)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Enriquece los alimentos de Claude con matches de la DB
 * Si hay match, usa los nutrientes de la DB (más fiables) recalculados a la cantidad
 */
async function enrichWithDbMatches(
  supabase: any,
  alimentos: ClaudeAlimento[],
  countryCode: string
): Promise<AlimentoDetectado[]> {
  const enriched: AlimentoDetectado[] = [];

  // Ejecutar todos los matches en paralelo
  const matchPromises = alimentos.map((a) =>
    matchFood(supabase, a.nombre, countryCode)
  );
  const matches = await Promise.all(matchPromises);

  for (let i = 0; i < alimentos.length; i++) {
    const alimento = alimentos[i];
    const match = matches[i];

    if (match) {
      // Recalcular nutrientes de la DB a la cantidad estimada por Claude
      const factor = alimento.cantidad_gramos / 100;
      enriched.push({
        nombre: match.food_name,
        cantidad_gramos: alimento.cantidad_gramos,
        calorias_estimadas: round(match.calories_kcal * factor),
        proteina_g: round(match.protein_g * factor),
        carbohidratos_g: round(match.carbs_g * factor),
        grasa_g: round(match.fat_g * factor),
        fibra_g: round((alimento.fibra_g || 0) * (match.combined_rank > 0.8 ? 1 : 1)), // fibra from Claude if DB doesn't have it
        confianza: Math.min(alimento.confianza + 0.1, 0.95), // boost por DB match
        metodo_estimacion: "db_match",
        db_food_id: match.food_id,
        notas: alimento.notas,
      });
    } else {
      // Sin match: usar estimación directa de Claude con confianza reducida
      enriched.push({
        nombre: alimento.nombre,
        cantidad_gramos: alimento.cantidad_gramos,
        calorias_estimadas: alimento.calorias_estimadas,
        proteina_g: alimento.proteina_g,
        carbohidratos_g: alimento.carbohidratos_g,
        grasa_g: alimento.grasa_g,
        fibra_g: alimento.fibra_g,
        confianza: Math.max(alimento.confianza - 0.1, 0.2), // penalización por no match
        metodo_estimacion: "claude_estimate",
        db_food_id: null,
        notas: alimento.notas
          ? `${alimento.notas} | Sin match en DB`
          : "Sin match en DB, estimación directa de IA",
      });
    }
  }

  return enriched;
}

/**
 * Recalcula los totales a partir de los alimentos enriquecidos
 */
function recalcTotals(alimentos: AlimentoDetectado[]): NutritionTotals {
  return {
    calorias: round(alimentos.reduce((s, a) => s + a.calorias_estimadas, 0)),
    proteina_g: round(alimentos.reduce((s, a) => s + a.proteina_g, 0)),
    carbohidratos_g: round(
      alimentos.reduce((s, a) => s + a.carbohidratos_g, 0)
    ),
    grasa_g: round(alimentos.reduce((s, a) => s + a.grasa_g, 0)),
    fibra_g: round(alimentos.reduce((s, a) => s + a.fibra_g, 0)),
  };
}

/**
 * Inserta los food_log_entries en la DB
 */
async function insertLogEntries(
  supabase: any,
  userId: string,
  mealType: string,
  alimentos: AlimentoDetectado[],
  loggingMethod: "photo" | "natural_text" | "manual" | "barcode",
  photoPath: string | null,
  aiRawResponse: any,
  confianzaGeneral: number,
  descripcion: string
): Promise<string[]> {
  const entries = alimentos.map((a) => ({
    user_id: userId,
    log_date: new Date().toISOString().split("T")[0],
    meal_type: mealType,
    food_id: a.db_food_id,
    custom_description: a.db_food_id ? null : `${descripcion} — ${a.nombre}`,
    quantity_grams: a.cantidad_gramos,
    calories_kcal: a.calorias_estimadas,
    protein_g: a.proteina_g,
    carbs_g: a.carbohidratos_g,
    fat_g: a.grasa_g,
    fiber_g: a.fibra_g,
    logging_method: loggingMethod,
    ai_confidence: a.confianza,
    photo_storage_path: photoPath,
    ai_raw_response: aiRawResponse,
  }));

  const { data, error } = await supabase
    .from("food_log_entries")
    .insert(entries)
    .select("id");

  if (error) throw new Error(`Error insertando log entries: ${error.message}`);
  return data.map((d: any) => d.id);
}

function hasPremiumAccess(profile: PremiumProfile | null): boolean {
  if (!profile?.is_premium) return false;
  if (
    profile.subscription_status === "past_due" ||
    profile.subscription_status === "canceled"
  ) {
    return false;
  }
  if (!profile.premium_expires_at) return true;
  return new Date(profile.premium_expires_at) > new Date();
}

async function enforcePhotoQuota(supabase: any, userId: string): Promise<void> {
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("is_premium, premium_expires_at, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo leer el estado premium del usuario ${userId}: ${profileError.message}`
    );
  }

  if (hasPremiumAccess(profile as PremiumProfile | null)) {
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: entries, error: entriesError } = await supabase
    .from("food_log_entries")
    .select("photo_storage_path")
    .eq("user_id", userId)
    .eq("log_date", today)
    .eq("logging_method", "photo")
    .is("deleted_at", null);

  if (entriesError) {
    throw new Error(
      `No se pudo comprobar la cuota diaria de fotos: ${entriesError.message}`
    );
  }

  const uniquePhotoLogs = new Set(
    (entries ?? [])
      .map((entry: { photo_storage_path: string | null }) => entry.photo_storage_path)
      .filter((path: string | null): path is string => Boolean(path))
  );

  if (uniquePhotoLogs.size >= MAX_FREE_PHOTO_LOGS_PER_DAY) {
    const quotaError = new Error(
      "Has alcanzado el límite diario de fotos del plan gratuito. Actualiza a Premium para seguir usando análisis por foto."
    ) as Error & { status?: number };
    quotaError.status = 403;
    throw quotaError;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function round(n: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function detectMediaType(
  base64: string
): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg"; // default
}

function getCountryContext(code: string): string {
  const contexts: Record<string, string> = {
    ES: "España — cocina mediterránea, tortilla = tortilla de patatas, menú del día habitual",
    MX: "México — cocina mexicana, tortilla = tortilla de maíz/harina, tacos/quesadillas",
    AR: "Argentina — asado, empanadas, medialunas, mate, porciones generosas",
    CO: "Colombia — bandeja paisa, arepas, sancocho",
    CL: "Chile — cazuela, empanadas, completos, sopaipillas",
    PE: "Perú — ceviche, lomo saltado, arroz con pollo",
    VE: "Venezuela — arepas, pabellón criollo, cachapas",
    EC: "Ecuador — encebollado, bolón de verde, seco de pollo",
    UY: "Uruguay — chivito, asado, torta frita",
    BO: "Bolivia — salteñas, pique macho, silpancho",
  };
  return contexts[code] || "Hispanoamérica — interpretar según contexto general";
}

function getMealContext(mealType: string): string {
  const meals: Record<string, string> = {
    breakfast: "Desayuno — porciones típicas de mañana",
    lunch: "Almuerzo/Comida — comida principal del día en muchos países hispanos",
    dinner: "Cena — generalmente más ligera que el almuerzo",
    snack: "Snack/Merienda — porción pequeña entre comidas",
  };
  return meals[mealType] || "Comida";
}

function loggingMethodForDb(
  method: "photo" | "text" | "barcode"
): "photo" | "natural_text" | "manual" | "barcode" {
  if (method === "text") return "natural_text";
  return method;
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, apikey, x-client-info",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const startTime = Date.now();

  try {
    // ---------------------------------------------------------------
    // 1. Parse y validar request
    // ---------------------------------------------------------------
    const body: AiLogRequest = await req.json();
    const { method, payload, user_id, meal_type, country_code } = body;

    if (!method || !payload || !user_id || !meal_type) {
      return jsonResponse(
        { error: "Campos requeridos: method, payload, user_id, meal_type" },
        400
      );
    }

    // Cliente Supabase con service_role para bypass RLS en escritura
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (method === "photo") {
      await enforcePhotoQuota(supabase, user_id);
    }

    // ---------------------------------------------------------------
    // 2. CASO BARCODE — lookup directo sin IA
    // ---------------------------------------------------------------
    if (method === "barcode") {
      const product = await lookupBarcode(supabase, payload);

      if (!product) {
        return jsonResponse(
          {
            success: false,
            error: "Producto no encontrado",
            barcode: payload,
          },
          404
        );
      }

      // Usar porción default o 100g
      const defaultServing = product.food_servings?.find(
        (s: any) => s.is_default
      );
      const grams = defaultServing?.serving_grams || 100;
      const factor = grams / 100;

      const alimento: AlimentoDetectado = {
        nombre: product.brand
          ? `${product.name} (${product.brand})`
          : product.name,
        cantidad_gramos: grams,
        calorias_estimadas: round(product.calories_kcal * factor),
        proteina_g: round(product.protein_g * factor),
        carbohidratos_g: round(product.carbs_g * factor),
        grasa_g: round(product.fat_g * factor),
        fibra_g: round((product.fiber_g || 0) * factor),
        confianza: 0.95,
        metodo_estimacion: "db_match",
        db_food_id: product.id,
        db_serving_id: defaultServing?.id || null,
        notas: product.is_verified ? "Producto verificado" : null,
      };

      const totals = recalcTotals([alimento]);

      const entryIds = await insertLogEntries(
        supabase,
        user_id,
        meal_type,
        [alimento],
        "barcode",
        null,
        { barcode: payload, product_id: product.id },
        0.95,
        alimento.nombre
      );

      return jsonResponse({
        success: true,
        plato_descripcion: alimento.nombre,
        origen_cultural: null,
        confianza_general: 0.95,
        alimentos: [alimento],
        totales: totals,
        log_entry_ids: entryIds,
        processing_ms: Date.now() - startTime,
      } satisfies AiLogResponse);
    }

    // ---------------------------------------------------------------
    // 3. CASO FOTO o TEXTO — pipeline con Claude
    // ---------------------------------------------------------------

    // 3a. Llamar a Claude
    const claudeResponse = await callClaude(
      method === "photo" ? "photo" : "text",
      payload,
      country_code || "ES",
      meal_type
    );

    // 3b. Enriquecer con matches de la DB
    const enrichedAlimentos = await enrichWithDbMatches(
      supabase,
      claudeResponse.alimentos,
      country_code || "ES"
    );

    // 3c. Recalcular totales (pueden diferir de lo que dijo Claude si la DB corrigió valores)
    const totals = recalcTotals(enrichedAlimentos);

    // 3d. Calcular confianza general ponderada por calorías
    const totalCal = totals.calorias || 1;
    const confianzaGeneral = round(
      enrichedAlimentos.reduce(
        (sum, a) => sum + a.confianza * (a.calorias_estimadas / totalCal),
        0
      ),
      2
    );

    // 3e. Insertar log entries
    const entryIds = await insertLogEntries(
      supabase,
      user_id,
      meal_type,
      enrichedAlimentos,
      loggingMethodForDb(method),
      body.photo_storage_path || null,
      claudeResponse, // guardar respuesta raw completa para auditoría
      confianzaGeneral,
      claudeResponse.plato_descripcion
    );

    // 3f. Responder
    return jsonResponse({
      success: true,
      plato_descripcion: claudeResponse.plato_descripcion,
      origen_cultural: claudeResponse.origen_cultural,
      confianza_general: confianzaGeneral,
      alimentos: enrichedAlimentos,
      totales: totals,
      ambiguedades: claudeResponse.ambiguedades,
      log_entry_ids: entryIds,
      processing_ms: Date.now() - startTime,
    } satisfies AiLogResponse);
  } catch (err: any) {
    console.error("ai-log error:", err);
    return jsonResponse(
      {
        success: false,
        error: err.message || "Error interno del pipeline",
        processing_ms: Date.now() - startTime,
      },
      typeof err.status === "number" ? err.status : 500
    );
  }
});

// =============================================================================
// RESPONSE HELPER
// =============================================================================

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
