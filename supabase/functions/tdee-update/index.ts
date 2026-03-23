// =============================================================================
// NUTRIA — Edge Function: /tdee-update
// Cron semanal (lunes) o recálculo manual por usuario
// Idempotente: si ya existe snapshot para la semana, no recalcula
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import {
  calculateWeeklyAdjustment,
  calculateInitialTdee,
  getCalorieGoal,
  calculateAge,
  calculateBmr,
  clampTdee,
  type UserProfile,
  type TdeeState,
  type WeeklyData,
  type BiologicalSex,
} from "./algorithm.ts";

// =============================================================================
// CONFIG
// =============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// =============================================================================
// HELPERS DE FECHA
// =============================================================================

/** Devuelve el lunes anterior (o hoy si es lunes) en formato YYYY-MM-DD */
function getLastMonday(fromDate?: Date): string {
  const d = fromDate ? new Date(fromDate) : new Date();
  const day = d.getDay(); // 0=dom, 1=lun, ..., 6=sáb
  const diff = day === 0 ? 6 : day - 1; // distancia al lunes anterior
  d.setDate(d.getDate() - diff - 7); // lunes de la SEMANA PASADA
  return d.toISOString().split("T")[0];
}

/** Devuelve el domingo correspondiente a un lunes dado */
function getSunday(monday: string): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

// =============================================================================
// HANDLER
// =============================================================================

serve(async (req: Request) => {
  // CORS
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
    // Determinar si es cron (todos los usuarios) o recálculo individual
    let body: { user_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body vacío = modo cron, procesar todos
    }

    const weekStart = getLastMonday();
    const weekEnd = getSunday(weekStart);

    if (body.user_id) {
      // ---- Modo individual ----
      const result = await processUser(supabase, body.user_id, weekStart, weekEnd);
      return jsonResponse({ success: true, result });
    } else {
      // ---- Modo cron: todos los usuarios con TDEE activo ----
      const results = await processAllUsers(supabase, weekStart, weekEnd);
      return jsonResponse({
        success: true,
        week: `${weekStart} → ${weekEnd}`,
        processed: results.length,
        adjusted: results.filter((r) => r.was_adjusted).length,
        skipped: results.filter((r) => !r.was_adjusted).length,
      });
    }
  } catch (err: any) {
    console.error("tdee-update error:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
});

// =============================================================================
// PROCESAMIENTO
// =============================================================================

async function processAllUsers(
  supabase: any,
  weekStart: string,
  weekEnd: string
): Promise<Array<{ user_id: string; was_adjusted: boolean; reason: string }>> {
  // Obtener todos los usuarios que tienen tdee_state (ya pasaron onboarding)
  const { data: users, error } = await supabase
    .from("user_tdee_state")
    .select("user_id");

  if (error) throw new Error(`Error obteniendo usuarios: ${error.message}`);
  if (!users || users.length === 0) return [];

  // Procesar en paralelo con un límite de concurrencia razonable
  const BATCH_SIZE = 20;
  const results: Array<{ user_id: string; was_adjusted: boolean; reason: string }> = [];

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (u: any) => {
        try {
          const r = await processUser(supabase, u.user_id, weekStart, weekEnd);
          return { user_id: u.user_id, was_adjusted: r.was_adjusted, reason: r.reason };
        } catch (err: any) {
          console.error(`Error procesando usuario ${u.user_id}:`, err);
          return { user_id: u.user_id, was_adjusted: false, reason: `error: ${err.message}` };
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}

async function processUser(
  supabase: any,
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<{ was_adjusted: boolean; reason: string; new_tdee?: number }> {
  // ---------------------------------------------------------------
  // 1. Idempotencia: verificar si ya existe snapshot para esta semana
  // ---------------------------------------------------------------
  const { data: existingSnapshot } = await supabase
    .from("tdee_weekly_snapshots")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .limit(1)
    .maybeSingle();

  if (existingSnapshot) {
    return {
      was_adjusted: false,
      reason: "already_processed: ya existe snapshot para esta semana",
    };
  }

  // ---------------------------------------------------------------
  // 2. Obtener estado actual del TDEE
  // ---------------------------------------------------------------
  const { data: tdeeState, error: tdeeError } = await supabase
    .from("user_tdee_state")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (tdeeError || !tdeeState) {
    return { was_adjusted: false, reason: "no_tdee_state: usuario sin TDEE inicializado" };
  }

  // ---------------------------------------------------------------
  // 3. Obtener perfil del usuario (necesitamos el sexo para límites)
  // ---------------------------------------------------------------
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("biological_sex, date_of_birth, height_cm, activity_level, goal")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { was_adjusted: false, reason: "no_profile: perfil no encontrado" };
  }

  // ---------------------------------------------------------------
  // 4. Obtener datos semanales (función de Postgres)
  // ---------------------------------------------------------------
  const { data: weeklyRaw, error: weeklyError } = await supabase.rpc(
    "get_tdee_weekly_data",
    {
      p_user_id: userId,
      p_week_start: weekStart,
      p_week_end: weekEnd,
    }
  );

  if (weeklyError) {
    return { was_adjusted: false, reason: `db_error: ${weeklyError.message}` };
  }

  // get_tdee_weekly_data devuelve una fila
  const weeklyRow = Array.isArray(weeklyRaw) ? weeklyRaw[0] : weeklyRaw;
  if (!weeklyRow) {
    return { was_adjusted: false, reason: "no_weekly_data: sin datos esta semana" };
  }

  const weeklyData: WeeklyData = {
    complete_days: Number(weeklyRow.complete_days) || 0,
    avg_calories_day: Number(weeklyRow.avg_calories_day) || 0,
    avg_weight_kg: Number(weeklyRow.avg_weight_kg) || 0,
    weight_start: weeklyRow.weight_start ? Number(weeklyRow.weight_start) : null,
    weight_end: weeklyRow.weight_end ? Number(weeklyRow.weight_end) : null,
  };

  const currentState: TdeeState = {
    current_tdee_kcal: Number(tdeeState.current_tdee_kcal),
    current_bmr_kcal: Number(tdeeState.current_bmr_kcal),
    initial_tdee_kcal: Number(tdeeState.initial_tdee_kcal),
    confidence_level: Number(tdeeState.confidence_level),
    weeks_of_data: Number(tdeeState.weeks_of_data),
    last_adjusted_at: tdeeState.last_adjusted_at,
  };

  // ---------------------------------------------------------------
  // 5. Ejecutar el algoritmo
  // ---------------------------------------------------------------
  const result = calculateWeeklyAdjustment(
    currentState,
    weeklyData,
    profile.biological_sex as BiologicalSex,
    weekStart,
    weekEnd
  );

  // ---------------------------------------------------------------
  // 6. Guardar snapshot (SIEMPRE, incluso si no se ajustó)
  // ---------------------------------------------------------------
  const { error: snapshotError } = await supabase
    .from("tdee_weekly_snapshots")
    .insert({
      user_id: userId,
      ...result.snapshot,
    });

  if (snapshotError) {
    console.error(`Error guardando snapshot para ${userId}:`, snapshotError);
  }

  // ---------------------------------------------------------------
  // 7. Actualizar user_tdee_state (solo si hubo ajuste real)
  // ---------------------------------------------------------------
  if (result.was_adjusted) {
    const { error: updateError } = await supabase
      .from("user_tdee_state")
      .update({
        current_tdee_kcal: result.new_tdee,
        confidence_level: result.new_confidence,
        weeks_of_data: currentState.weeks_of_data + 1,
        last_adjusted_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(`Error actualizando TDEE state para ${userId}:`, updateError);
    }
  } else if (result.new_confidence !== currentState.confidence_level) {
    // Actualizar solo la confianza (penalización por datos insuficientes)
    await supabase
      .from("user_tdee_state")
      .update({ confidence_level: result.new_confidence })
      .eq("user_id", userId);
  }

  return {
    was_adjusted: result.was_adjusted,
    reason: result.reason,
    new_tdee: result.was_adjusted ? result.new_tdee : undefined,
  };
}

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
