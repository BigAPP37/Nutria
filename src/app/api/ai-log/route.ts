// Route Handler: /api/ai-log
// Analiza comida con IA (texto o foto) y guarda las entradas en food_log_entries
// Valida la sesión del usuario con Supabase y llama directamente a Anthropic.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limitAiLogRequests, type AiRateLimitResult } from '@/lib/aiRateLimit'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_FREE_PHOTO_LOGS_PER_DAY = 3
const MAX_TEXT_PAYLOAD_CHARS = 500
const MAX_PHOTO_PAYLOAD_BYTES = 2 * 1024 * 1024
const LOG_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack'])

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function applyRateLimitHeaders(response: NextResponse, rateLimit: AiRateLimitResult) {
  response.headers.set('X-RateLimit-Limit', String(rateLimit.limit))
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
  response.headers.set('X-RateLimit-Reset', String(rateLimit.reset))
  return response
}

function isIsoDateWithinWindow(logDate: string) {
  if (!LOG_DATE_REGEX.test(logDate)) return false

  const parsed = new Date(`${logDate}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false

  const today = new Date()
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const earliest = new Date(utcToday)
  earliest.setUTCDate(utcToday.getUTCDate() - 7)

  return parsed >= earliest && parsed <= utcToday
}

function estimateBase64Bytes(value: string) {
  const normalized = value.replace(/\s/g, '')
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0
  return Math.floor((normalized.length * 3) / 4) - padding
}

function validateRequestBody(body: {
  method: 'photo' | 'text'
  payload: string
  meal_type: string
  country_code?: string
  log_date: string
}) {
  if (body.method !== 'photo' && body.method !== 'text') {
    return 'method inválido'
  }

  if (!VALID_MEAL_TYPES.has(body.meal_type)) {
    return 'meal_type inválido'
  }

  if (!/^[A-Z]{2}$/.test(body.country_code ?? 'ES')) {
    return 'country_code inválido'
  }

  if (!isIsoDateWithinWindow(body.log_date)) {
    return 'log_date inválido'
  }

  if (body.method === 'text') {
    const trimmedPayload = body.payload.trim()
    if (!trimmedPayload || trimmedPayload.length > MAX_TEXT_PAYLOAD_CHARS) {
      return 'payload de texto inválido'
    }
  }

  if (body.method === 'photo') {
    if (estimateBase64Bytes(body.payload) > MAX_PHOTO_PAYLOAD_BYTES) {
      return 'La imagen es demasiado grande'
    }
  }

  return null
}

function isValidMacroValue(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 5000
}

function hasValidAnalysisShape(analysis: {
  confianza_general: number
  alimentos: Array<{
    cantidad_gramos: number
    calorias_estimadas: number
    proteina_g: number
    carbohidratos_g: number
    grasa_g: number
    fibra_g: number
    confianza: number
  }>
  totales: {
    calorias: number
    proteina_g: number
    carbohidratos_g: number
    grasa_g: number
    fibra_g: number
  }
}) {
  if (!Number.isFinite(analysis.confianza_general) || analysis.confianza_general < 0 || analysis.confianza_general > 1) {
    return false
  }

  if (!Array.isArray(analysis.alimentos) || analysis.alimentos.length === 0) {
    return false
  }

  const totals = analysis.totales
  if (
    !isValidMacroValue(totals.calorias) ||
    !isValidMacroValue(totals.proteina_g) ||
    !isValidMacroValue(totals.carbohidratos_g) ||
    !isValidMacroValue(totals.grasa_g) ||
    !isValidMacroValue(totals.fibra_g)
  ) {
    return false
  }

  return analysis.alimentos.every((item) =>
    Number.isFinite(item.cantidad_gramos) &&
    item.cantidad_gramos >= 0 &&
    item.cantidad_gramos <= 5000 &&
    isValidMacroValue(item.calorias_estimadas) &&
    isValidMacroValue(item.proteina_g) &&
    isValidMacroValue(item.carbohidratos_g) &&
    isValidMacroValue(item.grasa_g) &&
    isValidMacroValue(item.fibra_g) &&
    Number.isFinite(item.confianza) &&
    item.confianza >= 0 &&
    item.confianza <= 1
  )
}

function hasPremiumAccess(profile: {
  is_premium: boolean | null
  premium_expires_at: string | null
  subscription_status: string | null
} | null) {
  if (!profile?.is_premium) return false
  if (profile.subscription_status === 'past_due' || profile.subscription_status === 'canceled') {
    return false
  }
  if (!profile.premium_expires_at) return true
  return new Date(profile.premium_expires_at) > new Date()
}

async function enforcePhotoQuota(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  logDate: string
) {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_premium, premium_expires_at, subscription_status')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    throw new Error(`No se pudo leer el estado premium: ${profileError.message}`)
  }

  if (hasPremiumAccess(profile)) {
    return null
  }

  const { data: existingPhotoEntries, error: countError } = await supabase
    .from('food_log_entries')
    .select('photo_storage_path')
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .eq('logging_method', 'photo')
    .is('deleted_at', null)

  if (countError) {
    throw new Error(`No se pudo comprobar la cuota de fotos: ${countError.message}`)
  }

  const uniquePhotoLogs = new Set(
    (existingPhotoEntries ?? [])
      .map((entry) => entry.photo_storage_path)
      .filter((path): path is string => Boolean(path))
  )

  if (uniquePhotoLogs.size >= MAX_FREE_PHOTO_LOGS_PER_DAY) {
    return jsonError(
      'Has alcanzado el límite diario de fotos del plan gratuito. Actualiza a Premium para seguir usando análisis por foto.',
      403
    )
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verificar sesión ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonError('No autenticado', 401)
    }

    // ── 2. Parsear body ──────────────────────────────────────────────────────
    const body = await req.json()
    const {
      method,
      payload,
      meal_type,
      country_code = 'ES',
      photo_storage_path,
      log_date,
    } = body as {
      method: 'photo' | 'text'
      payload: string
      meal_type: string
      country_code?: string
      photo_storage_path?: string
      log_date: string
    }

    if (!method || !payload || !meal_type || !log_date) {
      return jsonError('Faltan parámetros: method, payload, meal_type, log_date', 400)
    }

    const validationError = validateRequestBody({
      method,
      payload,
      meal_type,
      country_code,
      log_date,
    })
    if (validationError) {
      return jsonError(validationError, 400)
    }

    const rateLimit = await limitAiLogRequests(user.id, method)
    if (!rateLimit.success) {
      return applyRateLimitHeaders(
        jsonError(
          method === 'photo'
            ? 'Has superado el límite temporal de análisis por foto. Intenta de nuevo en un minuto.'
            : 'Has superado el límite temporal de análisis por texto. Intenta de nuevo en un minuto.',
          429
        ),
        rateLimit
      )
    }

    if (method === 'photo') {
      const quotaError = await enforcePhotoQuota(supabase, user.id, log_date)
      if (quotaError) {
        return applyRateLimitHeaders(quotaError, rateLimit)
      }
    }

    // ── 3. Construir prompt ──────────────────────────────────────────────────
    const regionLabel = country_code === 'ES' ? 'España' : 'Latinoamérica'

    const systemPrompt = `Eres un nutricionista experto especializado en cocina de ${regionLabel}.
Analiza el alimento o comida y devuelve ÚNICAMENTE un JSON válido sin markdown con esta estructura exacta:
{
  "plato_descripcion": "descripción breve",
  "origen_cultural": "España" | "México" | "Internacional" | null,
  "confianza_general": 0.0-1.0,
  "alimentos": [
    {
      "nombre": "nombre del alimento",
      "cantidad_gramos": número,
      "calorias_estimadas": número,
      "proteina_g": número,
      "carbohidratos_g": número,
      "grasa_g": número,
      "fibra_g": número,
      "confianza": 0.0-1.0,
      "notas": "nota" | null
    }
  ],
  "totales": {
    "calorias": número,
    "proteina_g": número,
    "carbohidratos_g": número,
    "grasa_g": número,
    "fibra_g": número
  },
  "ambiguedades": []
}
Usa porciones típicas de ${regionLabel}. Sé preciso con las estimaciones calóricas.`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messages: any[]

    if (method === 'photo') {
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: payload } },
          { type: 'text', text: `Analiza esta foto de comida. Tipo: ${meal_type}. País: ${country_code}. Devuelve el JSON nutricional.` },
        ],
      }]
    } else {
      messages = [{
        role: 'user',
        content: `Analiza este alimento: "${payload}". Tipo: ${meal_type}. País: ${country_code}. Devuelve el JSON nutricional.`,
      }]
    }

    // ── 4. Llamar a Anthropic ────────────────────────────────────────────────
    const aiResp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 2048, system: systemPrompt, messages }),
    })

    if (!aiResp.ok) {
      const errText = await aiResp.text()
      console.error('Anthropic error:', aiResp.status, errText)
      return applyRateLimitHeaders(
        jsonError('Error al analizar con IA. Intenta de nuevo.', 502),
        rateLimit
      )
    }

    const aiData = await aiResp.json()
    const rawContent: string = aiData.content?.[0]?.text ?? ''

    // ── 5. Parsear JSON de Claude ─────────────────────────────────────────────
    let analysis: {
      plato_descripcion: string
      origen_cultural: string | null
      confianza_general: number
      alimentos: Array<{
        nombre: string
        cantidad_gramos: number
        calorias_estimadas: number
        proteina_g: number
        carbohidratos_g: number
        grasa_g: number
        fibra_g: number
        confianza: number
        notas: string | null
      }>
      totales: {
        calorias: number
        proteina_g: number
        carbohidratos_g: number
        grasa_g: number
        fibra_g: number
      }
      ambiguedades?: string[]
    }

    try {
      const cleaned = rawContent.replace(/^```json\n?/m, '').replace(/```$/m, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('Parse error:', rawContent)
      return applyRateLimitHeaders(
        jsonError('La IA devolvió una respuesta inválida. Intenta de nuevo.', 500),
        rateLimit
      )
    }

    if (!hasValidAnalysisShape(analysis)) {
      return applyRateLimitHeaders(
        jsonError('La IA devolvió datos nutricionales fuera de rango. Intenta de nuevo.', 502),
        rateLimit
      )
    }

    // ── 6. Insertar en food_log_entries ───────────────────────────────────────
    const rows = analysis.alimentos.map((a) => ({
      user_id: user.id,
      food_id: null,
      log_date,
      meal_type,
      logging_method: method === 'photo' ? 'photo' : 'natural_text',
      calories_kcal: Math.round(a.calorias_estimadas),
      protein_g: Math.round(a.proteina_g * 10) / 10,
      carbs_g: Math.round(a.carbohidratos_g * 10) / 10,
      fat_g: Math.round(a.grasa_g * 10) / 10,
      fiber_g: Math.round(a.fibra_g * 10) / 10,
      quantity_grams: a.cantidad_gramos,
      custom_description: a.nombre,
      photo_storage_path: photo_storage_path ?? null,
      deleted_at: null,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('food_log_entries')
      .insert(rows)
      .select('id')

    if (insertError) {
      console.error('Insert error:', insertError)
      return applyRateLimitHeaders(
        jsonError('Error al guardar los alimentos.', 500),
        rateLimit
      )
    }

    // ── 7. Respuesta ─────────────────────────────────────────────────────────
    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        plato_descripcion: analysis.plato_descripcion,
        origen_cultural: analysis.origen_cultural,
        confianza_general: analysis.confianza_general,
        alimentos: analysis.alimentos.map((a) => ({
          nombre: a.nombre,
          cantidad_gramos: a.cantidad_gramos,
          calorias_estimadas: a.calorias_estimadas,
          proteina_g: a.proteina_g,
          carbohidratos_g: a.carbohidratos_g,
          grasa_g: a.grasa_g,
          fibra_g: a.fibra_g,
          confianza: a.confianza,
          metodo_estimacion: 'claude_estimate',
          db_food_id: null,
          db_serving_id: null,
          notas: a.notas,
        })),
        totales: analysis.totales,
        ambiguedades: analysis.ambiguedades ?? [],
        log_entry_ids: (inserted ?? []).map((e: { id: string }) => e.id),
      }),
      rateLimit
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonError('Error interno del servidor.', 500)
  }
}
