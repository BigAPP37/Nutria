-- ============================================================================
-- NUTRIA — Schema Completo para Supabase
-- App de conteo de calorías con IA para hispanohablantes
-- PostgreSQL 15+ | pgvector | Row Level Security
-- Diseñado para 100k+ usuarios sin refactoring mayor
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector: búsqueda semántica
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram: búsqueda fuzzy de alimentos

-- ============================================================================
-- 1. TIPOS ENUMERADOS
-- ============================================================================
CREATE TYPE user_goal AS ENUM ('lose_weight', 'maintain', 'gain_muscle');
CREATE TYPE activity_level AS ENUM (
  'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
);
CREATE TYPE biological_sex AS ENUM ('male', 'female');
CREATE TYPE unit_weight AS ENUM ('kg', 'lb');
CREATE TYPE unit_energy AS ENUM ('kcal', 'kJ');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE logging_method AS ENUM ('photo', 'natural_text', 'manual', 'barcode');
CREATE TYPE food_source_type AS ENUM ('homemade', 'restaurant', 'packaged');
CREATE TYPE food_category AS ENUM (
  'fruit', 'vegetable', 'grain', 'legume', 'dairy', 'meat', 'poultry',
  'fish_seafood', 'egg', 'nut_seed', 'oil_fat', 'sweet', 'beverage',
  'condiment', 'prepared_meal', 'supplement', 'other'
);
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM (
  'meal_reminder', 'positive_achievement', 'weight_checkin', 'nutrition_suggestion'
);
CREATE TYPE psych_flag_type AS ENUM (
  'consecutive_low_logging', 'consecutive_zero_logging', 'restrictive_language'
);
CREATE TYPE tca_screening_answer AS ENUM (
  'very_positive', 'positive', 'neutral', 'complicated', 'prefer_not_to_say'
);

-- ============================================================================
-- 2. USUARIOS Y PERFILES
-- ============================================================================

-- Extiende auth.users de Supabase Auth
CREATE TABLE user_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        TEXT,
  date_of_birth       DATE,
  biological_sex      biological_sex,
  height_cm           NUMERIC(5,1),                -- siempre cm internamente
  goal                user_goal DEFAULT 'maintain',
  activity_level      activity_level DEFAULT 'moderately_active',
  
  -- Screening TCA (onboarding)
  tca_screening       tca_screening_answer,
  
  -- Preferencias
  unit_weight         unit_weight DEFAULT 'kg',
  unit_energy         unit_energy DEFAULT 'kcal',
  language            TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
  country_code        TEXT DEFAULT 'ES' CHECK (char_length(country_code) = 2),
  timezone            TEXT DEFAULT 'Europe/Madrid',
  
  -- Premium
  is_premium          BOOLEAN DEFAULT FALSE,
  premium_expires_at  TIMESTAMPTZ,
  
  -- Estado
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Historial de peso (múltiples entradas en el tiempo)
CREATE TABLE weight_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  weight_kg     NUMERIC(5,1) NOT NULL,           -- siempre kg internamente
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_weight_user_date
  ON weight_entries(user_id, recorded_at DESC);

-- ============================================================================
-- 3. BASE DE DATOS DE ALIMENTOS
-- ============================================================================

-- 3a. Tabla principal de alimentos
CREATE TABLE foods (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificación
  name              TEXT NOT NULL,                 -- nombre canónico en español
  brand             TEXT,                          -- marca (empaquetados)
  barcode           TEXT,                          -- EAN/UPC
  food_source       food_source_type DEFAULT 'homemade',
  category          food_category NOT NULL,
  
  -- Origen cultural
  origin_country    TEXT,                          -- ISO 3166-1 alpha-2
  origin_region     TEXT,                          -- "Andalucía", "Oaxaca"…
  
  -- Verificación y moderación
  is_verified       BOOLEAN DEFAULT FALSE,
  moderation_status moderation_status DEFAULT 'pending',
  contributed_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_source       TEXT,                          -- "BEDCA", "USDA", "equipo"
  
  -- === Macronutrientes (por 100 g SIEMPRE) ===
  calories_kcal     NUMERIC(7,1) NOT NULL,
  protein_g         NUMERIC(6,2) DEFAULT 0,
  carbs_g           NUMERIC(6,2) DEFAULT 0,
  fat_g             NUMERIC(6,2) DEFAULT 0,
  fiber_g           NUMERIC(6,2) DEFAULT 0,
  sugar_g           NUMERIC(6,2) DEFAULT 0,
  sodium_mg         NUMERIC(7,1) DEFAULT 0,
  
  -- === 10 micronutrientes clave (por 100 g) ===
  vitamin_c_mg      NUMERIC(7,2),
  iron_mg           NUMERIC(6,2),
  calcium_mg        NUMERIC(7,1),
  vitamin_d_mcg     NUMERIC(6,2),
  vitamin_b12_mcg   NUMERIC(6,2),
  magnesium_mg      NUMERIC(7,1),
  zinc_mg           NUMERIC(6,2),
  potassium_mg      NUMERIC(7,1),
  folate_mcg        NUMERIC(7,1),
  omega3_g          NUMERIC(6,3),
  
  -- Búsqueda semántica (pgvector)
  embedding         vector(1536),
  
  -- Estado
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Índices de alimentos
CREATE INDEX idx_foods_name_trgm   ON foods USING gin(name gin_trgm_ops);
CREATE INDEX idx_foods_barcode     ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_category    ON foods(category) WHERE is_active = TRUE;
CREATE INDEX idx_foods_verified    ON foods(is_verified, moderation_status)
                                   WHERE is_active = TRUE;
CREATE INDEX idx_foods_country     ON foods(origin_country)
                                   WHERE origin_country IS NOT NULL AND is_active = TRUE;
CREATE INDEX idx_foods_embedding   ON foods
                                   USING ivfflat(embedding vector_cosine_ops)
                                   WITH (lists = 100);
CREATE INDEX idx_foods_brand_trgm  ON foods USING gin(brand gin_trgm_ops)
                                   WHERE brand IS NOT NULL;

-- 3b. Alias / nombres alternativos
CREATE TABLE food_aliases (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_id       UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  alias         TEXT NOT NULL,
  country_code  TEXT,                              -- dónde se usa este nombre
  is_primary    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_aliases_trgm ON food_aliases USING gin(alias gin_trgm_ops);
CREATE INDEX idx_aliases_food ON food_aliases(food_id);

-- 3c. Unidades de porción por alimento
CREATE TABLE food_servings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_id         UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  serving_name    TEXT NOT NULL,                    -- "1 taza", "1 rebanada"…
  serving_grams   NUMERIC(7,1) NOT NULL,           -- equivalencia en gramos
  is_default      BOOLEAN DEFAULT FALSE,
  sort_order      SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_servings_food ON food_servings(food_id);

-- ============================================================================
-- 4. REGISTRO DIARIO DE COMIDAS
-- ============================================================================

CREATE TABLE food_log_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Cuándo
  log_date            DATE NOT NULL,
  meal_type           meal_type NOT NULL,
  logged_at           TIMESTAMPTZ DEFAULT now(),
  
  -- Qué (referencia a alimento O descripción libre)
  food_id             UUID REFERENCES foods(id) ON DELETE SET NULL,
  custom_description  TEXT,                        -- texto libre si IA no matcheó
  
  -- Cantidad
  quantity_grams      NUMERIC(7,1) NOT NULL,       -- siempre gramos
  serving_id          UUID REFERENCES food_servings(id) ON DELETE SET NULL,
  serving_quantity    NUMERIC(5,2),                 -- ej: 1.5 tazas
  
  -- Nutrientes desnormalizados (snapshot al momento del log)
  calories_kcal       NUMERIC(7,1),
  protein_g           NUMERIC(6,2),
  carbs_g             NUMERIC(6,2),
  fat_g               NUMERIC(6,2),
  fiber_g             NUMERIC(6,2),
  
  -- Método de entrada
  logging_method      logging_method NOT NULL DEFAULT 'manual',
  ai_confidence       NUMERIC(3,2)
                        CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  photo_storage_path  TEXT,                        -- Supabase Storage bucket path
  ai_raw_response     JSONB,                       -- respuesta completa de Claude
  
  -- Soft delete
  deleted_at          TIMESTAMPTZ,
  
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Query principal: log diario de un usuario
CREATE INDEX idx_log_user_date
  ON food_log_entries(user_id, log_date DESC)
  WHERE deleted_at IS NULL;

-- Query TDEE: calorías por rango de fechas
CREATE INDEX idx_log_user_calories
  ON food_log_entries(user_id, log_date, calories_kcal)
  WHERE deleted_at IS NULL;

-- Auditoría IA
CREATE INDEX idx_log_ai_method
  ON food_log_entries(logging_method)
  WHERE ai_confidence IS NOT NULL;

-- ============================================================================
-- 5. COMPLETITUD DIARIA (señal para el algoritmo TDEE)
-- ============================================================================

CREATE TABLE daily_log_status (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  is_day_complete BOOLEAN DEFAULT FALSE,           -- usuario marcó "terminé de logear"
  total_calories  NUMERIC(7,1),
  total_protein_g NUMERIC(6,2),
  total_carbs_g   NUMERIC(6,2),
  total_fat_g     NUMERIC(6,2),
  meal_count      SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, log_date)
);

CREATE INDEX idx_daily_status_user
  ON daily_log_status(user_id, log_date DESC);

-- ============================================================================
-- 6. ALGORITMO TDEE ADAPTATIVO
-- ============================================================================

-- 6a. Estado actual del TDEE por usuario (singleton por user)
CREATE TABLE user_tdee_state (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE
                        REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_tdee_kcal   NUMERIC(6,0) NOT NULL,
  current_bmr_kcal    NUMERIC(6,0),                -- Mifflin-St Jeor base
  initial_tdee_kcal   NUMERIC(6,0),                -- calculado en onboarding
  last_adjusted_at    TIMESTAMPTZ DEFAULT now(),
  confidence_level    NUMERIC(3,2) DEFAULT 0.50,   -- 0-1, sube con más data real
  weeks_of_data       SMALLINT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 6b. Snapshots semanales (historial completo de ajustes)
CREATE TABLE tdee_weekly_snapshots (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL
                                REFERENCES user_profiles(id) ON DELETE CASCADE,
  week_start                  DATE NOT NULL,       -- lunes
  week_end                    DATE NOT NULL,       -- domingo
  
  -- Datos observados
  avg_weight_kg               NUMERIC(5,1),
  weight_delta_kg             NUMERIC(4,2),        -- vs semana anterior
  avg_calories_day            NUMERIC(7,1),
  complete_days               SMALLINT NOT NULL DEFAULT 0,
  total_days                  SMALLINT NOT NULL DEFAULT 7,
  
  -- Cálculo del algoritmo
  expected_weight_delta_kg    NUMERIC(4,2),
  tdee_before_adjustment      NUMERIC(6,0),
  tdee_after_adjustment       NUMERIC(6,0),
  adjustment_kcal             NUMERIC(5,0),        -- delta aplicado (+/-)
  adjustment_reason           TEXT,
  
  created_at                  TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_tdee_snapshots_user
  ON tdee_weekly_snapshots(user_id, week_start DESC);

-- ============================================================================
-- 7. DETECCIÓN DE PATRONES PSICOLÓGICOS
-- ============================================================================

-- 7a. Flags detectados
CREATE TABLE psychological_flags (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  flag_type         psych_flag_type NOT NULL,
  detected_at       TIMESTAMPTZ DEFAULT now(),
  details           JSONB,                         -- datos del patrón
  consecutive_days  SMALLINT,
  trigger_text      TEXT,                          -- texto que activó (si aplica)
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_psych_flags_user
  ON psychological_flags(user_id, detected_at DESC);

-- 7b. Respuestas/mensajes mostrados
CREATE TABLE psychological_responses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  flag_id         UUID REFERENCES psychological_flags(id) ON DELETE SET NULL,
  message_key     TEXT NOT NULL,                   -- clave i18n del mensaje
  message_content TEXT,                            -- contenido real mostrado
  shown_at        TIMESTAMPTZ DEFAULT now(),
  dismissed_at    TIMESTAMPTZ,
  was_helpful     BOOLEAN,                         -- feedback opcional
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Para la regla "máximo 1 vez por semana por message_key"
CREATE INDEX idx_psych_resp_cooldown
  ON psychological_responses(user_id, message_key, shown_at DESC);

-- ============================================================================
-- 8. NOTIFICACIONES
-- ============================================================================

-- 8a. Preferencias
CREATE TABLE notification_preferences (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  is_enabled        BOOLEAN DEFAULT TRUE,
  preferred_time    TIME,                          -- hora local del usuario
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, notification_type)
);

-- 8b. Historial de envíos
CREATE TABLE notification_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT,
  sent_at           TIMESTAMPTZ DEFAULT now(),
  opened_at         TIMESTAMPTZ,
  push_token_used   TEXT
);

CREATE INDEX idx_notif_log_user
  ON notification_log(user_id, sent_at DESC);

-- ============================================================================
-- 9. AGUA
-- ============================================================================

CREATE TABLE water_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  amount_ml   NUMERIC(6,0) NOT NULL,               -- siempre ml
  logged_at   TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_water_user_date
  ON water_log(user_id, log_date DESC);

-- ============================================================================
-- 10. FUNCIÓN HELPER: updated_at AUTOMÁTICO
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER trg_user_profiles_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_food_log_entries_updated
  BEFORE UPDATE ON food_log_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_daily_log_status_updated
  BEFORE UPDATE ON daily_log_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_tdee_state_updated
  BEFORE UPDATE ON user_tdee_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notification_prefs_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en TODAS las tablas con datos de usuario
ALTER TABLE user_profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_log_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_status          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tdee_state           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdee_weekly_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_log                 ENABLE ROW LEVEL SECURITY;

-- Foods es pública para lectura (catálogo compartido)
ALTER TABLE foods                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_aliases              ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_servings             ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- user_profiles: cada usuario solo ve/edita su propio perfil
-- -------------------------------------------------------
CREATE POLICY "users_read_own_profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own_profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- weight_entries
-- -------------------------------------------------------
CREATE POLICY "users_manage_own_weight"
  ON weight_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- food_log_entries
-- -------------------------------------------------------
CREATE POLICY "users_manage_own_food_log"
  ON food_log_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- daily_log_status
-- -------------------------------------------------------
CREATE POLICY "users_manage_own_daily_status"
  ON daily_log_status FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- user_tdee_state
-- -------------------------------------------------------
CREATE POLICY "users_read_own_tdee"
  ON user_tdee_state FOR SELECT
  USING (auth.uid() = user_id);

-- Edge Functions (service_role) manejan escritura del TDEE
CREATE POLICY "service_write_tdee"
  ON user_tdee_state FOR ALL
  USING (auth.uid() = user_id OR current_setting('role') = 'service_role')
  WITH CHECK (auth.uid() = user_id OR current_setting('role') = 'service_role');

-- -------------------------------------------------------
-- tdee_weekly_snapshots
-- -------------------------------------------------------
CREATE POLICY "users_read_own_snapshots"
  ON tdee_weekly_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service_write_snapshots"
  ON tdee_weekly_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id OR current_setting('role') = 'service_role');

-- -------------------------------------------------------
-- psychological_flags + responses: solo lectura para el usuario,
-- escritura vía service_role (Edge Functions)
-- -------------------------------------------------------
CREATE POLICY "users_read_own_psych_flags"
  ON psychological_flags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service_write_psych_flags"
  ON psychological_flags FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "users_read_own_psych_responses"
  ON psychological_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_dismiss_psych_responses"
  ON psychological_responses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_write_psych_responses"
  ON psychological_responses FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

-- -------------------------------------------------------
-- notification_preferences
-- -------------------------------------------------------
CREATE POLICY "users_manage_own_notif_prefs"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- notification_log
-- -------------------------------------------------------
CREATE POLICY "users_read_own_notif_log"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service_write_notif_log"
  ON notification_log FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

-- -------------------------------------------------------
-- water_log
-- -------------------------------------------------------
CREATE POLICY "users_manage_own_water"
  ON water_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- foods: lectura pública (verificados), escritura restringida
-- -------------------------------------------------------
CREATE POLICY "anyone_read_verified_foods"
  ON foods FOR SELECT
  USING (is_active = TRUE AND (is_verified = TRUE OR contributed_by = auth.uid()));

CREATE POLICY "users_contribute_foods"
  ON foods FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND contributed_by = auth.uid()
    AND is_verified = FALSE
    AND moderation_status = 'pending'
  );

-- -------------------------------------------------------
-- food_aliases: lectura pública
-- -------------------------------------------------------
CREATE POLICY "anyone_read_aliases"
  ON food_aliases FOR SELECT
  USING (TRUE);

-- -------------------------------------------------------
-- food_servings: lectura pública
-- -------------------------------------------------------
CREATE POLICY "anyone_read_servings"
  ON food_servings FOR SELECT
  USING (TRUE);

-- ============================================================================
-- 12. FUNCIÓN: BÚSQUEDA HÍBRIDA DE ALIMENTOS (texto + semántica)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_foods(
  p_query TEXT,
  p_embedding vector(1536) DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_category food_category DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  food_id       UUID,
  food_name     TEXT,
  brand         TEXT,
  category      food_category,
  calories_kcal NUMERIC,
  protein_g     NUMERIC,
  carbs_g       NUMERIC,
  fat_g         NUMERIC,
  origin_country TEXT,
  is_verified   BOOLEAN,
  text_rank     REAL,
  vector_rank   DOUBLE PRECISION,
  combined_rank DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  WITH text_search AS (
    SELECT
      f.id,
      greatest(
        similarity(f.name, p_query),
        COALESCE((
          SELECT max(similarity(fa.alias, p_query))
          FROM food_aliases fa WHERE fa.food_id = f.id
        ), 0)
      ) AS txt_score
    FROM foods f
    WHERE f.is_active = TRUE
      AND (f.is_verified = TRUE OR f.moderation_status = 'approved')
      AND (p_country IS NULL OR f.origin_country = p_country OR f.origin_country IS NULL)
      AND (p_category IS NULL OR f.category = p_category)
      AND (
        f.name % p_query
        OR EXISTS (
          SELECT 1 FROM food_aliases fa
          WHERE fa.food_id = f.id AND fa.alias % p_query
        )
      )
  ),
  vector_search AS (
    SELECT
      f.id,
      1 - (f.embedding <=> p_embedding) AS vec_score
    FROM foods f
    WHERE f.is_active = TRUE
      AND (f.is_verified = TRUE OR f.moderation_status = 'approved')
      AND p_embedding IS NOT NULL
      AND f.embedding IS NOT NULL
      AND (p_country IS NULL OR f.origin_country = p_country OR f.origin_country IS NULL)
      AND (p_category IS NULL OR f.category = p_category)
    ORDER BY f.embedding <=> p_embedding
    LIMIT 50
  ),
  combined AS (
    SELECT
      COALESCE(ts.id, vs.id) AS cid,
      COALESCE(ts.txt_score, 0)::REAL AS t_rank,
      COALESCE(vs.vec_score, 0)::DOUBLE PRECISION AS v_rank,
      (COALESCE(ts.txt_score, 0) * 0.6 + COALESCE(vs.vec_score, 0) * 0.4)::DOUBLE PRECISION
        AS c_rank
    FROM text_search ts
    FULL OUTER JOIN vector_search vs ON ts.id = vs.id
  )
  SELECT
    f.id,
    f.name,
    f.brand,
    f.category,
    f.calories_kcal,
    f.protein_g,
    f.carbs_g,
    f.fat_g,
    f.origin_country,
    f.is_verified,
    c.t_rank,
    c.v_rank,
    c.c_rank
  FROM combined c
  JOIN foods f ON f.id = c.cid
  ORDER BY c.c_rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 13. FUNCIÓN: RESUMEN DIARIO DE MACROS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_daily_summary(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE(
  meal meal_type,
  total_calories NUMERIC,
  total_protein  NUMERIC,
  total_carbs    NUMERIC,
  total_fat      NUMERIC,
  total_fiber    NUMERIC,
  entry_count    BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fle.meal_type,
    COALESCE(sum(fle.calories_kcal), 0),
    COALESCE(sum(fle.protein_g), 0),
    COALESCE(sum(fle.carbs_g), 0),
    COALESCE(sum(fle.fat_g), 0),
    COALESCE(sum(fle.fiber_g), 0),
    count(*)
  FROM food_log_entries fle
  WHERE fle.user_id = p_user_id
    AND fle.log_date = p_date
    AND fle.deleted_at IS NULL
  GROUP BY fle.meal_type
  ORDER BY
    CASE fle.meal_type
      WHEN 'breakfast' THEN 1
      WHEN 'lunch'     THEN 2
      WHEN 'dinner'    THEN 3
      WHEN 'snack'     THEN 4
    END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 14. FUNCIÓN: DATOS PARA CÁLCULO TDEE SEMANAL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tdee_weekly_data(
  p_user_id UUID,
  p_week_start DATE,
  p_week_end DATE
)
RETURNS TABLE(
  complete_days     BIGINT,
  avg_calories_day  NUMERIC,
  avg_weight_kg     NUMERIC,
  weight_start      NUMERIC,
  weight_end        NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH cal_data AS (
    SELECT
      dls.log_date,
      dls.total_calories
    FROM daily_log_status dls
    WHERE dls.user_id = p_user_id
      AND dls.log_date BETWEEN p_week_start AND p_week_end
      AND dls.is_day_complete = TRUE
  ),
  weight_data AS (
    SELECT
      we.weight_kg,
      we.recorded_at::DATE AS w_date
    FROM weight_entries we
    WHERE we.user_id = p_user_id
      AND we.recorded_at::DATE BETWEEN p_week_start AND p_week_end
  )
  SELECT
    (SELECT count(*) FROM cal_data),
    (SELECT COALESCE(avg(cd.total_calories), 0) FROM cal_data cd),
    (SELECT COALESCE(avg(wd.weight_kg), 0) FROM weight_data wd),
    (SELECT wd.weight_kg FROM weight_data wd ORDER BY wd.w_date ASC LIMIT 1),
    (SELECT wd.weight_kg FROM weight_data wd ORDER BY wd.w_date DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 15. FUNCIÓN: VERIFICAR COOLDOWN DE MENSAJE PSICOLÓGICO
-- ============================================================================

CREATE OR REPLACE FUNCTION can_show_psych_message(
  p_user_id UUID,
  p_message_key TEXT,
  p_cooldown_days INT DEFAULT 7
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM psychological_responses pr
    WHERE pr.user_id = p_user_id
      AND pr.message_key = p_message_key
      AND pr.shown_at > now() - make_interval(days => p_cooldown_days)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
