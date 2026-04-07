# SESSION.md — Nutria Dev Log

## Purpose
This file is the shared development context log for Nutria across Codex and Claude.
It captures the latest project state, decisions, blockers, and next steps so context is not lost between sessions.

## Update Rules
- Repository: `/Users/alex/Documents/GitHub/Nutria`
- Timezone: `Europe/Madrid`
- Daily save time: `21:00`
- Mode: `template + log`
- Always append a new entry under `## Daily Logs`
- Never delete prior entries unless they are factually wrong
- Always state which local workspace was used during the session
- Always leave a concrete `Next Session` section

## Canonical Shared Repo
- Shared context repo: `/Users/alex/Documents/GitHub/Nutria`
- GitHub remote: `https://github.com/BigAPP37/Nutria`

## Known Local Workspaces
- `/Users/alex/Documents/GitHub/Nutria` — shared repo for context file
- `/Users/alex/Desktop/Nutria` — recommended current working base aligned with remote and ahead by local commits
- `/Users/alex/nutria` — Expo/Supabase scaffold branch with divergent history and uncommitted local changes
- `/Users/alex/Proyectos/Nutria` — older divergent local line

## Entry Template
Use this structure for each daily update:

```md
### YYYY-MM-DD 21:00 Europe/Madrid
- Workspace Used:
- Current Goal:
- Completed Today:
- Decisions:
- Open Issues:
- Next Session:
- Refs:
```

## Daily Logs

### 2026-04-07 21:00 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` for shared context setup; audit references from `/Users/alex/Desktop/Nutria`, `/Users/alex/nutria`, and other local clones.
- Current Goal: Establish a durable shared session log so project context survives between Codex and Claude sessions.
- Completed Today: Audited all local Nutria clones; confirmed they all point to `https://github.com/BigAPP37/Nutria`; identified `/Users/alex/Desktop/Nutria` as the best current working base because it is ahead of `origin/main` and not behind; identified `/Users/alex/nutria` as a valuable rescue source due to Expo/Supabase scaffold and local uncommitted changes.
- Decisions: Use `/Users/alex/Documents/GitHub/Nutria/SESSION.md` as the shared context file; append daily entries instead of overwriting; standardize daily save time to `21:00` in `Europe/Madrid`; keep clone provenance explicit in each entry.
- Open Issues: The repository history has diverging local lines and signs of a forced update on `main`; work done in `/Users/alex/nutria` is not represented in the current remote history and may need selective migration later.
- Next Session: Continue from `/Users/alex/Desktop/Nutria` as the main base; compare it against `/Users/alex/nutria` to extract any missing Expo/Supabase assets, docs, or fixes worth porting; keep updating this file at the end of each working day.
- Refs: `origin/main` observed at `5abb977`; local base recommendation from repository audit on 2026-04-07.

### 2026-04-07 (sesión 2) Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` — lectura de arquitectura completa; sin modificaciones de código.
- Current Goal: Evaluar si patrones arquitectónicos modernos (tool registry, policy layer, cost tracker, prompt caching, slash commands) son factibles de adoptar en NutrIA sin romper la estabilidad actual.
- Completed Today:
  - Auditoría completa de la arquitectura de NutrIA: Expo Router + Supabase Edge Functions (Deno) + Claude Haiku vía HTTP directo. Sin AI SDK, sin tool calling, sin orchestration.
  - Análisis de factibilidad de 5 patrones arquitectónicos con dificultad, riesgo y beneficio por cada uno.
  - Identificación de puntos de integración posibles por capa (sin tocar código).
  - Diseño de una prueba sandbox completamente aislada (tool registry mock, policy layer, cost tracker simulado) ejecutable con `npx tsx`.
  - Definición de criterios de decisión y señales para saber cuándo adoptar cada patrón.
- Decisions:
  - **Hacer ahora:** Cost tracker (tokens ya vienen en respuesta de Claude, riesgo cero) y prompt caching (una línea, 60-80% ahorro en system prompt).
  - **Esperar 3-6 meses:** Policy layer (cuando las condiciones de salud superen lo manejable en el prompt).
  - **Esperar v2:** Tool registry y slash commands (solo tiene sentido con chat conversacional, que hoy no existe).
  - La arquitectura actual (prompt → JSON) es correcta para esta fase. No sobreingenierizarla.
- Open Issues:
  - No hay cost tracking en producción — el gasto en Claude API es invisible.
  - No hay observabilidad (ni métricas, ni alertas, ni rate limiting).
  - `health_conditions` referenciado en `ai-log` pero ausente del schema de DB.
  - Las edge functions `psych-detector` fallan silenciosamente (usuario no ve nada).
- Next Session: Implementar cost tracker mínimo en `ai-log` si se decide avanzar (añadir `input_tokens`, `output_tokens`, `cost_usd_estimate` a `food_log_entries` o tabla separada `ai_cost_log`). Opcional: activar prompt caching en la llamada HTTP a Claude.
- Refs:
  - Edge function AI: `supabase/functions/ai-log/index.ts` (720 líneas)
  - Schema DB: `supabase/nutria_schema.sql` (807 líneas)
  - Precio Claude Haiku: input $0.25/MTok, output $1.25/MTok
  - Prompt caching Anthropic: `cache_control: { type: "ephemeral" }` en el message de sistema

### 2026-04-07 (sesión 3) Europe/Madrid
- Workspace Used: `/Users/alex/Desktop/Nutria` para desarrollo y pruebas locales; `/Users/alex/Documents/GitHub/Nutria` para guardar contexto compartido.
- Current Goal: Preparar la estructura inicial de dietas en NutrIA, probar recetas keto con imagen dentro de la app y diseñar un flujo escalable con Gemini para generar recetas por lotes.
- Completed Today:
  - Arrancado NutrIA en local sobre `http://localhost:3000` usando Webpack y cerrada la instancia antigua que causaba confusión.
  - Diagnosticado el error de `/plans`: la UI consultaba `meal_plans.diet_style` pero la columna aún no existe en Supabase remoto; se añadió compatibilidad temporal para que `/plans` y el detalle de plan no fallen mientras la migración no se aplica.
  - Añadida la estructura de `diet_style` en código local:
    - migración nueva `supabase/migrations/add_diet_style_to_meal_plans_and_recipes.sql`
    - soporte en `scripts/seed_meal_plans_static.py`
    - badges y lectura compatible en `src/app/(app)/plans/page.tsx` y `src/app/(app)/plans/[planId]/page.tsx`
  - Definida la taxonomía base de NutrIA:
    - `goal_type` separado de `diet_style`
    - dietas principales: `mediterranea`, `keto`, `vegana`, `vegetariana`, `paleo`, `low_carb`, `high_protein`
    - `meal_type`: `breakfast`, `lunch`, `dinner`, `snack`
  - Se decidió trabajar primero el catálogo de recetas por dieta antes de construir planes completos.
  - Creada la carpeta de trabajo de imágenes del usuario para desayunos keto: `/Users/alex/Desktop/platos Keto desayuno`.
  - Subidas y conectadas en la app 3 recetas keto de desayuno/almuerzo con foto local + receta en Supabase:
    - `Huevos a la sartén con bacon crujiente` → imagen en `public/images/recipes/keto/breakfast/huevos-a-la-sarten-con-bacon-crujiente.png` → `recipe_id: ea933fc6-7b91-415f-a425-1854065cd81d`
    - `Tortilla de espinacas y queso feta` → imagen en `public/images/recipes/keto/breakfast/tortilla-espinacas-queso-feta.png` → `recipe_id: 72034a36-50b1-4dc7-8683-d4f39b1615a6`
    - `Aguacate relleno de huevo al horno` → imagen en `public/images/recipes/keto/breakfast/aguacate-relleno-huevo-al-horno.png` → `recipe_id: 986e85f8-072a-448b-b508-cd6ac37d5248`
    - además quedó una receta de prueba de almuerzo: `Tortilla keto de pollo y cheddar con guacamole` → `recipe_id: 89a90018-4c66-44db-98c7-9dff609d342e`
  - Las recetas de prueba se colgaron temporalmente dentro del `Plan Mantenimiento · 7 días` para verlas rápido en UI sin esperar al plan keto completo:
    - Día 1 desayuno
    - Día 2 desayuno
    - Día 3 desayuno
    - Día 1 almuerzo
  - Se validó que el flujo manual receta + foto funciona, pero resulta demasiado lento para escalar.
  - Se diseñó un flujo de automatización con Gemini por lotes:
    - generar varias recetas a la vez
    - nombrar imágenes por slug
    - guardar imágenes en carpeta de trabajo
    - devolver un único JSON batch
  - Se detectó que Gemini mezcla bien el JSON pero falla si intenta hacer imágenes en collage; decisión: batch JSON y generación de imágenes individuales en pasos separados.
  - Creados en el escritorio los archivos base para automatizar el flujo con Gemini:
    - `/Users/alex/Desktop/NUTRIA_BATCH_RULES.md`
    - `/Users/alex/Desktop/keto_breakfast_batch_01_input.txt`
- Decisions:
  - Trabajar por lotes (`batch`) y no receta a receta.
  - Usar `/Users/alex/Desktop/platos Keto desayuno` como carpeta origen para fotos de desayunos keto.
  - Mantener dos fases en Gemini:
    - generación del batch JSON
    - generación de imágenes individuales, nunca collage
  - El usuario solo pasará después el archivo batch y la carpeta de imágenes; Codex se encargará de normalizar, importar y enlazar.
  - Guardar siempre el contexto al cerrar sesión en `SESSION.md`.
- Open Issues:
  - La migración de `diet_style` todavía no está aplicada en Supabase remoto; la app funciona por fallback, pero la estructura real no existe aún en producción de datos.
  - El repo compartido `/Users/alex/Documents/GitHub/Nutria` tiene cambios locales ajenos (`src/app/onboarding/page.tsx`, `src/stores/onboardingStore.ts` y archivos `.temp` de Supabase); no deben tocarse al guardar contexto.
  - Las recetas keto visibles hoy están injertadas en un plan mediterráneo de mantenimiento solo como prueba visual; falta construir el plan keto real.
  - Falta el segundo Gem o prompt de limpieza del batch para dejar los JSON aún más cerca del formato importable final.
- Next Session:
  - Crear el segundo prompt/Gem de limpieza de batches.
  - Importar el resto de desayunos keto desde lote, no manualmente.
  - Dejar un `keto_breakfast_batch_01.json` limpio y estable como primer lote real.
  - Después pasar a `keto_lunch_batch_01`.
  - Cuando el catálogo mínimo exista, construir el `Plan Keto` real en Supabase en vez de usar el plan de mantenimiento como soporte visual.
- Refs:
  - UI local: `http://localhost:3000`
  - Plan de mantenimiento usado para pruebas: `98343483-40f5-4fa8-bf4d-57cc1cf9a8d1`
  - Archivos modificados en la base activa:
    - `/Users/alex/Desktop/Nutria/scripts/seed_meal_plans_static.py`
    - `/Users/alex/Desktop/Nutria/src/app/(app)/plans/page.tsx`
    - `/Users/alex/Desktop/Nutria/src/app/(app)/plans/[planId]/page.tsx`
    - `/Users/alex/Desktop/Nutria/supabase/migrations/add_diet_style_to_meal_plans_and_recipes.sql`
  - Archivos de automatización en escritorio:
    - `/Users/alex/Desktop/NUTRIA_BATCH_RULES.md`
    - `/Users/alex/Desktop/keto_breakfast_batch_01_input.txt`
