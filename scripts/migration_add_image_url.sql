-- Migración: añadir columna image_url a la tabla foods
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE foods
  ADD COLUMN IF NOT EXISTS image_url text;

-- Índice parcial para que las queries "sin imagen" sean rápidas
CREATE INDEX IF NOT EXISTS idx_foods_image_url_null
  ON foods (id)
  WHERE image_url IS NULL;
