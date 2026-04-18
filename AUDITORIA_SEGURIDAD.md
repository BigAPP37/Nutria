# Auditoria de Seguridad - Nutria (nutriapro.es) - Bloque 1

**Fecha:** 2026-04-15  
**Workspace auditado:** `/Users/alex/Documents/GitHub/Nutria`  
**Stack declarado:** Next.js App Router + Supabase + Vercel + Stripe  
**Proyecto Supabase pedido:** `goanhievycvklsvnsbks`

**Nota de alcance:** la auditoria se hizo sobre el codigo local del repo. No se hicieron cambios de producto. No se pudo verificar el estado remoto real de RLS en Supabase Dashboard desde este entorno; por tanto, los hallazgos de RLS se basan en migraciones, schemas y configuracion versionada.

---

## [CRÍTICO] - `tdee-update` permite recalcular datos de cualquier usuario sin validar JWT
- **Archivo:** `Nutria/supabase/functions/tdee-update/index.ts` (linea 53)
- **Problema:** la funcion acepta cualquier `POST`, crea un cliente con `SUPABASE_SERVICE_ROLE_KEY` y procesa `body.user_id` directamente. No lee `Authorization`, no llama a `supabase.auth.getUser()`, no valida `CRON_SECRET` para modo cron y ademas expone CORS con `Access-Control-Allow-Origin: "*"` en lineas 55-62.
- **Riesgo:** cualquier cliente que conozca la URL de la Edge Function podria recalcular o generar snapshots TDEE para cualquier `user_id`, o disparar el proceso masivo de todos los usuarios. Como usa `service_role`, la funcion bypassa RLS y el atacante no necesita ser el propietario del usuario afectado.
- **Fix:** separar modo usuario y modo cron. Para modo usuario, usar JWT y derivar el usuario desde `getUser()`. Para modo cron, exigir `CRON_SECRET`.

```ts
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return jsonResponse({ error: "No autorizado" }, 401);
}

const token = authHeader.slice(7);
const isCron = CRON_SECRET && token === CRON_SECRET;

let targetUserId: string | null = null;
if (!isCron) {
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return jsonResponse({ error: "Token invalido" }, 401);
  targetUserId = user.id;
}

// No aceptar body.user_id para modo usuario.
if (targetUserId) {
  const result = await processUser(adminSupabase, targetUserId, weekStart, weekEnd);
  return jsonResponse({ success: true, result });
}
```

---

## [CRÍTICO] - Edge Function legacy `ai-log` movil confia en `user_id` enviado por el cliente
- **Archivo:** `Nutria/supabase/functions/ai-log/index.ts` (linea 653)
- **Problema:** la funcion parsea `user_id` desde el body y usa `SUPABASE_SERVICE_ROLE_KEY` para insertar logs en nombre de ese usuario. No valida `Authorization`, no llama a `supabase.auth.getUser()` y tiene CORS wildcard en lineas 635 y 816.
- **Riesgo:** si esta version legacy esta desplegada o se despliega por error, un atacante puede insertar registros de comida, consumir cuota de IA y manipular historiales nutricionales de cualquier usuario conociendo su UUID.
- **Fix:** portar el patron seguro ya usado en `supabase/functions/ai-log/index.ts`: usar `SUPABASE_ANON_KEY` con el JWT del usuario, llamar a `auth.getUser()`, ignorar `body.user_id` y escribir siempre `user_id: user.id`.

```ts
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return jsonResponse({ error: "No autorizado" }, 401);
}

const jwt = authHeader.slice(7);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${jwt}` } },
});

const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return jsonResponse({ error: "Token invalido o expirado" }, 401);
}

// Eliminar user_id del contrato del body.
await insertLogEntries(supabase, user.id, meal_type, alimentos, method, photoPath, metadata);
```

---

## [CRÍTICO] - La RPC de activacion de planes premium no valida Premium en servidor
- **Archivo:** `supabase/migrations/20260409_add_atomic_onboarding_and_plan_activation.sql` (linea 275)
- **Problema:** `activate_meal_plan_atomic(p_plan_id, p_started_at)` solo comprueba que el usuario este autenticado y que el plan exista. No comprueba `meal_plans.is_premium` contra `user_profiles.is_premium`, `subscription_status` ni `premium_expires_at`. La UI bloquea en cliente con `isPremium`, pero la RPC esta concedida a todos los usuarios autenticados en linea 325.
- **Riesgo:** cualquier usuario free puede llamar directamente a `supabase.rpc('activate_meal_plan_atomic', { p_plan_id: <premium> })` desde consola o script y activar planes premium sin pasar por Stripe.
- **Fix:** mover la autorizacion premium dentro de la RPC antes del `INSERT`.

```sql
DECLARE
  v_plan_is_premium BOOLEAN;
  v_has_premium BOOLEAN;
BEGIN
  SELECT is_premium
  INTO v_plan_is_premium
  FROM public.meal_plans
  WHERE id = p_plan_id;

  IF v_plan_is_premium IS NULL THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND';
  END IF;

  SELECT
    COALESCE(is_premium, false)
    AND COALESCE(subscription_status, 'free') IN ('active', 'trialing')
    AND (premium_expires_at IS NULL OR premium_expires_at > now())
  INTO v_has_premium
  FROM public.user_profiles
  WHERE id = v_user_id;

  IF v_plan_is_premium AND NOT COALESCE(v_has_premium, false) THEN
    RAISE EXCEPTION 'PREMIUM_REQUIRED';
  END IF;
END;
```

---

## [ALTO] - `psych-detector` legacy movil permite procesar flags de cualquier usuario sin autenticacion
- **Archivo:** `Nutria/supabase/functions/psych-detector/index.ts` (linea 71)
- **Problema:** la funcion usa `SUPABASE_SERVICE_ROLE_KEY`, acepta `body.user_id` sin verificar JWT y permite modo cron sin secreto si no hay body. Tambien expone `Access-Control-Allow-Origin: "*"` en lineas 75 y 446.
- **Riesgo:** un atacante puede disparar analisis psicologicos sobre usuarios ajenos, generar flags sensibles o forzar carga masiva. El contenido toca salud mental y patrones alimentarios, por lo que el impacto de privacidad es alto.
- **Fix:** eliminar esta copia legacy o alinearla con `supabase/functions/psych-detector/index.ts`: JWT para modo usuario, `CRON_SECRET` para modo cron, CORS restringido y `user_id` derivado del token.

```ts
if (CRON_SECRET && token === CRON_SECRET) {
  isCronRequest = true;
} else {
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return json(req, { error: "Token invalido" }, 401);
  requestUserId = userData.user.id;
}
```

---

## [ALTO] - Configuracion apunta a proyectos Supabase distintos y a un hostname hardcodeado antiguo
- **Archivo:** `next.config.ts` (linea 22)
- **Problema:** el usuario pidio auditar el proyecto `goanhievycvklsvnsbks`. Sin embargo:
  - `.env` usa `EXPO_PUBLIC_SUPABASE_URL=https://goanhievycvklsvnsbks.supabase.co`.
  - `.env.local` usa `NEXT_PUBLIC_SUPABASE_URL=https://lslqqmfflmfjlzmneoqf.supabase.co` (ref distinto y aparentemente con typo).
  - `supabase/.temp/project-ref` contiene `lslqqmfflmfjlzmneqof`.
  - `next.config.ts` hardcodea `https://lslqqmfflmfjlzmneqof.supabase.co` en CSP e imagenes.
- **Riesgo:** se pueden aplicar migraciones/RLS a un proyecto y desplegar la app contra otro. En seguridad esto es grave: la auditoria puede dar por protegido un entorno mientras produccion usa otro con politicas diferentes. Ademas, CSP/Next Image puede bloquear assets legitimos del proyecto correcto o permitir solo el proyecto equivocado.
- **Fix:** unificar un unico project ref y eliminar hostnames Supabase hardcodeados.

```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";

const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `connect-src 'self' ${supabaseOrigin}`,
].join("; ");

images: {
  remotePatterns: supabaseUrl ? [{
    protocol: "https",
    hostname: new URL(supabaseUrl).hostname,
    pathname: "/storage/v1/object/**",
  }] : [],
}
```

Tambien ejecutar:

```bash
supabase link --project-ref goanhievycvklsvnsbks
```

---

## [ALTO] - Datos sensibles del onboarding quedan persistidos en `localStorage` antes de crear cuenta
- **Archivo:** `src/stores/onboardingStore.ts` (linea 199)
- **Problema:** el store del onboarding usa `persist(..., { name: 'nutria-onboarding' })`, que por defecto guarda en `localStorage`. El objeto incluye peso, altura, fecha de nacimiento, sexo biologico, relacion con comida, estres, sueno, alergias y screening TCA (`tca_answer`, `tca_flagged`) antes de que el usuario cree cuenta.
- **Riesgo:** cualquier XSS, extension de navegador, usuario compartido del dispositivo o backup local puede leer datos de salud altamente sensibles. Tambien contradice el objetivo de registro diferido: la app evita enviar datos al servidor antes de la cuenta, pero los deja persistidos en claro en el navegador.
- **Fix:** no persistir campos sensibles en `localStorage`. Usar `sessionStorage` con expiracion corta o persistir solo progreso no sensible. Minimo:

```ts
import { createJSONStorage, persist } from "zustand/middleware";

persist(
  (set) => ({ ... }),
  {
    name: "nutria-onboarding",
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({
      currentScreen: state.currentScreen,
      data: {
        country: state.data.country,
        units_weight: state.data.units_weight,
        units_energy: state.data.units_energy,
      },
    }),
  }
)
```

---

## [ALTO] - CSP permite `unsafe-inline` y `unsafe-eval` en scripts
- **Archivo:** `next.config.ts` (linea 20)
- **Problema:** la politica `script-src 'self' 'unsafe-inline' 'unsafe-eval'` reduce mucho la proteccion de CSP. Si aparece una inyeccion HTML/JS en cualquier parte de la app, el navegador tendra menos capacidad de bloquear ejecucion de scripts.
- **Riesgo:** mayor impacto de XSS: robo de sesiones Supabase, lectura de `localStorage` del onboarding, inicio de acciones autenticadas y manipulacion de datos del usuario.
- **Fix:** separar dev/prod y quitar `unsafe-eval` en produccion. Idealmente usar nonces/hashes para inline scripts.

```ts
const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'nonce-{{nonce}}' https://js.stripe.com";
```

Si no se implementan nonces todavia, al menos eliminar `unsafe-eval` en produccion:

```ts
const scriptSrc = process.env.NODE_ENV === "production"
  ? "script-src 'self' 'unsafe-inline' https://js.stripe.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
```

---

## [MEDIO] - `psych-detector` raiz no tiene try/catch global alrededor del handler
- **Archivo:** `supabase/functions/psych-detector/index.ts` (linea 407)
- **Problema:** el handler principal no esta envuelto en `try/catch`. Hay validacion de metodo y auth, pero errores inesperados en `supabase.auth.getUser(token)`, `detectFlagsForUser()` o cualquier query fuera de ramas controladas pueden acabar como excepcion no manejada.
- **Riesgo:** respuestas 500 inconsistentes, logs con errores no normalizados y peor observabilidad. En funciones sensibles de salud mental conviene que los fallos sean controlados y no expongan detalles internos.
- **Fix:** envolver todo el cuerpo del `serve` en `try/catch` y devolver error generico.

```ts
serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: getCorsHeaders(req) });
    if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
    // resto del handler...
  } catch (err) {
    console.error("[psych-detector] Unexpected error:", err);
    return json(req, { error: "Error interno del servidor" }, 500);
  }
});
```

---

## [MEDIO] - `secure_password_change` esta desactivado
- **Archivo:** `supabase/config.toml` (linea 207)
- **Problema:** `secure_password_change = false`. El cambio de password no exige reautenticacion reciente.
- **Riesgo:** si una sesion queda comprometida en un navegador, el atacante puede cambiar la contrasena con menos friccion y tomar la cuenta.
- **Fix:** activar el control en configuracion y verificar que tambien este aplicado en el proyecto remoto.

```toml
[auth.email]
secure_password_change = true
```

---

## [MEDIO] - Endpoint publico `food-lookup` puede usarse como proxy sin autenticacion ni rate limit
- **Archivo:** `src/app/api/food-lookup/route.ts` (linea 18)
- **Problema:** `GET /api/food-lookup?barcode=...` no valida sesion y no tiene rate limiting. Aunque no accede a datos privados, hace fetch server-side a Open Food Facts con timeout de 8s.
- **Riesgo:** abuso como proxy publico, consumo de recursos serverless y degradacion de disponibilidad. En Vercel puede traducirse en coste o rate limits externos.
- **Fix:** exigir sesion Supabase o aplicar rate limit por IP antes de hacer el fetch externo.

```ts
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
```

---

## [MEDIO] - Errores de Stripe se devuelven al cliente con detalle interno
- **Archivo:** `src/app/api/stripe/checkout/route.ts` (linea 90)
- **Problema:** el catch devuelve `error.message` al cliente. Lo mismo ocurre en `src/app/api/stripe/portal/route.ts` lineas 49-51. Stripe puede incluir detalles operativos utiles para debugging pero innecesarios para usuarios finales.
- **Riesgo:** exposicion de detalles internos de integracion, IDs, configuracion o razones de fallo que facilitan enumeracion/debugging desde fuera.
- **Fix:** loguear detalle en servidor y devolver mensaje generico al cliente.

```ts
} catch (error) {
  console.error("[stripe/checkout] Error:", error);
  return NextResponse.json(
    { error: "No se pudo iniciar el checkout" },
    { status: 500 }
  );
}
```

---

## [BAJO] - La configuracion local de Supabase no incluye `nutriapro.es` en redirect URLs versionadas
- **Archivo:** `supabase/config.toml` (linea 150)
- **Problema:** `site_url` esta en `http://127.0.0.1:3000` y `additional_redirect_urls` solo contiene `https://127.0.0.1:3000`. El flujo real usa `window.location.origin` para OAuth/email redirects en `src/app/onboarding/page.tsx` lineas 354-358.
- **Riesgo:** en local no reproduce produccion y es facil dejar Supabase remoto sin los callbacks finales (`https://nutriapro.es/onboarding`, dominio Vercel o Codespaces). Esto causa fallos OAuth y puede llevar a configuraciones manuales inconsistentes.
- **Fix:** documentar y alinear redirects remotos. Para config versionada local:

```toml
[auth]
site_url = "https://nutriapro.es"
additional_redirect_urls = [
  "https://nutriapro.es/onboarding",
  "http://localhost:3000/onboarding",
  "http://127.0.0.1:3000/onboarding"
]
```

---

## [BAJO] - Control de cuota de fotos en cliente sigue existiendo y puede mostrar estado enganoso
- **Archivo:** `src/stores/premiumStore.ts` (linea 26)
- **Problema:** el store mantiene `photoLogsToday` en `localStorage` y `canUsePhoto()` decide si muestra el paywall antes de llamar al servidor. El servidor ya valida cuota en `src/app/api/ai-log/route.ts`, por lo que no es el control de seguridad real.
- **Riesgo:** un usuario puede modificar `localStorage` y saltarse el paywall visual hasta que el servidor rechace. No permite bypass final, pero genera UX inconsistente y puede inducir a pensar que la cuota se aplica en cliente.
- **Fix:** tratar el store solo como cache visual y refrescar desde una fuente server-side, o eliminar `canUsePhoto()` como gate previo y dejar que `/api/ai-log` devuelva 403 con el estado actual.

```ts
// En UI: intentar analizar y manejar 403 del servidor.
if (response.status === 403) {
  setShowPhotoPaywall(true);
}
```

---

## Observaciones positivas

- `supabase/functions/ai-log/index.ts` valida JWT con `supabase.auth.getUser()`, ignora `user_id` de cliente y restringe CORS por origen permitido.
- `src/app/api/ai-log/route.ts` valida sesion, body, fechas, tamano de payload, rate limit y cuota free server-side.
- Stripe webhook valida firma con `stripe.webhooks.constructEvent(...)`.
- `.gitignore` ignora `.env*` y permite solo `.env.example`.
- `.env.local` auditado no contiene `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` ni `ANTHROPIC_API_KEY`; solo variables `NEXT_PUBLIC_*`.
- Buckets `food-photos` y `avatars` tienen politicas de storage; `food-photos` esta definido como privado.

---

## Resumen

- Criticos: 3
- Altos: 4
- Medios: 4
- Bajos: 2

Total: 13 hallazgos

---

## Top 5 fixes prioritarios

1. Bloquear `tdee-update` con JWT/`CRON_SECRET` y dejar de aceptar `body.user_id`.
2. Eliminar o corregir las Edge Functions legacy bajo `Nutria/supabase/functions` que usan `service_role` sin autenticacion.
3. Meter la validacion Premium dentro de `activate_meal_plan_atomic`.
4. Unificar el project ref Supabase (`goanhievycvklsvnsbks`) en `.env*`, `supabase/.temp/project-ref`, `next.config.ts`, Vercel y Supabase CLI.
5. Sacar datos sensibles del onboarding de `localStorage` y reducir CSP en produccion quitando `unsafe-eval`.

---

## Estado de fixes

- ✅ FIXED - 2026-04-15 - FIX 1: `tdee-update` añadido en `supabase/functions/tdee-update/` y endurecido tambien en `Nutria/supabase/functions/tdee-update/`; ahora exige `Authorization`, valida JWT con `supabase.auth.getUser(token)`, usa `user.id` del token para modo usuario, reserva `CRON_SECRET` para modo cron y restringe CORS a `https://nutriapro.es`/localhost/origenes configurados.
- ✅ FIXED - 2026-04-15 - FIX 2: `Nutria/supabase/functions/ai-log/index.ts` ya no confia en `body.user_id`; valida `Authorization` con `SUPABASE_ANON_KEY`, obtiene `user.id` con `supabase.auth.getUser()`, usa ese ID para cuota e inserts y restringe CORS. La funcion raiz `supabase/functions/ai-log/index.ts` ya tenia este patron seguro y se verifico sin cambios.
- ✅ FIXED - 2026-04-15 - FIX 3: creada la migracion `supabase/migrations/20260415_harden_activate_meal_plan_premium.sql`; `activate_meal_plan_atomic` ahora lee `auth.uid()`, obtiene `meal_plans.is_premium` server-side y bloquea planes premium con `PREMIUM_REQUIRED` salvo que `user_profiles` tenga `is_premium=true`, `subscription_status` `active`/`trialing` y `premium_expires_at` vigente o nulo.
- ✅ FIXED - 2026-04-15 - FIX 4: eliminado de `next.config.ts` el project ref legacy `lslqqmfflmfjlzmneqof`; CSP e imagenes remotas ahora derivan de `NEXT_PUBLIC_SUPABASE_URL`, por lo que deben apuntar a `goanhievycvklsvnsbks` cuando el entorno use la URL correcta. Se documentan discrepancias sin mutar `.env.local` ni `supabase/.temp/project-ref` porque son archivos locales/ignorados y la anon key debe validarse junto con la URL antes de cambiarlos.
- ✅ FIXED - 2026-04-15 - FIX 5: `src/stores/onboardingStore.ts` cambia la persistencia del wizard de `localStorage` implicito a `sessionStorage` mediante `createJSONStorage(() => sessionStorage)`. El `reset()` existente sigue ejecutando `useOnboardingStore.persist.clearStorage()` tras completar el onboarding, limpiando los datos temporales.
- ✅ FIXED - 2026-04-15 - FIX 6: revisadas las Edge Functions root y legacy; el wildcard restante en `Nutria/supabase/functions/psych-detector/index.ts` fue reemplazado por allowlist (`https://nutriapro.es`, origenes configurados y localhost). La funcion legacy ahora exige `Authorization`, valida JWT para modo usuario, ignora `body.user_id` y reserva `CRON_SECRET` para el modo cron.
- ✅ FIXED - 2026-04-15 - FIX 7: `next.config.ts` mantiene `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, cambia `Permissions-Policy` a `camera=(), microphone=(), geolocation=()` y endurece una CSP basica para Supabase configurado por entorno, Stripe, Vercel y Google Fonts, quitando `unsafe-eval` en produccion.
