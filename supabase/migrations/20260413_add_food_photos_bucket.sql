-- SEC-11: Bucket food-photos + RLS
--
-- Crea el bucket como PRIVADO (public = false).
-- Cada usuario solo puede subir, leer y borrar dentro de su propia carpeta.
-- Convención de path usada por usePhotoUpload.ts: {userId}/{date}/{timestamp}.jpg
-- → (storage.foldername(name))[1] = userId
--
-- RIESGO RESIDUAL: usePhotoUpload.ts llama a getPublicUrl() (línea 94).
-- En un bucket privado esa URL no es accesible directamente; habrá que
-- migrar a createSignedUrl() para que las fotos se muestren correctamente.
-- Eso requiere cambios en src/hooks/usePhotoUpload.ts (fuera del alcance de esta migración).

-- ── Crear bucket si no existe ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ── Políticas RLS ─────────────────────────────────────────────────────────────

-- SELECT: cada usuario lee solo su propia carpeta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Users can read own food photos'
  ) THEN
    CREATE POLICY "Users can read own food photos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'food-photos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- INSERT: cada usuario sube solo a su propia carpeta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Users can upload own food photos'
  ) THEN
    CREATE POLICY "Users can upload own food photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'food-photos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- DELETE: cada usuario borra solo sus propias fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Users can delete own food photos'
  ) THEN
    CREATE POLICY "Users can delete own food photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'food-photos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
