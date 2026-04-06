// Route Handler: /api/food-lookup
// Proxy a Open Food Facts para buscar un producto por código de barras
// Evita CORS y normaliza la respuesta al formato de Nutria

import { NextRequest, NextResponse } from 'next/server'

export interface FoodLookupResult {
  found: boolean
  name: string
  brand: string | null
  kcal_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
  fiber_100g: number | null
}

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get('barcode')

  if (!barcode || !/^\d{6,14}$/.test(barcode)) {
    return NextResponse.json({ error: 'Código de barras inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: { 'User-Agent': 'Nutria/1.0 (contacto@nutria.app)' },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!res.ok) {
      return NextResponse.json({ found: false } as FoodLookupResult)
    }

    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false } as FoodLookupResult)
    }

    const p = data.product
    const n = p.nutriments ?? {}

    const kcal = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null
    if (!kcal) {
      return NextResponse.json({ found: false } as FoodLookupResult)
    }

    const result: FoodLookupResult = {
      found: true,
      name: p.product_name_es || p.product_name || 'Producto desconocido',
      brand: p.brands || null,
      kcal_100g: Math.round(kcal),
      protein_100g: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      carbs_100g: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      fat_100g: Math.round((n.fat_100g ?? 0) * 10) / 10,
      fiber_100g: n.fiber_100g != null ? Math.round(n.fiber_100g * 10) / 10 : null,
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Error al buscar el producto' }, { status: 502 })
  }
}
