# Auditoría Completa NutrIA — 10/04/2026

**Fecha:** 2026-04-10
**Modelo:** Claude Opus 4.6 (3 agentes en paralelo)
**Alcance:** Next.js App Router (web) + Expo React Native (`Nutria/`) + Supabase Edge Functions + Schema SQL + integraciones Stripe y Claude AI
**Workspace:** `/Users/alex/Documents/GitHub/Nutria`

---

## Resumen Ejecutivo

| Categoría | Issues | CRÍTICOS | ALTOS | MEDIOS | BAJOS |
|-----------|--------|----------|-------|--------|-------|
| Seguridad | 19 | 2 | 6 | 8 | 3 |
| Código / Arquitectura | 32 | 4 | 9 | 10 | 9 |
| Performance / DB | ~35 | 3 | 4 | varios | varios |
| **Total** | **~86** | **9** | **19** | — | — |

### Los 9 CRÍTICOs

1. `aiprime.store` proxy — API key de Anthropic + datos de usuarios expuestos a tercero
2. Sin rate limiting en endpoints de IA — denial-of-wallet ilimitado
3. Onboarding web/móvil incompatible — RPC, columnas y campos distintos
4. TDEE calculado diferente en web vs móvil — mismo usuario ve objetivos distintos
5. Schema mismatch `user_tdee_state` — web espera `goal_kcal`, móvil escribe `current_tdee_kcal`
6. Calorie goal mínimo diferente por sexo entre plataformas (1200 web vs 1200/1500 móvil)
7. Índices DB faltantes en todas las tablas core
8. Dashboard: 3 queries secuenciales + waterfall de userId (+300ms evitables)
9. psych-detector: N usuarios × 5 queries secuenciales → timeout a escala

---

## SECCIÓN 1 — SEGURIDAD

### [CRÍTICO] SEC-01: Proxy de IA de terceros no confiable (aiprime.store)

- **Archivo:** `supabase/functions/ai-log/index.ts`, línea 139
- **Descripción:** La Edge Function envía todas las peticiones de IA (fotos de comida en base64 + API key de Anthropic) a `https://aiprime.store/v1/chat/completions` en lugar de a `api.anthropic.com`.
- **Vector de ataque:** El operador de `aiprime.store` tiene acceso completo a la API key, todas las fotos de comida de los usuarios, y todas las descripciones de alimentos. Puede modificar respuestas arbitrariamente.
- **Fix:** Reemplazar por `https://api.anthropic.com/v1/messages` y adaptar al formato nativo de Anthropic (referencia: `src/app/api/ai-log/route.ts` ya lo hace correctamente).

### [CRÍTICO] SEC-02: Ausencia total de rate limiting en endpoints de IA

- **Archivos:** `src/app/api/ai-log/route.ts`, `supabase/functions/ai-log/index.ts`
- **Descripción:** Ningún endpoint de IA implementa rate limiting. Las peticiones de texto son ilimitadas (la cuota de 3 fotos/día solo aplica a fotos).
- **Vector de ataque:** Un atacante autenticado puede enviar miles de peticiones por minuto a `/api/ai-log` con `method: "text"`, agotando crédito de Anthropic a 50-100 USD/hora.
- **Fix:** Implementar con `@upstash/ratelimit` — 20 peticiones/hora para usuarios free, mayor límite para premium.

### [ALTO] SEC-03: CORS wildcard en Edge Functions

- **Archivos:** `supabase/functions/ai-log/index.ts` línea 13, `supabase/functions/psych-detector/index.ts` línea 314
- **Descripción:** `Access-Control-Allow-Origin: '*'` en ambas funciones.
- **Vector de ataque:** Cualquier web maliciosa puede invocar estas funciones con la sesión activa del usuario, extrayendo datos nutricionales y flags psicológicos.
- **Fix:** Restringir a dominio de producción + `localhost:3000` para desarrollo. Añadir header `Vary: Origin`.

### [ALTO] SEC-04: Prompt injection en endpoints de IA

- **Archivos:** `src/app/api/ai-log/route.ts` línea 163, `supabase/functions/ai-log/index.ts` líneas 124 y 134
- **Descripción:** `payload`, `meal_type` y `country_code` se concatenan directamente en el prompt sin sanitización ni validación de whitelist.
- **Vector de ataque:** Inyección de instrucciones para manipular datos nutricionales insertados en la BD (valores negativos, falsos).
- **Fix:** Validar `meal_type` contra whitelist, `country_code` contra regex `^[A-Z]{2}$`, limitar `payload` a 500 chars, validar rangos numéricos de la respuesta de Claude antes de insertar.

### [ALTO] SEC-05: Service role key como Bearer token en psych-detector

- **Archivo:** `supabase/functions/psych-detector/index.ts`, línea 352
- **Descripción:** `if (token === SUPABASE_SERVICE_ROLE_KEY)` — la clave maestra de Supabase viaja como Bearer token HTTP y se compara como string plano.
- **Fix:** Usar `CRON_SECRET` dedicado. Nunca exponer service role key en requests HTTP.

### [ALTO] SEC-06: Ausencia total de security headers HTTP

- **Archivo:** `next.config.ts`
- **Descripción:** No hay CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy ni Permissions-Policy.
- **Fix:**
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://lslqqmfflmfjlzmneqof.supabase.co; connect-src 'self' https://lslqqmfflmfjlzmneqof.supabase.co https://api.anthropic.com;" },
    ],
  }]
}
```

### [ALTO] SEC-07: Política de contraseñas extremadamente débil

- **Archivo:** `supabase/config.toml`, líneas 171-174
- **Descripción:** `minimum_password_length = 6`, `password_requirements = ""`. Sin CAPTCHA habilitado.
- **Fix:** Mínimo 8 caracteres, `password_requirements = "lower_upper_letters_digits"`. Habilitar Turnstile.

### [ALTO] SEC-08: Confirmación de email deshabilitada

- **Archivo:** `supabase/config.toml`, línea 205
- **Descripción:** `enable_confirmations = false` — sesión inmediata sin verificar email.
- **Vector de ataque:** Registro masivo con emails falsos para abusar del endpoint de IA.
- **Fix:** `enable_confirmations = true`

### [MEDIO] SEC-09: Webhook Stripe sin idempotencia

- **Archivo:** `src/app/api/stripe/webhook/route.ts`
- **Descripción:** No se verifica si un evento ya fue procesado. Retries de Stripe pueden causar race conditions.
- **Fix:** Guardar `event.id` en tabla `stripe_events` y verificar antes de procesar.

### [MEDIO] SEC-10: Open redirect via header Origin en Stripe

- **Archivos:** `src/app/api/stripe/checkout/route.ts` línea 73, `src/app/api/stripe/portal/route.ts` líneas 40-41
- **Descripción:** `success_url` y `return_url` se construyen con `request.headers.get('origin')` controlable por el atacante.
- **Fix:** Usar exclusivamente `process.env.NEXT_PUBLIC_APP_URL`.

### [MEDIO] SEC-11: Storage RLS para bucket food-photos ausente

- **Descripción:** No existe ninguna migración que cree el bucket `food-photos` ni sus políticas RLS. Cualquier usuario autenticado podría listar y descargar fotos de otros usuarios.
- **Fix:** Crear migración con bucket privado y políticas `auth.uid()::text = (storage.foldername(name))[1]` para INSERT/SELECT/DELETE.

### [MEDIO] SEC-12: Payload base64 sin límite de tamaño

- **Archivos:** `src/app/api/ai-log/route.ts`, `supabase/functions/ai-log/index.ts`
- **Fix:** Rechazar payloads > 2MB base64 para fotos, > 500 chars para texto.

### [MEDIO] SEC-13: log_date sin validación de formato ni rango

- **Descripción:** Un atacante puede enviar `log_date: "9999-12-31"` para evadir la cuota diaria de fotos.
- **Fix:** Validar formato YYYY-MM-DD y que la fecha esté dentro de los últimos 7 días.

### [MEDIO] SEC-14: MFA completamente deshabilitado

- **Archivo:** `supabase/config.toml`
- **Fix:** Habilitar TOTP como opción para usuarios premium: `enroll_enabled = true`, `verify_enabled = true`.

### [MEDIO] SEC-15: secure_password_change deshabilitado

- **Archivo:** `supabase/config.toml`, línea 207
- **Descripción:** Cambio de contraseña sin reautenticarse — sesión comprometida = cuenta perdida.
- **Fix:** `secure_password_change = true`

### [BAJO] SEC-16 a SEC-19: Menor importancia

- Webhook no filtrado por middleware (mitigado por firma Stripe)
- Middleware no cubre `/api/*`
- `console.error` expone datos en logs de producción
- Error messages de Stripe exponen detalles internos

### ✅ Aspectos correctos

- JWT verificado en todos los Route Handlers (no del body)
- RLS habilitado y correcto en todas las tablas principales
- Firma de webhook Stripe correctamente implementada
- `SECURITY DEFINER SET search_path` en funciones PL/pgSQL
- Storage RLS para avatars bien implementado
- Compresión de imágenes client-side en flujo normal

---

## SECCIÓN 2 — CÓDIGO Y ARQUITECTURA

### [CRÍTICO] ARQ-01: Onboarding web/móvil incompatible

- **Web:** `src/app/onboarding/page.tsx` usa `complete_onboarding_atomic` RPC, guarda ~30 campos de `user_context`, escribe `goal_kcal`, `macro_protein_g`, etc. en `user_tdee_state`.
- **Móvil:** `Nutria/src/features/onboarding/submitOnboarding.ts` hace inserts individuales sin RPC atómica, NO guarda `user_context`, escribe `current_tdee_kcal`, `current_bmr_kcal`, `initial_tdee_kcal` (columnas distintas).
- **Impacto:** Un usuario que haga onboarding en móvil verá 2000 kcal hardcoded en la web porque `goal_kcal` no existe en su fila.
- **Fix:** Unificar ambos onboardings para usar la misma RPC y escribir las mismas columnas.

### [CRÍTICO] ARQ-02: TDEE calculado diferente en web vs móvil

- **Web:** `src/hooks/useTdeeState.ts` lee `goal_kcal` directamente de la BD.
- **Móvil:** `Nutria/src/features/tdee/useTdeeState.ts` lee `current_tdee_kcal` y recalcula `goal_kcal` en el cliente con `getCalorieGoal()`.
- **Impacto:** Mismo usuario ve objetivos distintos según plataforma.
- **Fix:** Decidir una fuente de verdad y que ambas plataformas la lean igual.

### [CRÍTICO] ARQ-03: Schema mismatch en user_tdee_state

- **Web espera:** `goal_kcal`, `macro_protein_g`, `macro_carbs_g`, `macro_fat_g`
- **Móvil escribe:** `current_tdee_kcal`, `current_bmr_kcal`, `initial_tdee_kcal`
- **Fix:** Alinear columnas escritas por ambas plataformas.

### [CRÍTICO] ARQ-04: Calorie goal mínimo diferente por sexo

- **Web:** `src/lib/calculations.ts` línea 73: `Math.max(1200, tdee - 500)` — 1200 para todos.
- **Móvil:** `Nutria/src/features/tdee/algorithm.ts` línea 37: 1500 hombres / 1200 mujeres.
- **Impacto:** Discrepancia de 200 kcal para usuarios masculinos en pérdida de peso.
- **Fix:** Adoptar el mínimo diferenciado por sexo del móvil en la web también.

### [ALTO] ARQ-05: Toggle día completo sin revert on error

- **Archivo:** `src/app/(app)/dashboard/page.tsx`, líneas 367-375
- **Descripción:** Estado local se actualiza optimistamente pero no se revierte si el upsert falla.
- **Fix:** Añadir `try/catch` que revierta `setIsLoggingComplete`.

### [ALTO] ARQ-06: `today` stale si el usuario deja el tab abierto

- **Archivo:** `src/app/(app)/dashboard/page.tsx`, línea 53
- **Descripción:** `const today = getTodayISO()` se calcula al montar. Si el usuario no recarga a medianoche, ve datos del día anterior.
- **Fix:** Recalcular en `visibilitychange` o con un intervalo.

### [ALTO] ARQ-07: Food search hardcoded a 'ES' en web

- **Archivo:** `src/hooks/useFoodSearch.ts`, línea 17
- **Descripción:** `country: 'ES'` hardcoded. El móvil recibe `countryCode` como parámetro correctamente.
- **Fix:** Obtener `countryCode` del perfil del usuario.

### [ALTO] ARQ-08: Racha calculada de 3 formas diferentes

- Dashboard web: cuenta desde ayer hacia atrás (hoy no cuenta)
- `useStreakDays`: empieza desde hoy si está completo
- Móvil stats: `latestSnapshot?.complete_days` (días completos de la última semana)
- **Fix:** Centralizar en un único hook.

### [ALTO] ARQ-09: Límite de fotos premium diferente y no persistido en móvil

- **Web:** 3 fotos/día, contador en `localStorage`
- **Móvil:** 5 fotos/día, contador en memoria Zustand (se pierde al cerrar la app)
- **Fix:** Unificar límite y mover el conteo al servidor (BD).

### [ALTO] ARQ-10: Agua — modelo single-row (web) vs multi-row (móvil)

- **Web:** `maybeSingle()` — asume un único registro por día
- **Móvil:** Lee todos los registros y los suma
- **Impacto:** Se corrompen mutuamente los datos de agua.
- **Fix:** Decidir un modelo y aplicarlo en ambas plataformas.

### [ALTO] ARQ-11: Dashboard web sin manejo de errores en queries Supabase

- **Archivo:** `src/app/(app)/dashboard/page.tsx`, líneas 107-153
- **Descripción:** Las 3 queries de `loadDailyData` ignoran silenciosamente los errores. El usuario ve un dashboard vacío sin feedback.
- **Fix:** Verificar `error` en cada query y mostrar toast/banner.

### [ALTO] ARQ-12: Web log weight no invoca `tdee-update`

- **Archivo:** `src/app/(app)/settings/page.tsx`, líneas 356-374
- **Descripción:** Registrar peso en web solo inserta en `weight_entries`. El móvil además invoca `supabase.functions.invoke("tdee-update")`.
- **Impacto:** El algoritmo adaptativo de TDEE solo funciona desde móvil.
- **Fix:** Invocar `tdee-update` después de guardar el peso en la web.

### [ALTO] ARQ-13: TCA screening — valores incompatibles entre plataformas

- **Web:** `'yes'` / `'no'` / `'prefer_not_to_say'`
- **Móvil:** escala de 5 puntos (`'very_positive'`, `'positive'`, `'neutral'`, `'complicated'`, `'prefer_not_to_say'`)
- **Fix:** Unificar el screening TCA en ambas plataformas.

### [MEDIO] ARQ-14: Race condition OAuth en onboarding web

- **Archivo:** `src/app/onboarding/page.tsx`, líneas 263-312
- **Descripción:** `submitOnboardingData` puede ejecutarse dos veces (desde `getUser()` y `onAuthStateChange` simultáneamente).
- **Fix:** Usar solo `onAuthStateChange` como mecanismo de detección, o mover el flag `submitted` a una ref que se setee antes de llamar a la función.

### [MEDIO] ARQ-15: Fibra hardcoded a 25g como meta

- **Archivo:** `src/app/(app)/dashboard/page.tsx`, línea 204
- **Fix:** Calcular según `biological_sex` del perfil (25g mujeres, 38g hombres).

### [MEDIO] ARQ-16: Fallback de macros hardcoded en móvil

- **Archivo:** `Nutria/src/app/(tabs)/index.tsx`, líneas 232-236
- **Descripción:** `macro_targets ?? { protein_g: 150, carbs_g: 200, fat_g: 67 }` — valores arbitrarios mostrados como objetivos personalizados.
- **Fix:** Mostrar estado vacío o banner "completa el onboarding".

### [MEDIO] ARQ-17: Fallback de goalKcal a 2000 en múltiples lugares

- **Archivos:** `src/app/(app)/stats/page.tsx` línea 70, `Nutria/src/app/(tabs)/index.tsx` línea 231, `Nutria/src/app/(tabs)/stats.tsx` línea 352
- **Fix:** Condicionar el render del gráfico a que `tdee` no sea null.

### [MEDIO] ARQ-18: `premiumStore` web — `loadPhotoCount()` en SSR

- **Archivo:** `src/stores/premiumStore.ts`, línea 40
- **Descripción:** El conteo de fotos queda en 0 si el módulo se importa primero en SSR.
- **Fix:** Llamar a `checkAndResetDailyPhotos()` al montar el componente consumidor.

### [MEDIO] ARQ-19: Marcar día completo — payload diferente web vs móvil

- **Descripción:** El móvil guarda además `total_calories`, `total_protein_g`, etc. La web no. Los weekly snapshots que dependan de esos totales estarán incompletos para usuarios web.
- **Fix:** Incluir los totales del día en el upsert de la web.

### [MEDIO] ARQ-20: 9 componentes/hooks Expo con solo `// TODO: implementar`

- `CameraCapture.tsx`, `useBarcodeScan.ts`, `LoggingFAB.tsx`, `ServingPicker.tsx`, `MacroBreakdown.tsx`, `ConfidenceBadge.tsx`, `DailySummaryBar.tsx`, `DayCompleteToggle.tsx`, `useDailySummary.ts`
- **Fix:** Implementar stubs funcionales o eliminar.

### [MEDIO] ARQ-21: Validación de edad solo por año en onboarding

- **Archivo:** `src/app/onboarding/page.tsx`, línea 375
- **Fix:** Usar `calculateAge()` de `calculations.ts` que considera mes y día.

### [ALTO] ARQ-22: `handleSaveGoals` en settings escribe columnas que el móvil no lee

- **Archivo:** `src/app/(app)/settings/page.tsx`, líneas 377-398
- **Descripción:** Escribe `goal_kcal`, `macro_protein_g`, etc. El móvil lee `current_tdee_kcal`. Los cambios en settings web no se reflejan en móvil.
- **Fix:** Alinear columnas entre plataformas.

---

## SECCIÓN 3 — PERFORMANCE Y BASE DE DATOS

### [CRÍTICO] PERF-01: Índices DB faltantes en todas las tablas core

Sin índices, las queries hacen sequential scans. Para un usuario con 1000 entradas en una tabla de 100K filas: 50ms → 2ms por query. El dashboard hace 3+ queries a `food_log_entries`.

```sql
-- food_log_entries: tabla más consultada del proyecto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_food_log_entries_user_date
  ON food_log_entries (user_id, log_date)
  WHERE deleted_at IS NULL;

-- daily_log_status: dashboard + streak
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_log_status_user_date
  ON daily_log_status (user_id, log_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_log_status_user_complete
  ON daily_log_status (user_id, log_date DESC)
  WHERE is_day_complete = true;

-- water_log: dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_water_log_user_date
  ON water_log (user_id, log_date);

-- weight_entries: useWeightHistory
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weight_entries_user_recorded
  ON weight_entries (user_id, recorded_at ASC);

-- user_tdee_state
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tdee_state_user
  ON user_tdee_state (user_id);

-- tdee_weekly_snapshots
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tdee_weekly_snapshots_user_week
  ON tdee_weekly_snapshots (user_id, week_start DESC);

-- psychological_flags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_psychological_flags_user_detected
  ON psychological_flags (user_id, detected_at DESC);

-- psychological_responses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_psychological_responses_user_dismissed
  ON psychological_responses (user_id)
  WHERE dismissed_at IS NOT NULL;

-- user_context
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_user_context_user
  ON user_context (user_id);
```

**Impacto estimado:** -150ms por page load, -80% carga en BD.

### [CRÍTICO] PERF-02: Dashboard — 3 queries secuenciales + waterfall de userId

- **Archivo:** `src/app/(app)/dashboard/page.tsx`, líneas 60-153
- **Descripción:**
  1. `useEffect` obtiene `userId` vía `getUser()` (~100ms)
  2. Eso habilita otro `useEffect` con 3 queries secuenciales: `food_log_entries`, `daily_log_status`, `water_log` (~300ms)
  3. Total waterfall inevitable: ~400ms antes de ver datos
- **Fix:** Paralelizar las 3 queries con `Promise.all`, y eliminar el useEffect de userId usando `useProfile().data?.id` directamente.

### [CRÍTICO] PERF-03: psych-detector cron — N usuarios × 5 queries secuenciales

- **Archivo:** `supabase/functions/psych-detector/index.ts`, líneas 401-411
- **Descripción:** For loop secuencial sobre usuarios. Cada usuario: 5 queries secuenciales. Con 200+ usuarios supera el timeout de Edge Functions (30s).
- **Fix:** Procesar en batches de 10 con `Promise.allSettled`. Para la query de usuarios activos, usar RPC con `SELECT DISTINCT` en lugar de traer millones de filas.

### [ALTO] PERF-04: Dashboard web sin TanStack Query — sin cache

- **Descripción:** Dashboard usa `useState + useEffect` mientras el móvil usa TanStack Query. Cada visita al dashboard (tab switch, back navigation) recarga todo desde cero.
- **Impacto:** -500ms en cada navegación de vuelta al dashboard (3+ veces/día).
- **Fix:** Migrar a hooks TanStack Query similares a los del móvil.

### [ALTO] PERF-05: `useManualLog` invalida query keys inexistentes

- **Archivo:** `src/hooks/useManualLog.ts`, líneas 76-78
- **Descripción:** Invalida `['daily-log']` y `['dashboard']` que no existen en ningún hook. Después de registrar manualmente una comida, el dashboard NO se refresca.
- **Fix:** Invalidar `['todayTotals']`, `['macroAverages']`.

### [ALTO] PERF-06: `useTodayTotals` con `refetchInterval: 60s`

- **Archivo:** `src/hooks/useTodayTotals.ts`, líneas 43-44
- **Descripción:** Polling cada 60 segundos aunque el usuario no haga nada. ~1440 queries/día/usuario solo para totals.
- **Fix:** Eliminar `refetchInterval`. Invalidar la query al registrar comida.

### [ALTO] PERF-07: `<img>` nativo en plans/[planId]

- **Archivo:** `src/app/(app)/plans/[planId]/page.tsx`, línea 325
- **Descripción:** Bypasea toda la optimización de Next.js para imágenes de recetas.
- **Impacto:** 5-10s de carga en móvil para imágenes de 1-2MB.
- **Fix:** Usar `next/image` y añadir hostname de Spoonacular a `next.config.ts`.

### [MEDIO] PERF-08: useMacroAverages — 2 queries a la misma tabla

- **Archivo:** `src/hooks/useMacroAverages.ts`, líneas 29-67
- **Fix:** Añadir `log_date` al select de la primera query. Eliminar la segunda query completamente.

### [MEDIO] PERF-09: Queries de auth duplicadas en dashboard y stats

- **Archivos:** `src/app/(app)/dashboard/page.tsx` línea 61, `src/app/(app)/stats/page.tsx` líneas 40-56
- **Descripción:** Cada página llama a `getUser()` manualmente mientras `useProfile()` ya lo hace internamente con cache.
- **Fix:** Usar `useProfile().data?.id` en lugar de `getUser()` manual.

### [MEDIO] PERF-10: psych-detector — food_log_entries consultada 3 veces por usuario

- **Archivo:** `supabase/functions/psych-detector/index.ts`, líneas 105-191
- **Fix:** Unificar en una sola query de 21 días con `custom_description`. Derivar el subset de 14 días en memoria.

### [MEDIO] PERF-11: psych-detector — query usuarios activos sin DISTINCT

- **Archivo:** `supabase/functions/psych-detector/index.ts`, líneas 385-389
- **Descripción:** `select('user_id')` sin DISTINCT. Con 1000 usuarios × 20 entradas/día × 30 días = 600K filas transferidas para obtener ~1000 user_ids.
- **Fix:** Crear RPC `get_active_user_ids(since DATE)` con `SELECT DISTINCT`.

### [MEDIO] PERF-12: recharts sin lazy loading

- **Archivos:** `src/components/stats/WeightChart.tsx`, `src/components/stats/CalorieChart.tsx`
- **Descripción:** ~300KB gzipped incluidos en el bundle de todas las páginas.
- **Fix:** `dynamic(() => import(...), { ssr: false })`.

### [MEDIO] PERF-13: useTdeeAdjustment — 3ª query secuencial innecesaria

- **Archivo:** `src/hooks/useTdeeAdjustment.ts`, líneas 22-39
- **Fix:** Incluir la 3ª query en el mismo `Promise.all` con las dos primeras.

### [MEDIO] PERF-14: WaterTracker web — SELECT + write en lugar de upsert

- **Archivo:** `src/components/dashboard/WaterTracker.tsx`, líneas 32-47
- **Fix:** `supabase.from('water_log').upsert({...}, { onConflict: 'user_id,log_date' })`.

### [BAJO] PERF-15 a PERF-20: Menor importancia

- `select('*')` en múltiples hooks: `useProfile`, `useTdeeState`, `usePsychFlag`, `useWeeklySnapshots`, `daily_log_status`, `meal_plans`
- `createClient()` llamado múltiples veces por render en dashboard
- `usePremiumStatus`: `createClient()` fuera del queryFn
- Re-renders por funciones inline en dashboard (recomendado: `useCallback`)
- `totals` recalculado sin `useMemo` en dashboard
- `sharp` en `devDependencies` en lugar de `dependencies`
- Fonts: 3 familias Google Fonts con demasiados weights
- Deno std@0.168.0 (2022) en las dos Edge Functions

---

## Plan de Trabajo Recomendado

### Sprint 0 — Urgente (esta semana)
| Issue | Estimación |
|-------|------------|
| SEC-01: Eliminar aiprime.store → llamar a Anthropic directamente | 1h |
| SEC-02: Rate limiting en /api/ai-log | 3h |
| SEC-03: Restringir CORS en Edge Functions | 1h |
| SEC-06: Security headers en next.config.ts | 1h |
| SEC-08: Habilitar confirmación de email | 30min |
| PERF-01: Crear migración con índices DB | 2h |
| PERF-05: Corregir query keys en useManualLog | 30min |
| PERF-06: Eliminar refetchInterval en useTodayTotals | 30min |

### Sprint 1 — Antes del lanzamiento
| Issue | Estimación |
|-------|------------|
| ARQ-01/02/03: Unificar onboarding y schema TDEE web/móvil | 8h |
| ARQ-04: Alinear calorie goal mínimo por sexo | 1h |
| ARQ-10: Unificar modelo de datos de agua | 2h |
| ARQ-12: Invocar tdee-update al registrar peso en web | 1h |
| PERF-02: Paralelizar queries dashboard + eliminar waterfall userId | 3h |
| PERF-03: Batches en psych-detector cron | 3h |
| PERF-07: Reemplazar `<img>` por `next/image` en plans | 1h |
| SEC-05: CRON_SECRET dedicado en psych-detector | 1h |
| SEC-11: Migración bucket food-photos con RLS | 1h |

### Sprint 2 — Post-lanzamiento
| Issue | Estimación |
|-------|------------|
| ARQ-08: Centralizar cálculo de racha | 2h |
| ARQ-09: Unificar límite de fotos y mover conteo al servidor | 3h |
| PERF-04: Migrar dashboard web a TanStack Query | 4h |
| PERF-08: useMacroAverages — eliminar query duplicada | 1h |
| PERF-12: recharts con lazy loading | 1h |
| SEC-07: Política de contraseñas + CAPTCHA | 1h |
| SEC-14/15: MFA + secure_password_change | 1h |
| ARQ-20: Implementar TODOs móvil o eliminarlos | 4h |

---

*Generado por 3 agentes Claude Opus 4.6 en paralelo el 2026-04-10.*
*Workspace activo: `/Users/alex/Documents/GitHub/Nutria`*
*Proyecto Supabase: `lslqqmfflmfjlzmneqof`*
