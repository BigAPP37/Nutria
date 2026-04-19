export type ShoppingCategory = {
  key: string
  label: string
  emoji: string
}

export type ShoppingItem = {
  name: string
  totalGrams: number
  category: ShoppingCategory
  priceEur: number | null
}

// ── Categorías ────────────────────────────────────────────────────────────────

const CATEGORIES: ShoppingCategory[] = [
  { key: 'carnes',    label: 'Carnes y aves',          emoji: '🥩' },
  { key: 'pescado',   label: 'Pescado y marisco',       emoji: '🐟' },
  { key: 'verduras',  label: 'Verduras y hortalizas',   emoji: '🥦' },
  { key: 'frutas',    label: 'Frutas',                  emoji: '🍎' },
  { key: 'lacteos',   label: 'Lácteos y huevos',        emoji: '🥛' },
  { key: 'cereales',  label: 'Cereales y pan',          emoji: '🌾' },
  { key: 'legumbres', label: 'Legumbres y frutos secos', emoji: '🫘' },
  { key: 'otros',     label: 'Aceites y condimentos',   emoji: '🫙' },
]

const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

// keyword → category key
const KEYWORD_CATEGORY: [RegExp, string][] = [
  [/pollo|pavo|ternera|cerdo|jamon|salchicha|carne/i,          'carnes'],
  [/salmon|merluza|at[uú]n|bacalao|gambas|pescad/i,            'pescado'],
  [/tofu/i,                                                      'lacteos'],
  [/pimiento|cebolla|tomate|zanahoria|espinaca|calabac|br[oó]col|champi|r[uú]cula|pepino|patata|boniato|aguacate|ajo|apio|puerro|lechuga|judias verdes|habas|maiz/i, 'verduras'],
  [/fr[ae]s|ar[aá]nd|pl[aá]tano|manzana|naranja|pi[ñn]a|kiwi|melocot|uva|cereza|mango/i, 'frutas'],
  [/yogur|skyr|queso|huevo|clara|leche|nata|mantequilla/i,     'lacteos'],
  [/avena|pan|pasta|arroz|quinoa|cuscus|cuscús|tortilla de trigo|cereales|granola/i, 'cereales'],
  [/garbanzos|lentejas|alubias|habichuelas|edamame|almendra|nuez|nueces|cacahuete|pista|semillas|chia|lino|sesamo|tofu/i, 'legumbres'],
  [/aceite|sal |pimienta|oregano|tomillo|vinagre|salsa|mostaza|ketchup|tahini|hummus|especias|curcuma|comino|paprika|limón|limon/i, 'otros'],
]

function classifyIngredient(name: string): ShoppingCategory {
  const lower = name.toLowerCase()
  for (const [re, key] of KEYWORD_CATEGORY) {
    if (re.test(lower)) return CAT_BY_KEY[key]
  }
  return CAT_BY_KEY['otros']
}

// ── Precios de referencia (€/100 g, Mercadona España 2025) ─────────────────

// Formato: palabra_clave → €/100g
const PRICE_MAP: [RegExp, number][] = [
  [/aceite de oliva/i,            0.75],
  [/pimiento rojo/i,              0.18],
  [/pimiento verde/i,             0.15],
  [/cebolla morada/i,             0.15],
  [/cebolla/i,                    0.12],
  [/quinoa cocida/i,              0.22],
  [/quinoa/i,                     0.60],
  [/espinaca/i,                   0.55],
  [/almendras/i,                  1.20],
  [/clara.*huevo/i,               0.40],
  [/pan integral/i,               0.36],
  [/semillas de ch[ií]a/i,        0.88],
  [/tomate/i,                     0.15],
  [/zanahoria/i,                  0.10],
  [/yogur griego/i,               0.36],
  [/avena/i,                      0.26],
  [/skyr/i,                       0.44],
  [/tofu/i,                       0.50],
  [/calabac[ií]n/i,               0.15],
  [/huevo/i,                      0.42],
  [/aguacate/i,                   0.50],
  [/queso fresco batido/i,        0.30],
  [/queso de cabra/i,             2.00],
  [/queso/i,                      0.80],
  [/nueces/i,                     1.40],
  [/garbanzos/i,                  0.30],
  [/boniato/i,                    0.20],
  [/ar[aá]nd/i,                   1.20],
  [/pl[aá]tano/i,                 0.15],
  [/manzana/i,                    0.15],
  [/fresas/i,                     0.40],
  [/br[oó]col/i,                  0.15],
  [/pasta integral cocida/i,      0.16],
  [/pasta/i,                      0.40],
  [/salm[oó]n/i,                  1.20],
  [/pechuga de pollo/i,           0.80],
  [/pechuga de pavo/i,            0.80],
  [/pollo/i,                      0.70],
  [/tortilla de trigo integral/i, 0.63],
  [/champi[ñn]/i,                 0.40],
  [/r[uú]cula/i,                  1.50],
  [/patata/i,                     0.10],
  [/pepino/i,                     0.10],
  [/cacahuete/i,                  0.63],
  [/hummus/i,                     1.00],
  [/at[uú]n/i,                    1.25],
  [/merluza/i,                    1.00],
  [/arroz integral/i,             0.08],
  [/arroz/i,                      0.15],
  [/cusc[uú]s/i,                  0.20],
  [/lentejas/i,                   0.25],
  [/edamame/i,                    0.60],
  [/semillas/i,                   0.70],
]

function estimatePrice(name: string, totalGrams: number): number | null {
  const lower = name.toLowerCase()
  for (const [re, price100g] of PRICE_MAP) {
    if (re.test(lower)) return Math.round(price100g * (totalGrams / 100) * 100) / 100
  }
  return null
}

// ── Normalización ─────────────────────────────────────────────────────────────

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '')   // quita paréntesis y su contenido
    .replace(/\s+/g, ' ')
    .trim()
}

// ── API pública ───────────────────────────────────────────────────────────────

export type RawIngredient = {
  ingredient_name: string
  quantity: number | null
  unit: string | null
}

export function aggregateIngredients(ingredients: RawIngredient[]): ShoppingItem[] {
  const totals = new Map<string, number>()

  for (const ing of ingredients) {
    if (!ing.quantity) continue
    const key = normalizeName(ing.ingredient_name)
    totals.set(key, (totals.get(key) ?? 0) + ing.quantity)
  }

  return Array.from(totals.entries())
    .map(([name, totalGrams]) => ({
      name,
      totalGrams: Math.round(totalGrams),
      category: classifyIngredient(name),
      priceEur: estimatePrice(name, totalGrams),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function groupByCategory(items: ShoppingItem[]): { category: ShoppingCategory; items: ShoppingItem[] }[] {
  const map = new Map<string, ShoppingItem[]>()

  for (const item of items) {
    const key = item.category.key
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }

  return CATEGORIES
    .filter(cat => map.has(cat.key))
    .map(cat => ({ category: cat, items: map.get(cat.key)! }))
}

export { CATEGORIES }
