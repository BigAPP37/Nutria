// Edge Function: psych-detector
// Detecta patrones psicológicos en el historial de registros del usuario
// Puede ejecutarse como cron (sin body) o por usuario específico (body: { user_id })

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Palabras clave que indican lenguaje restrictivo en las descripciones de comida
const RESTRICTIVE_KEYWORDS = [
  'ayuno',
  'no he comido',
  'sin comer',
  'saltarme',
  'purga',
  'vomit',
  'laxante',
  'no puedo comer',
  'demasiado he comido',
  'me siento gorda',
  'me siento gordo',
  'asco',
]

type FlagType = 'consecutive_low_logging' | 'consecutive_zero_logging' | 'restrictive_language'

interface DailyLogStatus {
  log_date: string
  is_day_complete: boolean
  total_calories: number
}

interface FoodLogEntry {
  log_date: string
  custom_description: string | null
}

interface DetectedFlag {
  flag_type: FlagType
  consecutive_days: number | null
  trigger_text: string | null
  details: Record<string, unknown>
}

// Calcula fechas ISO de los últimos N días (sin incluir hoy opcionalmente)
function getLastNDaysISO(n: number): string[] {
  const dates: string[] = []
  for (let i = 1; i <= n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function getNDaysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// Cuenta días consecutivos desde el más reciente hacia atrás dado un set de fechas que cumplen condición
function countConsecutiveDaysFromRecent(dates: string[], matchingDates: Set<string>): number {
  let count = 0
  for (const date of dates) {
    if (matchingDates.has(date)) {
      count++
    } else {
      break
    }
  }
  return count
}

async function detectFlagsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ flagsCreated: number; skipped: number }> {
  let flagsCreated = 0
  let skipped = 0

  const last14Days = getLastNDaysISO(14)
  const last3Days = getLastNDaysISO(3)
  const last21Days = getLastNDaysISO(21)
  const cutoff14 = getNDaysAgoISO(14)
  const cutoff3 = getNDaysAgoISO(3)
  const cutoff21 = getNDaysAgoISO(21)

  // Obtener registros de estado diario de los últimos 14 días
  const { data: dailyStatuses, error: statusError } = await supabase
    .from('daily_log_status')
    .select('log_date, is_day_complete, total_calories')
    .eq('user_id', userId)
    .gte('log_date', cutoff14)
    .returns<DailyLogStatus[]>()

  if (statusError) {
    console.error(`Error fetching daily_log_status for ${userId}:`, statusError.message)
    return { flagsCreated: 0, skipped: 0 }
  }

  // Obtener entradas de comida de los últimos 14 días
  const { data: foodEntries, error: entriesError } = await supabase
    .from('food_log_entries')
    .select('log_date, custom_description')
    .eq('user_id', userId)
    .gte('log_date', cutoff14)
    .is('deleted_at', null)
    .returns<FoodLogEntry[]>()

  if (entriesError) {
    console.error(`Error fetching food_log_entries for ${userId}:`, entriesError.message)
    return { flagsCreated: 0, skipped: 0 }
  }

  // Obtener entradas de los últimos 21 días para verificar actividad mínima
  const { data: foodEntries21, error: entries21Error } = await supabase
    .from('food_log_entries')
    .select('log_date')
    .eq('user_id', userId)
    .gte('log_date', cutoff21)
    .is('deleted_at', null)
    .returns<Pick<FoodLogEntry, 'log_date'>[]>()

  if (entries21Error) {
    console.error(`Error fetching 21-day food_log_entries for ${userId}:`, entries21Error.message)
    return { flagsCreated: 0, skipped: 0 }
  }

  // Flags activos en los últimos 7 días — para evitar duplicados
  const cutoff7 = getNDaysAgoISO(7)
  const { data: recentFlags } = await supabase
    .from('psychological_flags')
    .select('flag_type')
    .eq('user_id', userId)
    .gte('detected_at', cutoff7)

  const recentFlagTypes = new Set((recentFlags || []).map((f: { flag_type: string }) => f.flag_type))

  // Construir sets para evaluación eficiente
  const dailyStatusMap = new Map<string, DailyLogStatus>(
    (dailyStatuses || []).map((s) => [s.log_date, s])
  )

  const datesWithAnyEntry = new Set<string>(
    (foodEntries || []).map((e) => e.log_date)
  )

  const datesWithAnyEntry21 = new Set<string>(
    (foodEntries21 || []).map((e) => e.log_date)
  )

  const detectedFlags: DetectedFlag[] = []

  // ── FLAG 1: consecutive_low_logging ─────────────────────────────────────
  // Días con is_day_complete=true Y total_calories < 800, consecutivos desde más reciente
  const lowLoggingDates = new Set<string>()
  for (const [date, status] of dailyStatusMap) {
    if (status.is_day_complete && status.total_calories < 800) {
      lowLoggingDates.add(date)
    }
  }

  const consecutiveLow = countConsecutiveDaysFromRecent(last14Days, lowLoggingDates)
  if (consecutiveLow >= 3) {
    detectedFlags.push({
      flag_type: 'consecutive_low_logging',
      consecutive_days: consecutiveLow,
      trigger_text: null,
      details: {
        consecutive_days: consecutiveLow,
        threshold_calories: 800,
      },
    })
  }

  // ── FLAG 2: consecutive_zero_logging ─────────────────────────────────────
  // Días SIN ninguna entrada en food_log_entries, consecutivos desde más reciente
  // Solo activa si el usuario lleva >= 7 días usando la app Y tuvo >= 5 días con registros en las últimas 3 semanas

  // Obtener primer registro del usuario para calcular antigüedad
  const { data: firstEntry } = await supabase
    .from('food_log_entries')
    .select('log_date')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('log_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  const userAgeInDays = firstEntry
    ? Math.floor(
        (Date.now() - new Date(firstEntry.log_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  const daysWithLogsIn21Days = datesWithAnyEntry21.size

  // Días sin entradas: días en los últimos 14 donde no hay ninguna entrada
  const zeroDates = new Set<string>()
  for (const date of last14Days) {
    if (!datesWithAnyEntry.has(date)) {
      zeroDates.add(date)
    }
  }

  const consecutiveZero = countConsecutiveDaysFromRecent(last14Days, zeroDates)

  if (
    consecutiveZero >= 4 &&
    userAgeInDays >= 7 &&
    daysWithLogsIn21Days >= 5
  ) {
    detectedFlags.push({
      flag_type: 'consecutive_zero_logging',
      consecutive_days: consecutiveZero,
      trigger_text: null,
      details: {
        consecutive_days: consecutiveZero,
        user_age_days: userAgeInDays,
        days_with_logs_last_21: daysWithLogsIn21Days,
      },
    })
  }

  // ── FLAG 3: restrictive_language ─────────────────────────────────────────
  // Palabras clave detectadas en custom_description de los últimos 3 días
  const recentEntries = (foodEntries || []).filter((e) =>
    last3Days.includes(e.log_date) && e.custom_description
  )

  const matches: string[] = []
  for (const entry of recentEntries) {
    const desc = (entry.custom_description || '').toLowerCase()
    for (const keyword of RESTRICTIVE_KEYWORDS) {
      if (desc.includes(keyword.toLowerCase())) {
        matches.push(keyword)
      }
    }
  }

  if (matches.length >= 2) {
    detectedFlags.push({
      flag_type: 'restrictive_language',
      consecutive_days: null,
      trigger_text: matches.slice(0, 3).join(', '),
      details: {
        matched_keywords: matches,
        match_count: matches.length,
      },
    })
  }

  // ── INSERTAR FLAGS DETECTADOS ─────────────────────────────────────────────
  for (const flag of detectedFlags) {
    // Verificar que no existe el mismo flag_type en los últimos 7 días
    if (recentFlagTypes.has(flag.flag_type)) {
      skipped++
      continue
    }

    // Verificar cooldown via función SQL
    const messageKeyMap: Record<FlagType, string> = {
      consecutive_low_logging: 'low_intake_support',
      consecutive_zero_logging: 'missing_logs_checkin',
      restrictive_language: 'restrictive_language_support',
    }

    const messageKey = messageKeyMap[flag.flag_type]

    const { data: canShow, error: cooldownError } = await supabase
      .rpc('can_show_psych_message', {
        user_id: userId,
        message_key: messageKey,
        cooldown_days: 7,
      })

    if (cooldownError) {
      console.error(`Error checking cooldown for ${userId}:`, cooldownError.message)
      skipped++
      continue
    }

    if (!canShow) {
      skipped++
      continue
    }

    // Insertar el flag
    const { error: insertError } = await supabase
      .from('psychological_flags')
      .insert({
        user_id: userId,
        flag_type: flag.flag_type,
        detected_at: new Date().toISOString(),
        details: flag.details,
        consecutive_days: flag.consecutive_days,
        trigger_text: flag.trigger_text,
      })

    if (insertError) {
      console.error(`Error inserting flag for ${userId}:`, insertError.message)
      skipped++
    } else {
      flagsCreated++
    }
  }

  return { flagsCreated, skipped }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  // Crear cliente con service role para acceso completo
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Verificar autenticación: JWT de usuario O service role (cron)
  const authHeader = req.headers.get('Authorization')
  let requestUserId: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')

    // Intentar verificar como JWT de usuario
    const { data: userData } = await supabase.auth.getUser(token)
    if (userData?.user) {
      requestUserId = userData.user.id
    }
    // Si el token es el service role key, requestUserId queda null → modo cron
  }

  // Parsear body para obtener user_id específico
  let bodyUserId: string | null = null
  try {
    const body = await req.json()
    bodyUserId = body?.user_id || null
  } catch {
    // Body vacío o inválido — modo cron
  }

  // Determinar modo de operación
  const targetUserId = requestUserId || bodyUserId

  let processed = 0
  let totalFlagsCreated = 0
  let totalSkipped = 0

  if (targetUserId) {
    // Modo usuario específico
    const { flagsCreated, skipped } = await detectFlagsForUser(supabase, targetUserId)
    processed = 1
    totalFlagsCreated = flagsCreated
    totalSkipped = skipped
  } else {
    // Modo cron: procesar todos los usuarios activos en los últimos 30 días
    const cutoff30 = getNDaysAgoISO(30)

    const { data: activeUsers, error: usersError } = await supabase
      .from('food_log_entries')
      .select('user_id')
      .gte('log_date', cutoff30)
      .is('deleted_at', null)

    if (usersError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch active users', details: usersError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      )
    }

    // Deduplicar user_ids
    const uniqueUserIds = [...new Set((activeUsers || []).map((r: { user_id: string }) => r.user_id))]

    for (const userId of uniqueUserIds) {
      try {
        const { flagsCreated, skipped } = await detectFlagsForUser(supabase, userId)
        processed++
        totalFlagsCreated += flagsCreated
        totalSkipped += skipped
      } catch (err) {
        // Continuar con el siguiente usuario ante cualquier error
        console.error(`Unexpected error processing user ${userId}:`, err)
        totalSkipped++
      }
    }
  }

  return new Response(
    JSON.stringify({
      processed,
      flags_created: totalFlagsCreated,
      skipped: totalSkipped,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  )
})
