-- ── Garantía de plan activo único por usuario ─────────────────────────────────
-- Un usuario solo puede tener un plan activo a la vez.
-- El índice parcial lo hace cumplir a nivel de BD sin afectar filas inactivas.

CREATE UNIQUE INDEX IF NOT EXISTS user_meal_plans_one_active_per_user
  ON user_meal_plans (user_id)
  WHERE is_active = true;
