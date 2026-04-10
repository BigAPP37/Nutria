// Edge Function: ai-log
// Analiza comida con IA (foto o texto) y guarda las entradas en food_log_entries.
// Requiere JWT de usuario autenticado — extrae user_id del token, nunca del body.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TEXT_PAYLOAD_CHARS = 500
const MAX_PHOTO_PAYLOAD_BYTES = 2 * 1024 * 1024
const LOG_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack'])
const TEXT_LIMIT_PER_MINUTE = 30
const PHOTO_LIMIT_PER_MINUTE = 10
const UPSTASH_URL = Deno.env.get('UPSTASH_REDIS_REST_URL')
const UPSTASH_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')
const allowedOrigins = new Set(
  [
    Deno.env.get('NEXT_PUBLIC_APP_URL'),
    Deno.env.get('APP_URL'),
    Deno.env.get('SUPABASE_SITE_URL'),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8081',
    'exp://127.0.0.1:8081',
  ].filter((origin): origin is string => Boolean(origin))
)

type AiLogMethod = 'photo' | 'text'

type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

type InMemoryBucket = {
  count: number
  reset: number
}

const edgeState = globalThis as typeof globalThis & {
  __nutriaAiRateLimitBuckets__?: Map<string, InMemoryBucket>
}

function getOriginHeaders(req: Request) {
  const origin = req.headers.get('origin')
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : null

  return {
    'Access-Control-Allow-Origin': allowOrigin ?? 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getOriginHeaders(req),
      'Content-Type': 'application/json',
    },
  })
}

function applyRateLimitHeaders(req: Request, response: Response, rateLimit: RateLimitResult) {
  const headers = new Headers(response.headers)

  Object.entries(getOriginHeaders(req)).forEach(([key, value]) => headers.set(key, value))
  headers.set('X-RateLimit-Limit', String(rateLimit.limit))
  headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
  headers.set('X-RateLimit-Reset', String(rateLimit.reset))

  return new Response(response.body, {
    status: response.status,
    headers,
  })
}

function getLimitForMethod(method: AiLogMethod) {
  return method === 'photo' ? PHOTO_LIMIT_PER_MINUTE : TEXT_LIMIT_PER_MINUTE
}

function estimateBase64Bytes(value: string) {
  const normalized = value.replace(/\s/g, '')
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0
  return Math.floor((normalized.length * 3) / 4) - padding
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

function validateRequestBody(body: {
  method: AiLogMethod
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

  if (body.method === 'photo' && estimateBase64Bytes(body.payload) > MAX_PHOTO_PAYLOAD_BYTES) {
    return 'La imagen es demasiado grande'
  }

  return null
}

function getFallbackStore() {
  if (!edgeState.__nutriaAiRateLimitBuckets__) {
    edgeState.__nutriaAiRateLimitBuckets__ = new Map()
  }

  return edgeState.__nutriaAiRateLimitBuckets__
}

function fallbackRateLimit(identifier: string, method: AiLogMethod): RateLimitResult {
  const store = getFallbackStore()
  const now = Date.now()
  const limit = getLimitForMethod(method)
  const reset = now + 60_000
  const key = `${method}:${identifier}`
  const bucket = store.get(key)

  if (!bucket || bucket.reset <= now) {
    store.set(key, { count: 1, reset })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
    }
  }

  bucket.count += 1
  store.set(key, bucket)

  return {
    success: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.reset,
  }
}

async function upstashRateLimit(identifier: string, method: AiLogMethod): Promise<RateLimitResult> {
  const key = `ratelimit:ai-log:${method}:${identifier}`
  const limit = getLimitForMethod(method)
  const response = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['PTTL', key],
      ['EXPIRE', key, '60', 'NX'],
      ['TTL', key],
    ]),
  })

  if (!response.ok) {
    return fallbackRateLimit(identifier, method)
  }

  const result = await response.json() as Array<{ result: number }>
  const count = result[0]?.result ?? 0
  const pttl = result[1]?.result ?? -1
  const ttlSeconds = result[3]?.result ?? 60
  const reset = pttl > 0 ? Date.now() + pttl : Date.now() + ttlSeconds * 1000

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset,
  }
}

async function limitAiLogRequests(identifier: string, method: AiLogMethod) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return fallbackRateLimit(identifier, method)
  }

  return upstashRateLimit(identifier, method)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getOriginHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json(req, { error: 'No autorizado' }, 401)
    }

    const jwt = authHeader.slice(7)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return json(req, { error: 'Token inválido o expirado' }, 401)
    }

    const body = await req.json()
    const {
      method,
      payload,
      meal_type,
      country_code = 'ES',
      photo_storage_path,
      log_date,
    } = body as {
      method: AiLogMethod
      payload: string
      meal_type: string
      country_code?: string
      photo_storage_path?: string
      log_date: string
    }

    if (!method || !payload || !meal_type || !log_date) {
      return json(req, { error: 'Faltan parámetros: method, payload, meal_type, log_date' }, 400)
    }

    const validationError = validateRequestBody({
      method,
      payload,
      meal_type,
      country_code,
      log_date,
    })
    if (validationError) {
      return json(req, { error: validationError }, 400)
    }

    const rateLimit = await limitAiLogRequests(user.id, method)
    if (!rateLimit.success) {
      return applyRateLimitHeaders(
        req,
        json(
          req,
          {
            error: method === 'photo'
              ? 'Has superado el límite temporal de análisis por foto. Intenta de nuevo en un minuto.'
              : 'Has superado el límite temporal de análisis por texto. Intenta de nuevo en un minuto.',
          },
          429
        ),
        rateLimit
      )
    }

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

    let messages: Array<Record<string, unknown>>

    if (method === 'photo') {
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: payload } },
          {
            type: 'text',
            text: `Analiza esta foto de comida. Tipo: ${meal_type}. País: ${country_code}. Devuelve el JSON nutricional.`,
          },
        ],
      }]
    } else {
      messages = [{
        role: 'user',
        content: `Analiza este alimento: "${payload}". Tipo: ${meal_type}. País: ${country_code}. Devuelve el JSON nutricional.`,
      }]
    }

    const anthropicResp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      }),
    })

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text()
      console.error('Anthropic error:', errText)
      return applyRateLimitHeaders(
        req,
        json(req, { error: 'Error al analizar con IA. Intenta de nuevo.' }, 502),
        rateLimit
      )
    }

    const anthropicData = await anthropicResp.json()
    const rawContent: string = anthropicData.content?.[0]?.text ?? ''

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
      console.error('Claude response parse error:', rawContent)
      return applyRateLimitHeaders(
        req,
        json(req, { error: 'La IA devolvió una respuesta inválida. Intenta de nuevo.' }, 500),
        rateLimit
      )
    }

    if (!hasValidAnalysisShape(analysis)) {
      return applyRateLimitHeaders(
        req,
        json(req, { error: 'La IA devolvió datos nutricionales fuera de rango. Intenta de nuevo.' }, 502),
        rateLimit
      )
    }

    const rows = analysis.alimentos.map((item) => ({
      user_id: user.id,
      food_id: null,
      log_date,
      meal_type,
      logging_method: method === 'photo' ? 'photo' : 'natural_text',
      calories_kcal: Math.round(item.calorias_estimadas),
      protein_g: Math.round(item.proteina_g * 10) / 10,
      carbs_g: Math.round(item.carbohidratos_g * 10) / 10,
      fat_g: Math.round(item.grasa_g * 10) / 10,
      fiber_g: Math.round(item.fibra_g * 10) / 10,
      quantity_grams: item.cantidad_gramos,
      custom_description: item.nombre,
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
        req,
        json(req, { error: 'Error al guardar los alimentos en la base de datos.' }, 500),
        rateLimit
      )
    }

    return applyRateLimitHeaders(
      req,
      json(req, {
        success: true,
        plato_descripcion: analysis.plato_descripcion,
        origen_cultural: analysis.origen_cultural,
        confianza_general: analysis.confianza_general,
        alimentos: analysis.alimentos.map((item) => ({
          nombre: item.nombre,
          cantidad_gramos: item.cantidad_gramos,
          calorias_estimadas: item.calorias_estimadas,
          proteina_g: item.proteina_g,
          carbohidratos_g: item.carbohidratos_g,
          grasa_g: item.grasa_g,
          fibra_g: item.fibra_g,
          confianza: item.confianza,
          metodo_estimacion: 'claude_estimate',
          db_food_id: null,
          db_serving_id: null,
          notas: item.notas,
        })),
        totales: analysis.totales,
        ambiguedades: analysis.ambiguedades ?? [],
        log_entry_ids: (inserted ?? []).map((entry: { id: string }) => entry.id),
      }),
      rateLimit
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return json(req, { error: 'Error interno del servidor.' }, 500)
  }
})
