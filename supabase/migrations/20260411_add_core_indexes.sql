-- Migración: índices core de producción
-- Los índices de tablas core ya existen en la BD (aplicados al crear el schema).
-- Esta migración los registra formalmente en el historial de migraciones.
-- Usa IF NOT EXISTS → idempotente, no falla si el índice ya existe.
--
-- Índice genuinamente faltante:
--   idx_user_profiles_stripe_customer — el webhook de Stripe resuelve usuarios
--   por stripe_customer_id sin índice → sequential scan en user_profiles.

-- ── food_log_entries ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_log_user_date
  ON food_log_entries(user_id, log_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_log_user_calories
  ON food_log_entries(user_id, log_date, calories_kcal)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_log_ai_method
  ON food_log_entries(logging_method)
  WHERE ai_confidence IS NOT NULL;

-- ── daily_log_status ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_status_user
  ON daily_log_status(user_id, log_date DESC);

-- ── weight_entries ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_weight_user_date
  ON weight_entries(user_id, recorded_at DESC);

-- ── water_log ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_water_user_date
  ON water_log(user_id, log_date DESC);

-- ── tdee_weekly_snapshots ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tdee_snapshots_user
  ON tdee_weekly_snapshots(user_id, week_start DESC);

-- ── psychological_flags ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_psych_flags_user
  ON psychological_flags(user_id, detected_at DESC);

-- ── psychological_responses ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_psych_resp_cooldown
  ON psychological_responses(user_id, message_key, shown_at DESC);

-- ── notification_log ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_log_user
  ON notification_log(user_id, sent_at DESC);

-- ── user_profiles: stripe_customer_id ────────────────────────────────────────
-- El webhook de Stripe resuelve el user_id buscando por stripe_customer_id.
-- Sin este índice, cada evento de Stripe hace un sequential scan en user_profiles.
-- Condicional: sólo crea el índice si la columna ya existe (se añade en add_stripe_columns.sql).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'user_profiles'
      AND column_name  = 'stripe_customer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'user_profiles'
      AND indexname  = 'idx_user_profiles_stripe_customer'
  ) THEN
    EXECUTE 'CREATE INDEX idx_user_profiles_stripe_customer
               ON user_profiles(stripe_customer_id)
               WHERE stripe_customer_id IS NOT NULL';
  END IF;
END $$;
