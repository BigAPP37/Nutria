// Route Handler: /api/ai-log
// Analiza comida con IA (texto o foto) y guarda las entradas en food_log_entries
// Valida la sesión del usuario con Supabase, llama a AIPrime (proxy Claude)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
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
      return jsonError('Error al analizar con IA. Intenta de nuevo.', 502)
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
      return jsonError('La IA devolvió una respuesta inválida. Intenta de nuevo.', 500)
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
      return jsonError('Error al guardar los alimentos.', 500)
    }

    // ── 7. Respuesta ─────────────────────────────────────────────────────────
    return NextResponse.json({
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
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonError('Error interno del servidor.', 500)
  }
}
