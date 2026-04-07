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
