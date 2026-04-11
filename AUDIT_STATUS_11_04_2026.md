# Estado de la auditoría — Nutria — 2026-04-11

> Generado a partir de la auditoría original `AUDITORIA_COMPLETA_10_04_2026.md`.
> Refleja el estado real del código en el repo raíz Next.js/Supabase a fecha 11/04/2026.
> El repo móvil anidado (`Nutria/`) NO está incluido en este análisis.

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
| ARQ-04 | `calculateCalorieGoal`: `male → 1500 kcal`, `female → 1200 kcal` en `calculations.ts` |
| ARQ-05 | Toggle día completo: revert correcto en caso de error en dashboard |
| ARQ-06 | `currentDate` se recalcula en `visibilitychange` + intervalo de 60s |
| ARQ-07 | `useFoodSearch` usa `profile?.country_code ?? 'ES'` — no hardcoded |
| ARQ-09 | Quota de fotos enforced server-side (`enforcePhotoQuota`) en ambos endpoints |
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

### PERF-02 — Dashboard: waterfall userId + 3 queries secuenciales
- **Archivo:** `src/app/(app)/dashboard/page.tsx` líneas 62-136
- **Estado:** Pendiente total. Flujo actual:
  1. `useEffect` → `supabase.auth.getUser()` → `setUserId` (~100ms)
  2. Segundo `useEffect` (espera userId) → 3 queries secuenciales: `food_log_entries` → `daily_log_status` → `water_log`
- **Fix:** (1) Reemplazar `getUser()` manual por `useProfile().data?.id`. (2) Envolver las 3 queries en `Promise.all([...])`.
- **Riesgo:** +300-400ms de latencia visible en cada visita al dashboard.
- **Estimación:** 2h

---

## 🟠 PENDIENTES ALTOS

### ARQ-11 — Dashboard: errores silenciosos en las 3 queries
- **Archivo:** `src/app/(app)/dashboard/page.tsx` líneas 99-131
- **Estado:** Pendiente. Las 3 queries ignoran `error` completamente. Dashboard vacío sin feedback si falla la BD.
- **Fix:** Desestructurar `error` en cada query + mostrar toast/banner si alguna falla.
- **Estimación:** 45min

### ~~PERF-03~~ — psych-detector: 5 queries secuenciales por usuario ✅ PARCIALMENTE RESUELTO
- **Archivo:** `supabase/functions/psych-detector/index.ts`
- **Estado:** Las 5 queries dentro de `detectFlagsForUser` ahora corren en paralelo con `Promise.all` ✅. Batching de 10 usuarios con `Promise.allSettled` ya existía ✅.
- **Riesgo residual:** La query de usuarios activos en modo cron (`SELECT user_id FROM food_log_entries`) no usa `DISTINCT` a nivel SQL — la deduplicación sigue siendo en JS. Con muchos usuarios activos puede transferir muchas filas duplicadas. Fix requiere RPC `get_active_user_ids(since DATE)` con `SELECT DISTINCT user_id` → **necesita migración SQL, pendiente**.

### PERF-04 — Dashboard web: sin TanStack Query
- **Archivo:** `src/app/(app)/dashboard/page.tsx`
- **Estado:** Pendiente. Dashboard usa `useState + useEffect` manual; no hay caché entre navegaciones.
- **Fix:** Migrar `loadDailyData` a hook TanStack Query con `staleTime: 30_000`.
- **Riesgo:** 3 requests a Supabase en cada tab-switch (3-5 veces/día por usuario).
- **Estimación:** 3h (depende de PERF-02)

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

### ~~SEC-11~~ — Bucket food-photos sin RLS ✅ RESUELTO
- **Archivo:** `supabase/migrations/20260413_add_food_photos_bucket.sql` (pendiente de aplicar en remoto)
- **Estado:** Fix preparado. La migración deja el bucket como **privado** (`public = false`) y añade políticas RLS para SELECT / INSERT / DELETE con `auth.uid()::text = (storage.foldername(name))[1]`. Idempotente.
- **Riesgo residual:** `src/hooks/usePhotoUpload.ts` llama a `getPublicUrl()` (línea 94). En bucket privado esa URL no es accesible directamente — habrá que migrar a `createSignedUrl()` para que las fotos se muestren. Ese cambio requiere tocar `usePhotoUpload.ts` (no incluido aquí).

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

## Plan de ejecución — por bloques de impacto

### Bloque A — Quick wins (<2h total)
1. Bloque A ya cerrado en código. Solo queda confirmar que `SEC-07/08` también están reflejados en Supabase Dashboard remoto si el entorno no se sincroniza desde `config.toml`.

### Bloque B — Seguridad restante (2-3h)
8. **SEC-11** (1h): Migración bucket food-photos + RLS
9. **PERF-01** ya cerrado

### Bloque C — Performance dashboard (4-5h)
10. **PERF-02** (2h): Eliminar waterfall userId + paralelizar 3 queries
11. **ARQ-11** (45min): Error handling en las 3 queries del dashboard
12. **PERF-04** (3h): Migrar dashboard a TanStack Query

### Bloque D — Edge Functions (2h)
13. **PERF-03** (2h): Paralelizar queries en `detectFlagsForUser` + DISTINCT en query de usuarios activos

### Bloque E — UI (30min)
14. **PERF-07** (30min): `<img>` → `next/image` en `plans/[planId]/page.tsx`

---

*Análisis generado el 2026-04-11 y actualizado tras los commits `50d50e2` y `87208d8`.*
*Workspace: `/Users/alex/Documents/GitHub/Nutria`*
*Proyecto Supabase: `lslqqmfflmfjlzmneqof`*
