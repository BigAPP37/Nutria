# Estado de la auditoría — Nutria — 2026-04-11

> Generado a partir de la auditoría original `AUDITORIA_COMPLETA_10_04_2026.md`.
> Última actualización: 2026-04-11 — incluye verificación de código móvil (`Nutria/`).

---

## ✅ Ya resueltos

| ID | Lo que se hizo |
|----|----------------|
| SEC-01 | `api.anthropic.com` en ambas funciones (Edge + Route Handler) |
| SEC-02 | Rate limiting Upstash + fallback in-memory en `ai-log` (web y Edge) |
| SEC-03 | CORS: `allowedOrigins` whitelist en `ai-log` y `psych-detector` |
| SEC-04 | Validación: whitelist `meal_type`, regex `^[A-Z]{2}$` para `country_code`, límite payload |
| SEC-05 | `CRON_SECRET` dedicado en `psych-detector` — no se compara con `service_role_key` |
| SEC-06 | Security headers completos en `next.config.ts` (CSP, HSTS, X-Frame-Options, etc.) |
| SEC-09 | Idempotencia Stripe: tabla `stripe_events` + `claimEvent()` + migración `20260412_add_stripe_events.sql` |
| SEC-10 | URLs de Stripe usan `APP_URL` env var, no `request.headers.get('origin')` |
| SEC-12 | Límite 2MB para fotos base64 + `estimateBase64Bytes()` en ambos endpoints |
| SEC-13 | `log_date` validado con regex + ventana de últimos 7 días |
| SEC-07 | `supabase/config.toml`: `minimum_password_length = 8` + `password_requirements = "lower_upper_letters_digits"` |
| SEC-08 | `supabase/config.toml`: `enable_confirmations = true` |
| ARQ-01 | Onboarding móvil usa `complete_onboarding_atomic` RPC — misma que web |
| ARQ-02 | Ambas plataformas leen `goal_kcal` de BD como fuente de verdad |
| ARQ-03 | Schema alineado: RPC escribe `goal_kcal`, `macro_protein_g`, etc. en ambas plataformas |
| ARQ-04 | `calculateCalorieGoal`: `male → 1500 kcal`, `female → 1200 kcal` en web y móvil |
| ARQ-05 | Toggle día completo: revert correcto en caso de error en dashboard |
| ARQ-06 | `currentDate` se recalcula en `visibilitychange` + intervalo de 60s |
| ARQ-07 | `useFoodSearch` usa `profile?.country_code ?? 'ES'` — no hardcoded |
| ARQ-09 | Quota de fotos enforced server-side (`enforcePhotoQuota`) en ambos endpoints |
| ARQ-10 | Agua: ambas plataformas leen sumando todas las filas; modelos de escritura compatibles |
| ARQ-12 | Settings invoca `supabase.functions.invoke('tdee-update')` tras guardar peso |
| ARQ-15 | Dashboard usa objetivo de fibra por sexo (`male 38g`, resto 25g) |
| ARQ-19 | `daily_log_status` persiste totales y `meal_count` al marcar día completo |
| PERF-05 | `useManualLog` invalida `['todayTotals']` |
| PERF-06 | `useTodayTotals` sin `refetchInterval` |
| PERF-07 | `plans/[planId]` usa `next/image` |
| PERF-08 | `useMacroAverages` elimina la segunda query y reutiliza `log_date` |
| PERF-12 | `stats/page.tsx` carga `WeightChart` y `CalorieChart` con `dynamic(..., { ssr: false })` |

---

## 🔴 PENDIENTES CRÍTICOS

### ~~PERF-01~~ — Índices DB faltantes ✅ RESUELTO
- **Archivo:** `supabase/migrations/20260411_add_core_indexes.sql` (creado)
- **Estado:** Cerrado. Los 9 índices core quedaron confirmados en la BD remota. La migración los registra formalmente con `IF NOT EXISTS` (idempotente). **Añadido bonus:** `idx_user_profiles_stripe_customer`.

### ~~PERF-02~~ — Dashboard: waterfall userId + 3 queries secuenciales ✅ PARCIALMENTE RESUELTO
- **Archivo:** `src/app/(app)/dashboard/page.tsx`
- **Estado:** El waterfall por `getUser()` ya no existe — el dashboard usa `profile?.id` directamente (línea 43). Las 3 queries ya están paralelizadas con `Promise.all` (línea 86). **Lo que falta:** el dashboard todavía no consume `useDashboardData` (el hook TanStack Query ya existe en `src/hooks/useDashboardData.ts`) — la carga sigue siendo manual en `useEffect`. Ese paso final se soluciona junto con PERF-04.
- **Riesgo residual:** sin caché entre navegaciones hasta que se integre el hook.

---

## 🟠 PENDIENTES ALTOS

### ~~ARQ-11~~ — Dashboard: errores silenciosos en las 3 queries ✅ RESUELTO
- **Archivo:** `src/app/(app)/dashboard/page.tsx` línea 121
- **Estado:** Resuelto. El código recoge `entriesError`, `statusError`, `waterError`, hace `console.error`, resetea el estado y muestra `loadError` en la UI.

### ~~PERF-03~~ — psych-detector: 5 queries secuenciales por usuario ✅ RESUELTO
- **Archivo:** `supabase/functions/psych-detector/index.ts`
- **Estado:** Resuelto. Queries en paralelo con `Promise.all` ✅. Batching con `Promise.allSettled` ✅. psych-detector ahora usa la RPC `get_active_user_ids` en modo cron — no más query directa a `food_log_entries` ni deduplicación en JS ✅. Commit: `3fb76eb`.

### ~~PERF-04~~ — Dashboard web: sin TanStack Query ✅ RESUELTO
- **Archivo:** `src/app/(app)/dashboard/page.tsx`
- **Estado:** Resuelto. `dashboard/page.tsx` consume `useDashboardData` con `staleTime: 30s`. El `useEffect` de carga manual eliminado. `reloadFoodEntries` y agua usan `queryClient.invalidateQueries`. Commit: `a34ba91`.

### ~~PERF-05~~ — useManualLog: invalida query keys inexistentes ✅ RESUELTO
- **Archivo:** `src/hooks/useManualLog.ts` líneas 77-78
- **Estado:** Resuelto. Ahora invalida `['todayTotals']`.

### ~~PERF-06~~ — useTodayTotals: polling cada 60s ✅ RESUELTO
- **Archivo:** `src/hooks/useTodayTotals.ts` línea 44
- **Estado:** Resuelto. Se eliminó `refetchInterval`.

### ~~PERF-07~~ — `<img>` nativo en plans/[planId] ✅ RESUELTO
- **Archivo:** `src/app/(app)/plans/[planId]/page.tsx` línea 325
- **Estado:** Resuelto. Se sustituyó por `next/image`.

---

## 🟡 PENDIENTES MEDIOS

### ~~SEC-07~~ — Política de contraseñas débil ✅ RESUELTO EN CONFIG
- **Archivo:** `supabase/config.toml` líneas 171-174
- **Estado:** Resuelto en `supabase/config.toml`. Confirmar también en Supabase Dashboard remoto si no se sincroniza automáticamente.

### ~~SEC-08~~ — Confirmación de email deshabilitada ✅ RESUELTO EN CONFIG
- **Archivo:** `supabase/config.toml` línea 205
- **Estado:** Resuelto en `supabase/config.toml`. Confirmar también en Supabase Dashboard remoto si no se sincroniza automáticamente.

### ~~SEC-11~~ — Bucket food-photos sin RLS ✅ RESUELTO EN CÓDIGO
- **Archivo:** `supabase/migrations/20260413_add_food_photos_bucket.sql`
- **Estado:** Migración aplicada en Supabase ✅. Bucket privado con RLS ✅. `src/hooks/usePhotoUpload.ts` ya usa `createSignedUrl()` (línea 91) — no `getPublicUrl()` ✅.
- **Riesgo residual:** ninguno en código. Confirmar visualmente en Supabase Dashboard que el bucket `food-photos` aparece como privado.

### ~~ARQ-15~~ — Fibra hardcoded a 25g ✅ RESUELTO
- **Archivo:** `src/app/(app)/dashboard/page.tsx` línea 188
- **Estado:** Resuelto. Dashboard usa objetivo por sexo.

### ~~ARQ-19~~ — Day complete: payload sin totales ✅ RESUELTO
- **Archivo:** `src/app/(app)/dashboard/page.tsx` líneas 356-359
- **Estado:** Resuelto. El upsert incluye macros, calorías y `meal_count`.

### ~~PERF-08~~ — useMacroAverages: 2 queries a la misma tabla ✅ RESUELTO
- **Archivo:** `src/hooks/useMacroAverages.ts` líneas 29-65
- **Estado:** Resuelto. La primera query ya incluye `log_date` y se eliminó la segunda.

### ~~PERF-12~~ — recharts sin lazy loading ✅ RESUELTO
- **Archivos:** `src/components/stats/WeightChart.tsx`, `src/components/stats/CalorieChart.tsx`
- **Estado:** Resuelto en `stats/page.tsx`.

---

## Plan de ejecución — pendientes reales

### ~~1. PERF-04 + PERF-02~~ ✅ Cerrado — `a34ba91`
### ~~2. PERF-03~~ ✅ Cerrado — `3fb76eb`

### 3. SEC-11 (5min) — Verificar bucket food-photos en Supabase Dashboard
- Confirmar visualmente que el bucket aparece como privado en `lslqqmfflmfjlzmneqof`.

---

## ✅ Auditoría completada
Todos los issues de la auditoría 10/04/2026 están cerrados excepto SEC-11 (verificación visual, sin cambios de código).

---

*Análisis generado el 2026-04-11 y actualizado el 2026-04-11 con correcciones de Codex + Claude.*
*Workspace: `/Users/alex/Documents/GitHub/Nutria`*
*Proyecto Supabase: `lslqqmfflmfjlzmneqof`*
