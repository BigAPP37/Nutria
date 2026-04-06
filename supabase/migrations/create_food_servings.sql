-- ── Tabla de porciones predefinidas de alimentos ──────────────────────────────
-- Almacena porciones comunes para un alimento (e.g. "1 huevo", "1 rebanada")
-- Usada por PortionSelector y el panel de búsqueda manual de alimentos.

CREATE TABLE IF NOT EXISTS food_servings (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id  uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  label    text NOT NULL,   -- e.g. "1 unidad", "1 rebanada", "1 taza"
  grams    numeric(8,2) NOT NULL CHECK (grams > 0)
);

CREATE INDEX IF NOT EXISTS food_servings_food_id_idx
  ON food_servings (food_id);

-- RLS: los usuarios autenticados pueden leer porciones
ALTER TABLE food_servings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read food_servings"
  ON food_servings FOR SELECT
  TO authenticated
  USING (true);
