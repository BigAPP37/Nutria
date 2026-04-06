-- ============================================================
-- Meal Plans — Dietas personalizadas
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Planes de dieta (catálogo)
CREATE TABLE IF NOT EXISTS meal_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  goal_type       TEXT NOT NULL CHECK (goal_type IN ('lose_weight', 'maintain', 'gain_muscle')),
  duration_days   INTEGER NOT NULL DEFAULT 7,
  target_calories INTEGER NOT NULL,
  is_premium      BOOLEAN NOT NULL DEFAULT true,
  is_sample       BOOLEAN NOT NULL DEFAULT false,  -- muestra gratuita
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Días de cada plan
CREATE TABLE IF NOT EXISTS meal_plan_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_number      INTEGER NOT NULL,
  day_label       TEXT,                   -- "Día 1 · Lunes"
  total_calories  INTEGER,
  total_protein_g NUMERIC(6,1),
  total_carbs_g   NUMERIC(6,1),
  total_fat_g     NUMERIC(6,1),
  UNIQUE (plan_id, day_number)
);

-- 3. Recetas reutilizables
CREATE TABLE IF NOT EXISTS recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spoonacular_id  INTEGER UNIQUE,         -- ID original de Spoonacular
  title           TEXT NOT NULL,
  description     TEXT,
  meal_type       TEXT,                   -- breakfast | lunch | dinner | snack
  cuisine         TEXT,
  prep_time_min   INTEGER,
  cook_time_min   INTEGER,
  ready_in_min    INTEGER,
  servings        INTEGER DEFAULT 1,
  calories_kcal   NUMERIC(6,1),
  protein_g       NUMERIC(6,1),
  carbs_g         NUMERIC(6,1),
  fat_g           NUMERIC(6,1),
  fiber_g         NUMERIC(6,1),
  image_url       TEXT,
  source_url      TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Ingredientes de cada receta
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  order_index     INTEGER NOT NULL DEFAULT 0,
  ingredient_name TEXT NOT NULL,
  quantity        NUMERIC(8,2),
  unit            TEXT,
  notes           TEXT                    -- "picado fino", "a temperatura ambiente"
);

-- 5. Pasos de preparación
CREATE TABLE IF NOT EXISTS recipe_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number     INTEGER NOT NULL,
  instruction     TEXT NOT NULL,
  duration_min    INTEGER
);

-- 6. Comidas de cada día del plan (enlaza día → receta)
CREATE TABLE IF NOT EXISTS meal_plan_meals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id          UUID NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id       UUID REFERENCES recipes(id),
  order_index     INTEGER DEFAULT 0
);

-- 7. Plan activo del usuario
CREATE TABLE IF NOT EXISTS user_meal_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES meal_plans(id),
  started_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id)
);

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan  ON meal_plan_days (plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_meals_day  ON meal_plan_meals (day_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_r ON recipe_ingredients (recipe_id, order_index);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_r       ON recipe_steps (recipe_id, step_number);
CREATE INDEX IF NOT EXISTS idx_user_meal_plans_user ON user_meal_plans (user_id) WHERE is_active = true;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE meal_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_days      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_meals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meal_plans     ENABLE ROW LEVEL SECURITY;

-- Catálogo de planes/recetas: cualquier usuario autenticado puede leer
CREATE POLICY "read meal_plans"         ON meal_plans         FOR SELECT TO authenticated USING (true);
CREATE POLICY "read meal_plan_days"     ON meal_plan_days     FOR SELECT TO authenticated USING (true);
CREATE POLICY "read meal_plan_meals"    ON meal_plan_meals    FOR SELECT TO authenticated USING (true);
CREATE POLICY "read recipes"            ON recipes            FOR SELECT TO authenticated USING (true);
CREATE POLICY "read recipe_ingredients" ON recipe_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "read recipe_steps"       ON recipe_steps       FOR SELECT TO authenticated USING (true);

-- Planes del usuario: solo el propio usuario
CREATE POLICY "own user_meal_plans read"   ON user_meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own user_meal_plans insert" ON user_meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own user_meal_plans update" ON user_meal_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
