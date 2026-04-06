-- ── Tabla principal de alimentos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS foods (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  brand           text,
  category        text,
  calories_kcal   numeric(8,2) NOT NULL DEFAULT 0,
  protein_g       numeric(8,2) NOT NULL DEFAULT 0,
  carbs_g         numeric(8,2) NOT NULL DEFAULT 0,
  fat_g           numeric(8,2) NOT NULL DEFAULT 0,
  fiber_g         numeric(8,2),
  sugar_g         numeric(8,2),
  sodium_mg       numeric(8,2),
  origin_country  text NOT NULL DEFAULT 'ES',
  is_verified     boolean NOT NULL DEFAULT true,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice de texto completo para búsqueda rápida en español
CREATE INDEX IF NOT EXISTS foods_name_search_idx
  ON foods USING gin(to_tsvector('spanish', name));

-- Índice simple por nombre para ILIKE
CREATE INDEX IF NOT EXISTS foods_name_ilike_idx
  ON foods (lower(name));

-- RLS: todos los usuarios autenticados pueden leer
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read foods"
  ON foods FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ── Función search_foods ───────────────────────────────────────────────────────
-- Devuelve alimentos que coincidan con el query (búsqueda fuzzy + full-text)
-- Parámetros:
--   query   text  — término de búsqueda
--   country text  — filtro de país (por defecto 'ES', ignorado si NULL)
--   limit   int   — máximo de resultados

CREATE OR REPLACE FUNCTION search_foods(
  query   text,
  country text DEFAULT 'ES',
  "limit" int  DEFAULT 20
)
RETURNS TABLE (
  food_id        uuid,
  food_name      text,
  brand          text,
  calories_kcal  numeric,
  protein_g      numeric,
  carbs_g        numeric,
  fat_g          numeric,
  origin_country text,
  is_verified    boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    f.id            AS food_id,
    f.name          AS food_name,
    f.brand,
    f.calories_kcal,
    f.protein_g,
    f.carbs_g,
    f.fat_g,
    f.origin_country,
    f.is_verified
  FROM foods f
  WHERE
    f.is_active = true
    AND (
      -- Coincidencia exacta al inicio (mayor relevancia)
      lower(f.name) LIKE lower(query) || '%'
      OR
      -- Coincidencia en cualquier posición
      lower(f.name) LIKE '%' || lower(query) || '%'
      OR
      -- Full-text search en español
      to_tsvector('spanish', f.name) @@ plainto_tsquery('spanish', query)
    )
  ORDER BY
    -- Priorizar coincidencias que empiezan con el término
    CASE WHEN lower(f.name) LIKE lower(query) || '%' THEN 0 ELSE 1 END,
    -- Luego por nombre
    f.name
  LIMIT "limit";
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION search_foods TO authenticated;
