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
- **ÚNICO workspace de trabajo:** `/Users/alex/Documents/GitHub/Nutria`
- **Rama única compartida de trabajo:** `alex-dev`
- GitHub remote: `https://github.com/BigAPP37/Nutria`

## Regla de workspace
**Siempre trabajar en `/Users/alex/Documents/GitHub/Nutria` sobre la rama `alex-dev`.**
**No trabajar en `main` para cambios de producto o UI salvo instrucción explícita.**
**Codex y Claude deben entrar directamente a `alex-dev` al iniciar sesión.**
Las otras carpetas (Desktop/Nutria, nutria, Proyectos/Nutria) están obsoletas y NO deben usarse.

## Workspaces obsoletos (no usar)
- `/Users/alex/Desktop/Nutria` — desactualizado
- `/Users/alex/nutria` — desactualizado
- `/Users/alex/Proyectos/Nutria` — desactualizado

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

### 2026-04-09 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` — solo lectura de contexto y documentación de diseño. Sin modificaciones de código.
- Current Goal: Diseñar el cambio visual radical de NutrIA ("Warm Living") sin tocar código todavía.
- Completed Today:
  - Auditoría completa de la UI actual: estructura de carpetas, librerías (Tailwind v4, Lucide, Recharts), tokens de color actuales, componentes existentes y páginas.
  - Diseño del sistema visual completo "Warm Living" con agente de diseño UI/UX. Documento de diseño generado cubre:
    - Tipografía: Plus Jakarta Sans (UI) + Fraunces (números hero) — reemplaza Inter.
    - Paleta: fondo #FFFDF7 butter cream, verde salvia #16A34A, coral nuevo #FF8A72.
    - 10 componentes clave especificados pixel a pixel: BottomNav, CalorieRing, Cards, Botones, Inputs, Headers, Tabs, Sheets, AnalyzingSpinner, LogSuccess.
    - Rediseño de todas las páginas: Dashboard, Log, Plans, Stats, Settings, Onboarding.
    - Mapa de poses de Nuti por contexto y hora del día.
    - Sistema de animaciones completo: easing tokens, transiciones de página, microinteracciones.
    - Onboarding conversacional: "El Camino de Nuti" (Nuti habla con burbuja de texto, no formulario frío).
- Decisions:
  - Concepto: "Warm Living" — app cálida, orgánica, empática. No clínica.
  - Los 10 cambios más impactantes priorizados (ver lista en conversación).
  - NO se toca código todavía. Primero alinear con el usuario qué componente implementar primero.
  - Sin modo oscuro — decisión deliberada (app de nutrición se usa de día, con cámara).
- Open Issues:
  - Ningún archivo de código modificado en esta sesión.
  - Pendiente decidir qué componente/página implementar primero.
  - La migración de `diet_style` en Supabase remoto sigue pendiente (viene de sesión anterior).
  - Los batches de recetas keto siguen pendientes (viene de sesión anterior).
- Next Session:
  - **Paso exacto siguiente:** Decidir por qué componente empezar el rediseño. Candidatos lógicos por impacto inmediato:
    1. `globals.css` — cambiar tokens de color y añadir Plus Jakarta Sans + Fraunces (cambia TODO de golpe, bajo riesgo)
    2. `BottomNav.tsx` — isla flotante con botón central elevado
    3. Dashboard header — reemplazar gradiente rectangular por blob SVG orgánico
  - Recomendación: empezar por `globals.css` (tokens) y fuentes en `layout.tsx` — máximo impacto visual con mínimo riesgo de romper lógica.
  - Workspace para implementar: `/Users/alex/Desktop/Nutria`
- Refs:
  - Documento de diseño completo generado en conversación de Claude (2026-04-09).
  - Concepto: "Warm Living" — 10 cambios clave documentados en la conversación.
  - Base de trabajo de código: `/Users/alex/Desktop/Nutria`
  - Tokens principales: ver sección 2 del documento de diseño en la conversación.

### 2026-04-09 21:00 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` como base principal; mismo repo compartido para web Next, migraciones Supabase y app Expo anidada en `Nutria/`.
- Current Goal: Endurecer la app completa sin tocar el frente de tipografías/diseño que Claude estaba iterando, cerrando bugs de lógica, guards, fechas, onboarding, planes y flows móviles rotos.
- Completed Today:
  - Rediseño base web previamente aterrizado y estabilizado sin seguir tocando la capa visual en esta pasada.
  - Stripe webhook endurecido en `src/app/api/stripe/webhook/route.ts`: si falla la persistencia en Supabase ya no responde 200 silenciosamente; ahora fuerza retry real de Stripe.
  - Gating server-side del límite de fotos IA añadido en `src/app/api/ai-log/route.ts` y en `Nutria/supabase/functions/ai-log/index.ts`; el cliente ya no decide por sí solo cuántas fotos gratis puede usar.
  - Auth/onboarding web endurecido:
    - `src/components/auth/AuthForm.tsx` ahora soporta ausencia de `user_profiles` y redirige bien a onboarding.
    - `src/app/(app)/layout.tsx` fuerza sync de perfil/onboarding antes de dejar entrar a rutas privadas.
    - `src/proxy.ts` protege también onboarding/auth según el estado real del perfil.
  - Auth bootstrap móvil arreglado en `Nutria/src/features/auth/useAuthListener.ts` y `Nutria/src/stores/authStore.ts`; ya no deja `SplashLoading` colgado cuando no hay sesión o tras logout.
  - Bugs de fechas UTC eliminados en web y móvil:
    - helpers nuevos `src/lib/date.ts` y `Nutria/src/lib/date.ts`
    - reemplazados los usos de `toISOString().split('T')[0]` en dashboard, log, streaks, premium daily gating, food add, plan activation, recipe logging, fasting tracker y varias pantallas/hooks móviles.
  - Reachability móvil reparada:
    - `Nutria/src/app/(tabs)/index.tsx` ya no usa `setState` dentro de `useMemo`
    - agua conectada a mutations reales
    - botón de retry invalida queries reales
    - modales implementados en `Nutria/src/app/(modals)/weight-log.tsx` y `Nutria/src/app/(modals)/water-log.tsx`
    - `Nutria/src/app/(onboarding)/ready.tsx` corregido para no romper por `cn` faltante.
  - Descartar log IA móvil ya borra de verdad las filas insertadas antes de resetear el flujo en `Nutria/src/app/(tabs)/log.tsx`.
  - Onboarding web migrado a RPC atómica:
    - nueva función SQL `complete_onboarding_atomic`
    - `src/app/onboarding/page.tsx` ya usa la RPC en vez de coordinar múltiples writes desde cliente.
  - Activación de planes web migrada a RPC atómica:
    - nueva función SQL `activate_meal_plan_atomic`
    - `src/app/(app)/plans/[planId]/page.tsx` ya usa la RPC y además expone mejor estado de activación/error.
  - “Rehacer onboarding” desde settings ahora funciona de verdad:
    - baja `onboarding_completed` en servidor
    - resetea `useOnboardingStore`
    - navega a onboarding con el guard en estado coherente.
  - Bugs funcionales adicionales cerrados:
    - `src/hooks/usePremiumStatus.ts` deja de romperse si todavía no existe fila de perfil; ahora trata ese caso como `free` en vez de lanzar error duro.
    - `src/app/api/food-lookup/route.ts` ya acepta productos legítimos de `0 kcal` y no los descarta como falsy.
    - `Nutria/src/components/stats/WeightChart.tsx` usa parseo local de fechas y limpia un import muerto.
  - Se creó `supabase/config.toml` local en este repo para que deje de depender del contexto global de `/Users/alex/supabase`.
  - Se corrigió el `project-ref` local del repo al proyecto real del usuario: `lslqqmfflmfjlzmneqof`.
- Decisions:
  - Mantener el trabajo visual separado del trabajo de lógica: en esta sesión no tocar más fuentes/estética, solo estabilidad.

### 2026-04-10 08:35 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` para web/migraciones y `/Users/alex/Documents/GitHub/Nutria/Nutria` para la app Expo anidada.
- Current Goal: Cerrar la funcionalidad de avatar de perfil y rematar la deuda técnica activa que seguía afectando validación y mantenimiento.
- Completed Today:
  - Avatar de perfil completo en web:
    - subida, cambio y borrado en `src/app/(app)/settings/page.tsx`
    - render del avatar en `src/app/(app)/dashboard/page.tsx`
    - `next/image` usado en web para quitar los warnings de `<img>`
  - Avatar de perfil completo en móvil:
    - selector de galería desde `Nutria/src/app/(tabs)/stats.tsx`
    - helper de subida/borrado en `Nutria/src/features/profile/avatarUpload.ts`
    - perfil móvil ya tipa y consume `avatar_url`
    - dependencia nueva `expo-image-picker` añadida al subproyecto Expo
  - Migración Supabase creada para soportar avatares:
    - `supabase/migrations/20260410_add_profile_avatars.sql`
    - añade `avatar_url` a `user_profiles`
    - crea bucket `avatars`
    - crea policies para lectura pública y escritura/borrado por carpeta del usuario autenticado
  - Baseline Expo saneado de verdad:
    - `npm run lint` en `Nutria/` vuelve a pasar
    - `npm run typecheck` en `Nutria/` vuelve a pasar
    - se corrigieron errores activos en componentes/herramientas del subproyecto, incluyendo `PsychSupportCard`, `FoodSearchBar`, `queryClient`, `purchases`, y tipados de hooks de dashboard/profile/TDEE
  - Web root validado de nuevo:
    - `npm run lint` OK
    - `npm run build` OK
- Decisions:
  - Mantener la subida de avatar en un punto ya existente de la UX móvil (`stats`) en vez de abrir una pantalla nueva solo para perfil.
  - Priorizar deuda activa/importada por encima de placeholders no usados.
  - Aceptar warnings menores solo si no rompen flujo; el objetivo de esta sesión fue dejar validaciones principales limpias y funcionalidad real cerrada.
- Open Issues:
  - Falta aplicar en Supabase la migración `20260410_add_profile_avatars.sql`; sin eso, la UI de avatar está lista pero el bucket/columna no existirán todavía en runtime.
  - En el repo raíz, `git status` sigue mostrando mucha superficie modificada de sesiones previas; no se ha intentado limpiar ni separar en commits aquí.
  - Siguen existiendo varios archivos placeholder/TODO en Expo no conectados a flujos actuales. No bloquean build/lint/typecheck hoy.
- Next Session:
  - Aplicar en Supabase la migración de avatares y probar el flujo end-to-end con un usuario real.
  - Si se quiere seguir endureciendo, la siguiente pasada lógica es eliminar placeholders muertos o convertirlos en componentes reales solo si entran en uso.
  - Si se va a publicar, revisar `git diff` y agrupar cambios por bloques (`web stability`, `expo stability`, `avatars`, `migrations`) antes de commit.
- Refs:
  - Web avatar/settings: `/Users/alex/Documents/GitHub/Nutria/src/app/(app)/settings/page.tsx`

### 2026-04-10 21:00 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` para saneo pre-auditoría en web y contexto compartido.
- Current Goal: Cerrar hallazgos evitables antes de pasar una nueva auditoría externa con Opus.
- Completed Today:
  - Revisión rápida de vigencia de la auditoría antigua frente al estado actual del repo.
  - Confirmado que varios findings viejos ya no aplican: rutas legales existentes, objetivos reales en dashboard, persistencia de `is_day_complete`, validación JWT en endpoints Stripe y verificación real en `/premium/success`.
  - Eliminada la parte engañosa del dashboard que mostraba vitamina C, hierro y calcio como métricas simuladas; ahora solo se muestra fibra calculada y un estado explícito para micronutrientes avanzados.
  - Añadido `.env.example` con variables necesarias para web, Stripe, Supabase, Anthropic y Expo/RevenueCat.
  - Ajustado `.gitignore` para permitir versionar `.env.example` sin abrir la puerta a secretos reales.
  - Validación del repo web completada con `npm run lint` OK y `npm run build` OK.
- Decisions:
  - Antes de una auditoría nueva, es mejor quitar métricas falsas aunque eso deje una sección más austera.
  - La nueva auditoría debe hacerse ya sobre el estado validado por `lint` + `build`, no sobre la auditoría de marzo ni sobre clones divergentes.
- Open Issues:
  - Sigue pendiente aplicar en Supabase la migración `20260410_add_profile_avatars.sql` y probar el flujo real de avatar end-to-end.
  - El subdirectorio `Nutria/` sigue apareciendo como no trackeado desde este repo raíz; no se tocó en esta sesión.
  - La auditoría nueva aún puede encontrar deuda real en arquitectura, datos y mobile, pero debería tener bastante menos ruido por findings caducados o triviales.
- Next Session:
  - Pasar la nueva auditoría con Opus sobre `/Users/alex/Documents/GitHub/Nutria`.
  - Pedir foco en issues vigentes de seguridad, consistencia de datos, onboarding, Supabase runtime y frontera web/mobile, ignorando hallazgos ya resueltos de la auditoría de marzo.
  - Después, contrastar findings nuevos con este estado validado y decidir qué se cierra antes de tocar diseño o features nuevas.
- Refs:
  - `/Users/alex/Documents/GitHub/Nutria/src/app/(app)/dashboard/page.tsx`
  - `/Users/alex/Documents/GitHub/Nutria/src/components/dashboard/MicronutrientRow.tsx`
  - `/Users/alex/Documents/GitHub/Nutria/.env.example`
  - `/Users/alex/Documents/GitHub/Nutria/.gitignore`
  - Web avatar/dashboard: `/Users/alex/Documents/GitHub/Nutria/src/app/(app)/dashboard/page.tsx`
  - Mobile avatar UI: `/Users/alex/Documents/GitHub/Nutria/Nutria/src/app/(tabs)/stats.tsx`
  - Mobile avatar helper: `/Users/alex/Documents/GitHub/Nutria/Nutria/src/features/profile/avatarUpload.ts`
  - Supabase migration: `/Users/alex/Documents/GitHub/Nutria/supabase/migrations/20260410_add_profile_avatars.sql`
  - Usar RPCs para onboarding y activación de plan en vez de coordinar compensaciones desde cliente.
  - Adoptar fecha local (`YYYY-MM-DD` derivada por componentes locales) como canon para lógica diaria.
  - Conservar `SESSION.md` como punto de verdad de la sesión antes de agotar tokens.
- Open Issues:
  - La migración `supabase/migrations/20260409_add_atomic_onboarding_and_plan_activation.sql` se subió manualmente en Supabase Dashboard por limitación de red/CLI: el `db push` quedó bloqueado por IPv6 en la red actual. El código cliente ya asume que esa migración existe en el proyecto `lslqqmfflmfjlzmneqof`.
  - La app Expo anidada `Nutria/` sigue teniendo deuda previa fuera de lo tocado hoy: `typecheck` global roto, `src/types/navigation.ts` vacío, varios TODOs y warnings en zonas no cubiertas.
  - Siguen quedando hallazgos medios del informe original que no se cerraron hoy, por ejemplo:
    - refactorizar más flows móviles y deuda de typed routes
    - revisar `psych-detector`/mensajería sensible
    - seguir limpiando TODOs y pantallas placeholder en Expo.
- Next Session:
  - Verificar manualmente en producto real estos cuatro caminos:
    1. signup + onboarding completo con usuario nuevo
    2. rehacer onboarding desde settings
    3. activar un plan desde `/plans/[planId]`
    4. descartar un log IA móvil y confirmar que no deja filas en `food_log_entries`
  - Si todo eso funciona, pasar al siguiente bloque de deuda real: app Expo (`typecheck`, typed routes, TODOs restantes y limpieza de componentes stats/logging).
  - Si falla algo de onboarding/planes, revisar primero que las funciones SQL `complete_onboarding_atomic` y `activate_meal_plan_atomic` existan en el proyecto `lslqqmfflmfjlzmneqof`.
- Refs:
  - Repo: `/Users/alex/Documents/GitHub/Nutria`
  - Proyecto Supabase correcto: `lslqqmfflmfjlzmneqof`
  - Migración atómica: `/Users/alex/Documents/GitHub/Nutria/supabase/migrations/20260409_add_atomic_onboarding_and_plan_activation.sql`
  - Archivos clave tocados esta sesión:
    - `src/app/api/stripe/webhook/route.ts`
    - `src/app/api/ai-log/route.ts`
    - `src/components/auth/AuthForm.tsx`
    - `src/app/(app)/layout.tsx`
    - `src/proxy.ts`
    - `src/lib/date.ts`
    - `src/app/onboarding/page.tsx`
    - `src/app/(app)/plans/[planId]/page.tsx`
    - `src/app/(app)/settings/page.tsx`
    - `src/hooks/usePremiumStatus.ts`
    - `src/app/api/food-lookup/route.ts`
    - `Nutria/src/lib/date.ts`
    - `Nutria/src/app/(tabs)/index.tsx`
    - `Nutria/src/app/(tabs)/log.tsx`
    - `Nutria/src/app/(tabs)/stats.tsx`
    - `Nutria/src/app/(modals)/weight-log.tsx`
    - `Nutria/src/app/(modals)/water-log.tsx`
    - `Nutria/src/features/auth/useAuthListener.ts`
    - `Nutria/src/stores/authStore.ts`

### 2026-04-09 (sesión 4) Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` — trabajo de diseño UI y setup ML local.
- Current Goal: Continuar rediseño "Warm Living" + preparar entorno ML local con Gemma 4.
- Completed Today:
  - **Diseño UI (Warm Living) — repo GitHub:**
    - `layout.tsx`: añadida fuente Oswald con variable `--font-oswald`; incluida en el `<html>` className junto a Manrope y Fraunces.
    - `AppHero` (`src/components/ui/AppPage.tsx`): nueva prop opcional `eyebrowClassName` para personalizar estilo del eyebrow por página sin tocar el componente base.
    - `src/app/(app)/stats/page.tsx`: eyebrow cambiado a "Tu evolución" con Oswald + `tracking-[0.22em]` para probar la tipografía pedida por el usuario.
  - **Entorno ML local:**
    - Creado venv en `~/.venvs/ml` con Python 3.11 (Python 3.14 no soporta torch aún).
    - Instalado: `transformers==5.5.3`, `torch==2.2.2`, `accelerate==1.13.0`.
    - Identificados modelos Gemma 4 disponibles en HF (todos requieren aceptar términos en huggingface.co):
      - `google/gemma-4-E2B-it` — 2B edge, recomendado para Mac 8-16 GB RAM
      - `google/gemma-4-E4B-it` — 4B edge, Mac 16+ GB RAM
      - `google/gemma-4-26B-A4B-it` — MoE 26B / 4B activos, Mac 16+ GB RAM
      - `google/gemma-4-31B-it` — 31B, requiere Mac M2 Ultra o Pro
    - Creado script de inferencia local con loop de chat: `/Users/alex/Desktop/run_gemma4.py`
      - Auto-detecta dispositivo: MPS (Apple Silicon), CUDA o CPU
      - Usa `torch.bfloat16` y `device_map` automático
      - Aplica `apply_chat_template` para formato correcto de instrucción
- Decisions:
  - Python 3.11 como base del venv ML (3.14 sin soporte PyTorch todavía).
  - Gemma 4 E2B como modelo por defecto para pruebas locales (menor RAM).
  - El script es stand-alone, no integrado en NutrIA de momento.
- Open Issues:
  - Para descargar Gemma 4 hay que: (1) aceptar términos en huggingface.co/google/gemma-4-E2B-it y (2) hacer login con `source ~/.venvs/ml/bin/activate && python -c "from huggingface_hub import notebook_login; notebook_login()"` o setear `HF_TOKEN`.
  - El eyebrow "Tu evolución" con Oswald en stats está en prueba — el usuario puede pedir ajustar tracking/peso.
  - La migración de `diet_style` en Supabase remoto sigue pendiente (viene de sesiones anteriores).
- Next Session:
  - Hacer login HF y probar descarga + inferencia de `gemma-4-E2B-it` con el script del escritorio.
  - Validar que Oswald en stats page se ve bien; ajustar o extender a otras páginas según feedback.
  - Continuar rediseño Warm Living en el repo Desktop si el usuario lo pide.
- Refs:
  - Venv ML: `~/.venvs/ml` (Python 3.11)
  - Script Gemma 4: `/Users/alex/Desktop/run_gemma4.py`
  - Modelo base recomendado: `google/gemma-4-E2B-it`
  - Página de términos Gemma 4: https://huggingface.co/google/gemma-4-E2B-it
  - Archivos modificados esta sesión:
    - `src/app/layout.tsx` (font Oswald)
    - `src/components/ui/AppPage.tsx` (eyebrowClassName prop)
    - `src/app/(app)/stats/page.tsx` (eyebrow "Tu evolución" + Oswald)

### 2026-04-09 21:50 Europe/Madrid

- Context:
  - El usuario pidió dejar `gemma4` instalado, listo para arrancar y con explicación de uso.
- What Changed:
  - Se verificó que `Gemma 4` existe oficialmente hoy y que, para este Mac, la variante razonable es `E2B`.
  - Se descartó `Ollama` porque su app actual no instala en macOS 13 Ventura:
    - `brew install --cask ollama` devolvió que requiere Sonoma o superior.
  - Se instaló runtime local basado en `llama.cpp` binario precompilado:
    - descargado desde release oficial `ggml-org/llama.cpp`
    - extraído en `/Users/alex/.local/llama.cpp`
    - symlinks creados:
      - `/usr/local/bin/llama-cli`
      - `/usr/local/bin/llama-server`
  - Se descargó el modelo local:
    - `/Users/alex/.local/models/gemma4-e2b/gemma-4-e2b-it-q4_0.gguf`
  - Se descargó también el proyector multimodal:
    - `/Users/alex/.local/models/gemma4-e2b/mmproj-gemma-4-e2b-it-q4_0.gguf`
  - Se crearon wrappers:
    - `/usr/local/bin/gemma4-chat`
    - `/usr/local/bin/gemma4-server`
  - Se añadieron funciones shell a `/Users/alex/.zshrc`:
    - `gemma4-chat`
    - `gemma4-server`
- Validation:
  - `llama-cli --version` OK
  - `llama-server --version` OK
  - Smoke test real del modelo OK:
    - respondió `listo`
    - rendimiento observado aprox. `14.8 tok/s` en generación en CPU
- Decisions:
  - No usar variantes Gemma 4 más grandes en este equipo:
    - Mac Intel `x86_64`
    - `8 GB` RAM
    - macOS `13 Ventura`
  - Configuración conservadora por defecto:
    - contexto `2048`
    - `4` threads
- Recommended Commands:
  - Chat interactivo:
    - `gemma4-chat`
  - Prompt único:
    - `gemma4-chat -n 128 -p "Explícame qué puedes hacer"`
  - Servidor HTTP local:
    - `gemma4-server`
  - API local por defecto:
    - `http://127.0.0.1:8080`
- Notes:
  - El wrapper en `~/.zshrc` evita un problema raro de ejecución directa del script en `/usr/local/bin` en este Mac.
  - El `mmproj` quedó bajado para futuras pruebas multimodales, pero el flujo principal ya funciona con texto.

### 2026-04-10 07:00 Europe/Madrid

- Context:
  - Se retoma `Nutria` desde el punto guardado ayer, priorizando el baseline técnico de la app Expo anidada `Nutria/`.
- What Changed:
  - Se instaló el entorno real del subproyecto Expo con:
    - `npm install --legacy-peer-deps`
  - El motivo de `--legacy-peer-deps`:
    - conflicto heredado entre `react@19` y peer deps de `@shopify/react-native-skia`
    - no había `package-lock.json`, así que se eligió el camino pragmático para poder validar el proyecto.
  - Se saneó `Nutria/tsconfig.json` para que el `typecheck` de la app móvil sea útil:
    - `target: ES2022`
    - `jsx: react-jsx`
    - `moduleResolution: bundler`
    - `esModuleInterop: true`
    - `allowSyntheticDefaultImports: true`
    - `types: ["nativewind/types"]`
    - `include` reducido a `src/**/*.ts`, `src/**/*.tsx`, `nativewind-env.d.ts`
    - `exclude` añadido para `supabase/functions/**`, `docs/**`, `node_modules`
  - Se corrigieron errores reales de la app Expo:
    - `src/app/_layout.tsx`
      - eliminado uso de `Stack.Protected` porque no existe en la versión instalada de `expo-router`
      - sustituido por registro condicional de grupos `(tabs)`, `(modals)`, `(onboarding)` y `(auth)` según sesión/onboarding
    - `src/app/(tabs)/index.tsx`
      - añadida import faltante de `queryKeys`
    - `src/components/ui/Button.tsx`
      - `ButtonProps` ya no hereda `children` render-prop de `PressableProps`
      - ahora tipa `children` como `ReactNode`, evitando error de tipos
    - `src/app/(onboarding)/welcome.tsx`
      - eliminado import roto de asset local que no existía en el repo
      - sustituido por imagen remota estable usando `expo-image`
  - Se reemplazaron dos rutas placeholder por modales seguros:
    - `Nutria/src/app/(modals)/edit-entry.tsx`
    - `Nutria/src/app/(modals)/ai-confirm.tsx`
    - ya no contienen `// TODO: implementar`
    - ahora muestran estado explícito y permiten volver sin dejar rutas vacías.
- Validation:
  - `npm run typecheck` en `Nutria/` OK
  - `npx eslint` sobre los archivos tocados en Expo OK
- Decisions:
  - Mantener fuera del `typecheck` del cliente móvil las edge functions Deno de `supabase/functions`, porque requieren otro entorno y otro set de tipos.
  - No bloquear el trabajo por el conflicto de peer deps de Skia mientras no haya un lockfile oficial del subproyecto.
- Open Issues:
  - `src/types/navigation.ts` sigue siendo un placeholder y no aporta typed routes reales todavía.
  - Los modales `edit-entry` y `ai-confirm` ya no están rotos, pero siguen siendo versiones mínimas y no el flujo final.
  - El subproyecto Expo queda instalado con `node_modules` y `package-lock.json` nuevos; revisar si se quieren commitear o regenerar de forma limpia.
- Next Session:
  - Implementar typed routes reales o eliminar `src/types/navigation.ts` si no se va a usar.
  - Revisar flujos móviles donde aún hay comentarios tipo `TODO`, por ejemplo lectura de `country_code` desde perfil en `src/app/(tabs)/log.tsx`.
  - Si se quiere endurecer más la app Expo, siguiente bloque lógico: `psych-detector`/mensajería sensible y limpieza de placeholders restantes.

### 2026-04-10 07:30 Europe/Madrid

- Context:
  - El usuario pidió explícitamente hacer las dos cosas pendientes del bloque Expo:
    1. typed routes / navegación
    2. deuda funcional móvil inmediata
- What Changed:
  - Se convirtió `src/types/navigation.ts` de placeholder vacío a capa mínima útil de navegación:
    - `routes.auth.login`
    - `routes.auth.register`
    - `routes.tabs.root`
    - `routes.tabs.log`
    - `routes.onboarding.*`
    - `routes.modals.camera`
    - `routes.modals.weightLog`
    - helper `foodDetailRoute(foodId, mealType?)`
  - Se migraron usages de strings frágiles a constantes/helper tipados en:
    - `Nutria/src/app/(auth)/login.tsx`
    - `Nutria/src/app/(auth)/register.tsx`
    - `Nutria/src/app/(onboarding)/welcome.tsx`
    - `Nutria/src/app/(onboarding)/body-profile.tsx`
    - `Nutria/src/app/(onboarding)/goal.tsx`
    - `Nutria/src/app/(onboarding)/activity.tsx`
    - `Nutria/src/app/(onboarding)/tca-screening.tsx`
    - `Nutria/src/app/(onboarding)/preferences.tsx`
    - `Nutria/src/app/(tabs)/stats.tsx`
    - `Nutria/src/app/(tabs)/log.tsx`
  - Se cerró la deuda funcional de `country_code` hardcodeado en mobile log:
    - `Nutria/src/app/(tabs)/log.tsx` ahora usa `useProfile()` y manda `profile?.country_code ?? "ES"` al flujo IA
  - Se dejaron además dos modales placeholder como pantallas seguras y navegables:
    - `Nutria/src/app/(modals)/edit-entry.tsx`
    - `Nutria/src/app/(modals)/ai-confirm.tsx`
  - Se ajustaron dos pantallas de onboarding para que lint no choque con mutaciones imperativas válidas de Reanimated:
    - `Nutria/src/app/(onboarding)/body-profile.tsx`
    - `Nutria/src/app/(onboarding)/tca-screening.tsx`
- Validation:
  - `npm run typecheck` en `Nutria/` OK
  - `npx eslint` sobre toda la zona tocada de Expo OK
- Decisions:
  - Mantener typed routes ligeras y locales, sin depender de generación automática de tipos de Expo Router, porque el objetivo aquí era subir el suelo técnico con el menor cambio posible.
  - Mantener fallback `"ES"` para `country_code` mientras el perfil no esté cargado todavía.
- Open Issues:
  - La capa de navegación ahora sí aporta valor, pero no cubre absolutamente todas las rutas posibles del árbol; es una primera capa intencional para los flows críticos.
  - `edit-entry` y `ai-confirm` siguen siendo versiones mínimas seguras, no la funcionalidad final.
- Next Session:
  - Si seguimos en Expo, siguiente bloque lógico:
    1. revisar `psych-detector`/mensajería sensible
    2. decidir si `edit-entry` y `ai-confirm` se implementan de verdad o se retiran del árbol
    3. limpiar otros usos de rutas y params si aparecen nuevos flows

### 2026-04-10 07:20 Europe/Madrid

- Context:
  - El usuario pidió hacer las dos cosas siguientes en la app Expo `Nutria/`:
    1. typed routes / navegación
    2. deuda funcional móvil pendiente (`country_code`, placeholders y rutas blandas)
- What Changed:
  - `src/types/navigation.ts`
    - ya no es un placeholder
    - ahora centraliza rutas compartidas del subproyecto Expo
    - exporta:
      - `routes.auth.*`
      - `routes.tabs.*`
      - `routes.onboarding.*`
      - `routes.modals.*`
      - helper `foodDetailRoute(foodId, mealType?)`
      - tipo `MealType`
  - Se sustituyeron rutas string frágiles por rutas centralizadas en:
    - `src/app/(auth)/login.tsx`
    - `src/app/(auth)/register.tsx`
    - `src/app/(onboarding)/welcome.tsx`
    - `src/app/(tabs)/log.tsx`
    - `src/app/(tabs)/stats.tsx`
  - `country_code` ya no está hardcodeado como `"ES"` en los flujos principales de IA:
    - `src/app/(tabs)/log.tsx`
    - `src/app/(modals)/camera.tsx`
    - ahora ambos leen `country_code` desde `useProfile()` y usan fallback seguro a `"ES"` solo si el perfil aún no está disponible.
  - Limpieza de tipos:
    - `src/app/(modals)/camera.tsx`
      - eliminado `as any` en `meal_type`
      - eliminado `catch (err: any)` y sustituido por narrowing seguro con `instanceof Error`
- Validation:
  - `npm run typecheck` en `Nutria/` OK
  - `npx eslint` sobre navegación/log/camera/auth/onboarding/stats OK
- Decisions:
  - Considerar “typed routes reales” como rutas centralizadas + helpers tipados compatibles con la versión actual de `expo-router`, en vez de intentar una capa de codegen o tipos mágicos innecesaria para este repo.
  - Mantener fallback `"ES"` por resiliencia mientras el perfil todavía no está cargado, pero ya no depender del hardcode como fuente primaria.
- Open Issues:
  - Siguen existiendo varios componentes/feature files en Expo que aún están en `// TODO: implementar`, pero ya no afectan a las rutas principales corregidas hoy.
  - `src/types/navigation.ts` cubre rutas usadas hoy; si aparecen más modales o params complejos conviene seguir ampliándolo en vez de volver a strings sueltas.
- Next Session:
  - Siguiente bloque de valor real en Expo:
    - revisar `psych-detector` / mensajería sensible
    - o limpiar placeholders funcionales restantes empezando por:
      - `src/components/logging/CameraCapture.tsx`
      - `src/components/logging/ServingPicker.tsx`
      - `src/components/stats/MacroBreakdown.tsx`

### 2026-04-10 08:35 Europe/Madrid

- Workspace Used:
  - `/Users/alex/Documents/GitHub/Nutria`
  - subproyecto Expo anidado en `/Users/alex/Documents/GitHub/Nutria/Nutria`
- Current Goal:
  - cerrar el flujo de foto de perfil y dejar el baseline técnico de web + Expo en estado operable para que el usuario pueda seguir trabajando sin tener que babysittear el repo.
- Completed Today:
  - Web:
    - se añadió soporte de avatar de perfil en `src/app/(app)/settings/page.tsx`
    - el usuario ya puede subir, cambiar y quitar foto desde ajustes
    - la URL se persiste en `user_profiles.avatar_url`
    - los archivos se suben al bucket `avatars`
    - el dashboard muestra el avatar en `src/app/(app)/dashboard/page.tsx`
    - se sustituyeron los `<img>` nuevos por `next/image` para dejar `npm run lint` limpio
  - Supabase:
    - nueva migración `supabase/migrations/20260410_add_profile_avatars.sql`
    - crea columna `user_profiles.avatar_url`
    - crea bucket `avatars`
    - añade policies para lectura pública y escritura limitada al propio usuario
  - Expo / móvil:
    - se instaló `expo-image-picker` en `Nutria/package.json`
    - se añadió subida/quitado de avatar en `Nutria/src/app/(tabs)/stats.tsx`
    - se creó helper de storage `Nutria/src/features/profile/avatarUpload.ts`
    - el avatar móvil usa la misma columna `avatar_url` del perfil y sube imágenes al mismo bucket `avatars`
    - se corrigió un bug real: la foto anterior ya no se borra antes de que el perfil quede actualizado con la nueva URL
  - Saneamiento técnico Expo:
    - `npm run typecheck` vuelve a pasar en `Nutria/`
    - `npm run lint` en `Nutria/` queda sin errores; se limpiaron falsos positivos/ruido en componentes activos
    - se quitaron varios `any` fáciles, strings no escapadas y warnings de imports/deps sobrantes
  - Observabilidad/robustez:
    - `src/hooks/usePsychFlag.ts` ya no degrada errores de consulta a `null` silencioso; ahora lanza error real para no confundir fallo operativo con “no hay flag”
- Validation:
  - raíz web:
    - `npm run lint` OK
    - `npm run build` OK
  - Expo `Nutria/`:
    - `npm run typecheck` OK
    - `npm run lint` OK
- Decisions:
  - mantener el avatar accesible en móvil sin crear una pantalla extra: se integró directamente en `stats`
  - no se intentó “tipar de verdad” Supabase en Expo en esta sesión; el placeholder `src/types/database.ts` sigue siendo temporal hasta correr `npx supabase gen types typescript --linked`
  - se priorizó limpiar deuda activa/importada; los placeholders no usados siguen sin implementarse porque no aportan valor hoy
- Open Issues:
  - **Importante:** la migración de avatares `20260410_add_profile_avatars.sql` existe en el repo pero todavía hay que aplicarla en Supabase para que el flujo de avatar funcione en runtime
  - el archivo `Nutria/src/types/database.ts` sigue siendo un placeholder permisivo; conviene regenerarlo cuando el proyecto Supabase esté bien enlazado
  - siguen existiendo algunos archivos `// TODO: implementar` en Expo, pero no están conectados a los flows principales actuales
- Next Session:
  - aplicar en Supabase la migración `20260410_add_profile_avatars.sql`
  - regenerar tipos reales de Supabase dentro de `Nutria/`
  - si se quiere seguir limpiando deuda funcional: revisar `psych-detector`/mensajería sensible y decidir si los placeholders Expo se implementan o se eliminan del árbol

### 2026-04-10 21:00 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` y subproyecto Expo en `/Users/alex/Documents/GitHub/Nutria/Nutria`.
- Current Goal: Cerrar los bloques vigentes de la auditoría nueva antes de seguir con features o diseño.
- Completed Today:
  - Bloque 1 de seguridad web/IA cerrado en código:
    - `src/app/api/ai-log/route.ts` endurecido con rate limiting, validación de `meal_type`, `country_code`, tamaño de payload, ventana válida de `log_date` y validación de rangos de salida de IA.
    - `supabase/functions/ai-log/index.ts` reescrito para dejar de usar `aiprime.store` y llamar directo a Anthropic; ahora también tiene rate limiting, validaciones equivalentes y CORS restringido.
    - `next.config.ts` ampliado con headers de hardening y CSP.
    - `.env.example` y `.gitignore` ajustados para reflejar Upstash/App URL sin exponer secretos.
  - Bloque 2 de consistencia web/móvil muy avanzado:
    - móvil migrado a la misma RPC atómica `complete_onboarding_atomic` en `Nutria/src/features/onboarding/submitOnboarding.ts`
    - `Nutria/src/features/tdee/useTdeeState.ts` ahora prioriza `goal_kcal` y macros persistidos en BD, usando recálculo solo como fallback de compatibilidad
    - `src/lib/calculations.ts` alineado con el mínimo calórico por sexo del móvil
    - `src/hooks/useFoodSearch.ts` ya usa `country_code` real del perfil en vez de hardcodear `ES`
    - `src/app/(app)/settings/page.tsx` ya invoca `tdee-update` al registrar peso en web
    - racha unificada:
      - web sigue usando `src/hooks/useStreakDays.ts`
      - móvil añade `Nutria/src/features/dashboard/useStreakDays.ts` y deja de inferir la racha desde `complete_days` de la última snapshot
    - agua web normalizada para sumar filas diarias existentes y reescribir el total diario en `src/components/dashboard/WaterTracker.tsx` y `src/app/(app)/dashboard/page.tsx`
    - móvil deja de mostrar objetivos falsos si falta TDEE:
      - `Nutria/src/app/(tabs)/index.tsx`
      - `Nutria/src/app/(tabs)/stats.tsx`
    - dashboard web corregido en dos hallazgos finos:
      - el toggle `is_day_complete` revierte si falla el `upsert`
      - `today` deja de quedarse stale si la pestaña cruza medianoche o vuelve a foco
  - Limpieza visual pre-auditoría mantenida:
    - `src/components/dashboard/MicronutrientRow.tsx` y `src/app/(app)/dashboard/page.tsx` ya no muestran micronutrientes simulados; solo fibra real + estado explícito.
- Validation:
  - Web:
    - `npm run lint` OK
    - `npm run build` OK
  - Expo:
    - `npm run typecheck` OK
    - eslint sobre archivos tocados del bloque OK
- Decisions:
  - Priorizar una sola fuente de verdad para onboarding y TDEE: BD + RPC compartida, no cálculos divergentes por plataforma.
  - Cuando no hay datos reales de objetivo en móvil, mostrar estado pendiente en vez de inventar números.
  - Tratar agua como total diario compatible con histórico existente, evitando que web y móvil se pisen con modelos distintos.
- Open Issues:
  - Sigue pendiente aplicar en Supabase la migración `20260410_add_profile_avatars.sql`.
  - Aún quedan findings secundarios de la auditoría, pero ya no los críticos principales de onboarding/TDEE/web-mobile ni los de IA que estaban más expuestos.
  - Falta revisar y, si conviene, fragmentar el diff actual por bloques antes de commit (`security`, `web-mobile consistency`, `dashboard cleanup`).
- Next Session:
  - Actualizar y ordenar `git diff` por bloques para preparar commit limpio.
  - Si se sigue con deuda técnica, siguiente foco razonable:
    - `psych-detector` y mensajería sensible
    - revisión de findings restantes de Stripe/webhook
    - aplicar migración de avatares y probar el flujo real end-to-end
- Refs:
  - `/Users/alex/Documents/GitHub/Nutria/AUDITORIA_COMPLETA_10_04_2026.md`
  - `/Users/alex/Documents/GitHub/Nutria/src/app/api/ai-log/route.ts`
  - `/Users/alex/Documents/GitHub/Nutria/supabase/functions/ai-log/index.ts`
  - `/Users/alex/Documents/GitHub/Nutria/src/app/(app)/dashboard/page.tsx`
  - `/Users/alex/Documents/GitHub/Nutria/src/components/dashboard/WaterTracker.tsx`
  - `/Users/alex/Documents/GitHub/Nutria/src/lib/calculations.ts`
  - `/Users/alex/Documents/GitHub/Nutria/Nutria/src/features/onboarding/submitOnboarding.ts`
  - `/Users/alex/Documents/GitHub/Nutria/Nutria/src/features/tdee/useTdeeState.ts`
  - `/Users/alex/Documents/GitHub/Nutria/Nutria/src/features/dashboard/useStreakDays.ts`

### 2026-04-11 05:56 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria`.
- Current Goal: Rematar findings de seguridad pendientes en Stripe y `psych-detector` sin tocar el repo móvil divergente.
- Completed Today:
  - Stripe:
    - `src/app/api/stripe/checkout/route.ts` y `src/app/api/stripe/portal/route.ts` ya usan `APP_URL`/`NEXT_PUBLIC_APP_URL` en vez del header `Origin`.
    - `src/app/api/stripe/webhook/route.ts` ahora implementa idempotencia real sobre `event.id`:
      - reclama el evento en `stripe_events`
      - ignora duplicados ya `processing`/`processed`
      - permite reintento controlado si un evento previo quedó en `failed`
      - marca `processed` o `failed` al final del manejo
    - se añadió la migración `supabase/migrations/20260411_add_stripe_events.sql`.
  - `psych-detector`:
    - `supabase/functions/psych-detector/index.ts` deja de aceptar `SUPABASE_SERVICE_ROLE_KEY` como bearer para cron.
    - el modo cron pasa a depender de `CRON_SECRET` dedicado.
    - CORS deja de estar abierto con `*` y pasa a limitarse a orígenes conocidos (`APP_URL`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SITE_URL`, localhost y Expo local).
    - el cron deja de procesar usuarios 100% secuencialmente y ahora trabaja en lotes concurrentes (`CRON_BATCH_SIZE=10`) con `Promise.allSettled`.
  - Config:
    - `.env.example` actualizado con `CRON_SECRET`.
- Validation:
  - `npm run lint` OK
  - `npm run build` OK
- Decisions:
  - No tocar el repo anidado `Nutria/Nutria` hasta planificar rescate manual; el trabajo válido sigue centralizado en el repo raíz.
  - Para Stripe, la idempotencia se resuelve con tabla propia; no con memoria local ni headers temporales.
  - Para cron interno, nunca reutilizar `SUPABASE_SERVICE_ROLE_KEY` como credencial HTTP.
- Open Issues:
  - Sigue pendiente aplicar en Supabase las migraciones nuevas (`20260410_add_profile_avatars.sql` y `20260411_add_stripe_events.sql`).
  - `psych-detector` todavía tiene margen de optimización adicional en queries por usuario; lo crítico ya queda cubierto.
  - El repo raíz tiene cambios locales sin commit de este bloque de Stripe/`psych-detector`.
- Next Session:
  - agrupar este bloque en commit limpio de seguridad
  - aplicar migraciones en Supabase
  - si se sigue con la auditoría, revisar `SEC-07` / `SEC-08` en `supabase/config.toml`

### 2026-04-11 22:45 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria` — rama `main`
- Current Goal: Cerrar auditoría completa, consolidar workspace único y sincronizar repo móvil.
- Completed Today:
  - **Workspace unificado:** `session-sync` fusionado a `main` con force push. Carpetas obsoletas (`Desktop/Nutria`, `nutria`, `Proyectos/Nutria`) eliminadas del disco. `SESSION.md` actualizado con regla de workspace único.
  - **Migraciones aplicadas en Supabase:** `20260410` (avatares), `20260411` (índices), `20260412` (stripe_events), `20260413` (food-photos bucket), `20260414` (get_active_user_ids RPC).
  - **PERF-02 + PERF-04:** Dashboard migrado a `useDashboardData` (TanStack Query, `staleTime: 30s`). `useEffect` manual eliminado. Commit `a34ba91`.
  - **PERF-03:** psych-detector usa RPC `get_active_user_ids` en modo cron (Codex). Commit `3fb76eb`.
  - **ARQ-01/02/03/10:** Verificados en código — ya estaban resueltos por Codex en sesiones anteriores. Auditados y marcados en `AUDIT_STATUS_11_04_2026.md`.
  - **SEC-11:** Confirmado visualmente en Supabase Dashboard — bucket `food-photos` privado.
  - **Auditoría completa 10/04/2026 cerrada al 100%.**
  - **Repo móvil rescatado:** `Nutria/` tenía 9 commits locales sin pushear. Pusheados a rama `mobile` en GitHub tras fix de `http.postBuffer`. Commit head: `52f4085`.
  - `AUDIT_STATUS_11_04_2026.md` actualizado y sincronizado en múltiples rondas.
- Decisions:
  - Workspace único: `/Users/alex/Documents/GitHub/Nutria`, rama `main`. Sin excepciones.
  - Rama `mobile` en GitHub para el código Expo — no mezclar con `main` (web Next.js).
  - Auditoría cerrada: próximo trabajo es producto/features o deuda móvil, no más hardening urgente.
- Open Issues:
  - `Nutria/` sigue sin ser trackeado desde el repo raíz — tiene su propio `.git` apuntando a rama `mobile`. No es un problema activo.
  - SEC-07/08 (`config.toml`): verificar que los cambios están reflejados en Supabase Dashboard remoto (no solo en el archivo local).
- Next Session:
  - Decidir siguiente bloque: producto/UI/features (rediseño "Warm Living", recetas keto) o deuda móvil (TODOs, typed routes, pantallas placeholder).
  - Si se va a producto: empezar por `globals.css` tokens + fuentes (máximo impacto visual, mínimo riesgo).

### 2026-04-12 Europe/Madrid
- Workspace Used: `/Users/alex/Documents/GitHub/Nutria`
- Current Goal: Unificar el flujo de trabajo entre Codex, Claude y Codespaces en una sola rama compartida y dejar el bloque reciente de onboarding visible ahí.
- Completed Today:
  - Se fija `alex-dev` como rama única compartida para trabajo diario.
  - Regla de sesión actualizada: Codex y Claude deben entrar directamente a `alex-dev`, no a `main`.
  - El bloque reciente de onboarding web queda preparado para moverse a `alex-dev` como siguiente base compartida.
- Decisions:
  - `main` deja de ser la rama de trabajo interactiva del día a día.
  - Codespaces, Codex y Claude deben revisar y desarrollar sobre `alex-dev`.
  - Si hay cambios locales ajenos en el árbol, se aíslan antes de empujar; no se abren ramas nuevas por defecto salvo petición explícita.
- Open Issues:
  - Confirmar que `alex-dev` existe en remoto y que el Codespace del usuario se abre sobre esa rama.
  - `next.config.ts` sigue modificado fuera del bloque de onboarding y `Nutria/` sigue como repo anidado no trackeado desde la raíz.
- Next Session:
  - Trabajar directamente en `alex-dev`.
  - Verificar en Codespaces con `git branch --show-current` que la sesión está sobre `alex-dev` antes de revisar UI.
- Refs:
  - Rama objetivo: `alex-dev`
  - Bloque reciente de onboarding: commit `f160f70`
