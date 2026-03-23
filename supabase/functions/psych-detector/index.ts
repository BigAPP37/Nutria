// supabase/functions/psych-detector/index.ts
// Detecta patrones potencialmente restrictivos en el logging de comidas.
// Se ejecuta como cron diario o manualmente con un user_id.
// Idempotente: no duplica flags si se llama dos veces el mismo día.
// Falla silenciosamente: si algo sale mal, el usuario no ve nada.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Umbrales de detección
const LOW_CAL_THRESHOLD = 800;    // kcal mínimas razonables
const LOW_CAL_DAYS = 3;           // días consecutivos para trigger
const ZERO_LOG_DAYS = 4;          // días sin log para trigger
const MIN_HISTORY_DAYS = 5;       // mínimo de días logueados en 3 semanas
const MIN_APP_AGE_DAYS = 7;       // no detectar en usuarios nuevos
const FLAG_COOLDOWN_DAYS = 7;     // no repetir mismo flag en 7 días
const LOOKBACK_DAYS = 14;         // ventana de análisis

// Palabras clave restrictivas (español)
const RESTRICTIVE_KEYWORDS = [
  "ayuno", "no he comido", "sin comer", "saltarme",
  "purga", "vomit", "laxante", "no puedo comer",
  "demasiado he comido",
];

// Mensajes por tipo de flag
const MESSAGES: Record<string, { key: string; content: string }> = {
  consecutive_low_logging: {
    key: "low_intake_support",
    content:
      "Hemos notado que algunos días has registrado muy poco. " +
      "Nutria es una herramienta de apoyo, no de restricción. " +
      "Recuerda que comer bien es parte del objetivo. 💛",
  },
  consecutive_zero_logging: {
    key: "missing_logs_checkin",
    content:
      "Llevamos unos días sin saber de ti. No pasa nada — " +
      "a veces la vida se pone intensa. ¿Cómo estás? 🤍",
  },
  restrictive_language: {
    key: "restrictive_language_support",
    content:
      "Parece que estás teniendo un momento difícil con la comida. " +
      "Está bien pedir ayuda. Nutria puede ser más útil si " +
      "la usas a tu ritmo, sin presión. 💛",
  },
};

// =============================================================================
// TIPOS
// =============================================================================

interface DetectionResult {
  user_id: string;
  flags_created: string[];
  skipped: string[];
}

// =============================================================================
// HANDLER
// =============================================================================

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    let body: { user_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Sin body = modo cron
    }

    if (body.user_id) {
      // Modo individual
      const result = await processUser(supabase, body.user_id);
      return jsonResponse({ success: true, results: [result] });
    }

    // Modo cron: usuarios activos en los últimos 30 días
    const thirtyDaysAgo = daysAgo(30);
    const { data: activeUsers, error } = await supabase
      .from("daily_log_status")
      .select("user_id")
      .gte("log_date", thirtyDaysAgo)
      .limit(10000);

    if (error) throw error;

    // Deduplicar user_ids
    const uniqueIds = [...new Set((activeUsers ?? []).map((u: any) => u.user_id))];

    // Procesar en batches
    const BATCH = 20;
    const results: DetectionResult[] = [];

    for (let i = 0; i < uniqueIds.length; i += BATCH) {
      const batch = uniqueIds.slice(i, i + BATCH);
      const batchResults = await Promise.all(
        batch.map((uid) =>
          processUser(supabase, uid).catch((err) => ({
            user_id: uid,
            flags_created: [],
            skipped: [`error: ${err.message}`],
          }))
        )
      );
      results.push(...batchResults);
    }

    return jsonResponse({
      success: true,
      processed: uniqueIds.length,
      flags_created: results.reduce((s, r) => s + r.flags_created.length, 0),
      skipped: results.reduce((s, r) => s + r.skipped.length, 0),
    });
  } catch (err: any) {
    console.error("psych-detector error:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
});

// =============================================================================
// PROCESAMIENTO POR USUARIO
// =============================================================================

async function processUser(
  supabase: any,
  userId: string
): Promise<DetectionResult> {
  const result: DetectionResult = {
    user_id: userId,
    flags_created: [],
    skipped: [],
  };

  // Verificar antigüedad del usuario (no detectar en nuevos)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("created_at")
    .eq("id", userId)
    .single();

  if (!profile) {
    result.skipped.push("no_profile");
    return result;
  }

  const appAgeDays = daysBetween(profile.created_at, new Date().toISOString());
  if (appAgeDays < MIN_APP_AGE_DAYS) {
    result.skipped.push("user_too_new");
    return result;
  }

  // Obtener datos de los últimos 14 días
  const startDate = daysAgo(LOOKBACK_DAYS);
  const today = new Date().toISOString().split("T")[0];

  const [dailyStatusRes, recentEntriesRes, recentTextsRes] = await Promise.all([
    // daily_log_status de los últimos 14 días
    supabase
      .from("daily_log_status")
      .select("log_date, is_day_complete, total_calories")
      .eq("user_id", userId)
      .gte("log_date", startDate)
      .order("log_date", { ascending: false }),

    // food_log_entries (para contar días con actividad)
    supabase
      .from("food_log_entries")
      .select("log_date")
      .eq("user_id", userId)
      .gte("log_date", startDate)
      .is("deleted_at", null),

    // Textos libres recientes (para detección de lenguaje)
    supabase
      .from("food_log_entries")
      .select("custom_description, log_date")
      .eq("user_id", userId)
      .gte("log_date", daysAgo(3))
      .is("deleted_at", null)
      .not("custom_description", "is", null),
  ]);

  const dailyStatus = dailyStatusRes.data ?? [];
  const recentEntries = recentEntriesRes.data ?? [];
  const recentTexts = recentTextsRes.data ?? [];

  // ─── Detector 1: consecutive_low_logging ──────────────────

  const lowCalResult = detectConsecutiveLowLogging(dailyStatus);
  if (lowCalResult.detected) {
    const created = await createFlagIfAllowed(supabase, userId, {
      flag_type: "consecutive_low_logging",
      consecutive_days: lowCalResult.days,
      details: { avg_calories: lowCalResult.avgCalories },
    });
    if (created) result.flags_created.push("consecutive_low_logging");
    else result.skipped.push("consecutive_low_logging:cooldown");
  }

  // ─── Detector 2: consecutive_zero_logging ─────────────────

  const zeroResult = detectConsecutiveZeroLogging(recentEntries, startDate);
  if (zeroResult.detected) {
    // Verificar que el usuario SÍ logueaba regularmente antes
    const threeWeeksAgo = daysAgo(21);
    const { count } = await supabase
      .from("food_log_entries")
      .select("log_date", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("log_date", threeWeeksAgo)
      .is("deleted_at", null);

    // Contar días únicos con log
    const { data: uniqueDays } = await supabase
      .rpc("count_unique_log_days", { p_user_id: userId, p_since: threeWeeksAgo })
      .single();

    // Fallback: contar con los datos que ya tenemos
    const uniqueLogDates = new Set(recentEntries.map((e: any) => e.log_date));
    const logDaysCount = uniqueDays?.count ?? uniqueLogDates.size;

    if (logDaysCount >= MIN_HISTORY_DAYS) {
      const created = await createFlagIfAllowed(supabase, userId, {
        flag_type: "consecutive_zero_logging",
        consecutive_days: zeroResult.days,
        details: { last_log_date: zeroResult.lastLogDate },
      });
      if (created) result.flags_created.push("consecutive_zero_logging");
      else result.skipped.push("consecutive_zero_logging:cooldown");
    } else {
      result.skipped.push("consecutive_zero_logging:insufficient_history");
    }
  }

  // ─── Detector 3: restrictive_language ─────────────────────

  const langResult = detectRestrictiveLanguage(recentTexts);
  if (langResult.detected) {
    const created = await createFlagIfAllowed(supabase, userId, {
      flag_type: "restrictive_language",
      consecutive_days: null,
      details: {
        matched_keywords: langResult.matchedKeywords,
        match_count: langResult.matchCount,
      },
      trigger_text: langResult.triggerText,
    });
    if (created) result.flags_created.push("restrictive_language");
    else result.skipped.push("restrictive_language:cooldown");
  }

  return result;
}

// =============================================================================
// DETECTORES
// =============================================================================

function detectConsecutiveLowLogging(
  dailyStatus: Array<{ log_date: string; is_day_complete: boolean; total_calories: number }>
): { detected: boolean; days: number; avgCalories: number } {
  // Contar días consecutivos recientes con calories < 800 y día completo
  // Ordenados por fecha DESC (más reciente primero)
  let consecutive = 0;
  let totalCal = 0;

  for (const day of dailyStatus) {
    if (day.is_day_complete && day.total_calories < LOW_CAL_THRESHOLD) {
      consecutive++;
      totalCal += day.total_calories;
    } else {
      break; // la racha se rompe
    }
  }

  return {
    detected: consecutive >= LOW_CAL_DAYS,
    days: consecutive,
    avgCalories: consecutive > 0 ? Math.round(totalCal / consecutive) : 0,
  };
}

function detectConsecutiveZeroLogging(
  entries: Array<{ log_date: string }>,
  startDate: string
): { detected: boolean; days: number; lastLogDate: string | null } {
  // Construir set de fechas con log
  const logDates = new Set(entries.map((e) => e.log_date));

  // Contar días sin log desde hoy hacia atrás
  let consecutive = 0;
  let lastLogDate: string | null = null;
  const today = new Date();

  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    if (logDates.has(dateStr)) {
      lastLogDate = dateStr;
      break;
    }
    consecutive++;
  }

  return {
    detected: consecutive >= ZERO_LOG_DAYS,
    days: consecutive,
    lastLogDate,
  };
}

function detectRestrictiveLanguage(
  texts: Array<{ custom_description: string; log_date: string }>
): {
  detected: boolean;
  matchedKeywords: string[];
  matchCount: number;
  triggerText: string | null;
} {
  const matchedKeywords = new Set<string>();
  let triggerText: string | null = null;

  for (const entry of texts) {
    const lower = entry.custom_description.toLowerCase();
    for (const keyword of RESTRICTIVE_KEYWORDS) {
      if (lower.includes(keyword)) {
        matchedKeywords.add(keyword);
        if (!triggerText) triggerText = entry.custom_description;
      }
    }
  }

  return {
    detected: matchedKeywords.size >= 2, // mínimo 2 keywords distintas
    matchedKeywords: [...matchedKeywords],
    matchCount: matchedKeywords.size,
    triggerText,
  };
}

// =============================================================================
// CREAR FLAG (con verificación de cooldown e idempotencia)
// =============================================================================

async function createFlagIfAllowed(
  supabase: any,
  userId: string,
  flagData: {
    flag_type: string;
    consecutive_days: number | null;
    details: Record<string, any>;
    trigger_text?: string | null;
  }
): Promise<boolean> {
  const message = MESSAGES[flagData.flag_type];
  if (!message) return false;

  // 1. Verificar cooldown (no repetir en 7 días)
  const { data: canShow } = await supabase.rpc("can_show_psych_message", {
    p_user_id: userId,
    p_message_key: message.key,
    p_cooldown_days: FLAG_COOLDOWN_DAYS,
  });

  if (!canShow) return false;

  // 2. Verificar que no existe un flag idéntico hoy (idempotencia)
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("psychological_flags")
    .select("id")
    .eq("user_id", userId)
    .eq("flag_type", flagData.flag_type)
    .gte("detected_at", `${today}T00:00:00Z`)
    .limit(1);

  if (existing && existing.length > 0) return false;

  // 3. Insertar flag
  const { error: flagError } = await supabase
    .from("psychological_flags")
    .insert({
      user_id: userId,
      flag_type: flagData.flag_type,
      consecutive_days: flagData.consecutive_days,
      details: flagData.details,
      trigger_text: flagData.trigger_text ?? null,
    });

  if (flagError) {
    console.error(`Error creando flag para ${userId}:`, flagError);
    return false;
  }

  return true;
}

// =============================================================================
// HELPERS
// =============================================================================

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
