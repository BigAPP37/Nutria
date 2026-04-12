# Automatización de Recetas y Dietas

## Qué deja resuelto hoy

El repo ya tenía piezas separadas:

- `scripts/seed_meal_plans_static.py`
- `scripts/seed_meal_plans.py`
- `scripts/generate_food_images.py`
- `scripts/upload_food_images.py`

Ahora hay un punto único de entrada:

```bash
python3 scripts/recipes_pipeline.py <comando>
```

Y además un flujo editorial real para lotes externos:

```bash
npm run recipes:pipeline -- validate-bundle content/recipe-bundles/example-bundle
npm run recipes:pipeline -- import-bundle content/recipe-bundles/example-bundle --replace-existing-plans
```

## Flujo seguro recomendado

Este es el flujo que puedes ejecutar sin riesgo de duplicar planes:

```bash
python3 scripts/recipes_pipeline.py report
python3 scripts/recipes_pipeline.py full-safe --limit 20
```

`full-safe` hace:

1. Reporte del estado actual.
2. Generación automática de imágenes de `foods` con Gemini.
3. Subida a Supabase Storage.
4. Reporte final.

## Comandos útiles

### Ver estado

```bash
python3 scripts/recipes_pipeline.py report
```

### Generar imágenes automáticas con Gemini

```bash
python3 scripts/recipes_pipeline.py images-auto --limit 20
python3 scripts/recipes_pipeline.py images-auto --name "Manzana"
python3 scripts/recipes_pipeline.py images-auto --refill
```

### Subir imágenes manuales desde carpeta local

```bash
python3 scripts/recipes_pipeline.py images-manual --pending
python3 scripts/recipes_pipeline.py images-manual --dry-run
python3 scripts/recipes_pipeline.py images-manual
```

### Insertar planes estáticos

```bash
python3 scripts/recipes_pipeline.py seed-static --dry-run
python3 scripts/recipes_pipeline.py seed-static
```

`seed-static` queda fuera del flujo automático por defecto porque hoy inserta datos de forma acumulativa.

### Validar e importar bundles editoriales

Estructura esperada:

- una carpeta por lote
- `manifest.json`
- subcarpeta `images/` con las imágenes Gemini ya generadas

Ejemplo incluido:

`content/recipe-bundles/example-bundle/manifest.json`

Validación:

```bash
npm run recipes:pipeline -- validate-bundle content/recipe-bundles/example-bundle
```

Importación:

```bash
npm run recipes:pipeline -- import-bundle content/recipe-bundles/example-bundle --replace-existing-plans
```

## Variables necesarias

En `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

`GEMINI_API_KEY` funciona como alias de `GOOGLE_AI_KEY` para el pipeline actual.

## Cómo evolucionarlo a un agente automático real

El siguiente paso no es otro script suelto. Es separar el sistema en 4 capas:

1. `brief -> specs`
   Un agente genera un lote estructurado de recetas/planes en JSON.

2. `specs -> validación`
   Un validador comprueba macros, duplicados, campos vacíos, tiempos absurdos y consistencia de ingredientes.

3. `validación -> persistencia`
   Un seeder idempotente hace upsert en `recipes`, `recipe_ingredients`, `recipe_steps`, `meal_plans`, `meal_plan_days` y `meal_plan_meals`.

4. `persistencia -> imágenes`
   Un worker genera imágenes pendientes con Gemini, sube a Storage y actualiza URLs.

## Arquitectura recomendada del agente

Para hacerlo bien de verdad:

- `agent_recipe_brief.py`
  recibe objetivo, kcal, estilo, restricciones y número de días

- `agent_recipe_generator.py`
  devuelve recetas y planes en JSON normalizado para guardarlos en una carpeta bundle

- `validate_recipe_bundle.py`
  bloquea datos incoherentes antes de tocar Supabase

- `import_recipe_bundle.py`
  sube imágenes y sincroniza recetas/planes a BD

- `recipes_pipeline.py`
  queda como orquestador operativo

## Orden de implementación recomendado

1. Hacer idempotente el seed estático.
2. Sacar las recetas estáticas a JSON/YAML en vez de tenerlas embebidas en Python.
3. Conectar ChatGPT para producir bundles completos.
4. Generar imágenes Gemini por slug dentro del bundle.
5. Revisar y luego importar con `validate-bundle -> import-bundle`.

## Operativa mínima diaria

Si vas a trabajar ya mismo con volumen:

```bash
python3 scripts/recipes_pipeline.py report
python3 scripts/recipes_pipeline.py images-auto --limit 30
python3 scripts/recipes_pipeline.py images-manual --pending
```

Eso te da una base automatizada hoy, antes de construir el agente completo.
