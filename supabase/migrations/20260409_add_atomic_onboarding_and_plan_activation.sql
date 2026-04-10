-- Operaciones atómicas para onboarding y activación de planes.
-- Se ejecutan como una sola transacción en la BD para evitar estados parciales.

CREATE OR REPLACE FUNCTION public.complete_onboarding_atomic(
  p_display_name TEXT,
  p_height_cm INTEGER,
  p_date_of_birth DATE,
  p_biological_sex TEXT,
  p_goal TEXT,
  p_activity_level TEXT,
  p_country_code TEXT,
  p_unit_weight TEXT,
  p_unit_energy TEXT,
  p_timezone TEXT,
  p_weight_kg NUMERIC,
  p_weight_loss_experience TEXT DEFAULT NULL,
  p_past_diets TEXT[] DEFAULT NULL,
  p_biggest_challenges TEXT[] DEFAULT NULL,
  p_eating_triggers TEXT[] DEFAULT NULL,
  p_emotional_eating_frequency TEXT DEFAULT NULL,
  p_food_relationship TEXT DEFAULT NULL,
  p_meals_per_day INTEGER DEFAULT NULL,
  p_snacking_frequency TEXT DEFAULT NULL,
  p_cooking_frequency TEXT DEFAULT NULL,
  p_eats_out_frequency TEXT DEFAULT NULL,
  p_water_intake TEXT DEFAULT NULL,
  p_sleep_quality TEXT DEFAULT NULL,
  p_stress_level TEXT DEFAULT NULL,
  p_diet_restrictions TEXT[] DEFAULT NULL,
  p_allergies TEXT[] DEFAULT NULL,
  p_secondary_goals TEXT[] DEFAULT NULL,
  p_commitment_time TEXT DEFAULT NULL,
  p_progress_tracking TEXT[] DEFAULT NULL,
  p_living_situation TEXT DEFAULT NULL,
  p_household_support TEXT DEFAULT NULL,
  p_ai_tone_preference TEXT DEFAULT NULL,
  p_wants_daily_tips BOOLEAN DEFAULT TRUE,
  p_tca_answer TEXT DEFAULT NULL,
  p_tca_flagged BOOLEAN DEFAULT FALSE,
  p_tdee NUMERIC DEFAULT NULL,
  p_goal_kcal INTEGER DEFAULT NULL,
  p_protein_g NUMERIC DEFAULT NULL,
  p_carbs_g NUMERIC DEFAULT NULL,
  p_fat_g NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := now();
  v_initial_weight_note CONSTANT TEXT := 'Peso inicial registrado durante el onboarding';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF p_height_cm IS NULL
    OR p_date_of_birth IS NULL
    OR p_biological_sex IS NULL
    OR p_goal IS NULL
    OR p_activity_level IS NULL
    OR p_unit_weight IS NULL
    OR p_unit_energy IS NULL
    OR p_timezone IS NULL
    OR p_weight_kg IS NULL
    OR p_tdee IS NULL
    OR p_goal_kcal IS NULL
    OR p_protein_g IS NULL
    OR p_carbs_g IS NULL
    OR p_fat_g IS NULL THEN
    RAISE EXCEPTION 'MISSING_REQUIRED_ONBOARDING_FIELDS';
  END IF;

  INSERT INTO public.user_profiles (
    id,
    display_name,
    height_cm,
    date_of_birth,
    biological_sex,
    goal,
    activity_level,
    onboarding_completed,
    country_code,
    unit_weight,
    unit_energy,
    timezone,
    updated_at
  )
  VALUES (
    v_user_id,
    COALESCE(NULLIF(trim(p_display_name), ''), 'Usuario'),
    p_height_cm,
    p_date_of_birth,
    p_biological_sex,
    p_goal,
    p_activity_level,
    FALSE,
    COALESCE(NULLIF(upper(p_country_code), ''), 'ES'),
    p_unit_weight,
    p_unit_energy,
    p_timezone,
    v_now
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    height_cm = EXCLUDED.height_cm,
    date_of_birth = EXCLUDED.date_of_birth,
    biological_sex = EXCLUDED.biological_sex,
    goal = EXCLUDED.goal,
    activity_level = EXCLUDED.activity_level,
    onboarding_completed = FALSE,
    country_code = EXCLUDED.country_code,
    unit_weight = EXCLUDED.unit_weight,
    unit_energy = EXCLUDED.unit_energy,
    timezone = EXCLUDED.timezone,
    updated_at = v_now;

  INSERT INTO public.weight_entries (
    user_id,
    weight_kg,
    notes,
    recorded_at
  )
  SELECT
    v_user_id,
    p_weight_kg,
    v_initial_weight_note,
    v_now
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.weight_entries
    WHERE user_id = v_user_id
      AND notes = v_initial_weight_note
  );

  INSERT INTO public.user_context (
    user_id,
    weight_loss_experience,
    past_diets,
    biggest_challenges,
    eating_triggers,
    emotional_eating_frequency,
    food_relationship,
    meals_per_day,
    snacking_frequency,
    cooking_frequency,
    eats_out_frequency,
    water_intake,
    sleep_quality,
    stress_level,
    diet_restrictions,
    allergies,
    secondary_goals,
    commitment_time,
    progress_tracking,
    living_situation,
    household_support,
    ai_tone_preference,
    wants_daily_tips,
    tca_answer,
    tca_flagged,
    onboarding_completed_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_weight_loss_experience,
    p_past_diets,
    p_biggest_challenges,
    p_eating_triggers,
    p_emotional_eating_frequency,
    p_food_relationship,
    p_meals_per_day,
    p_snacking_frequency,
    p_cooking_frequency,
    p_eats_out_frequency,
    p_water_intake,
    p_sleep_quality,
    p_stress_level,
    p_diet_restrictions,
    p_allergies,
    p_secondary_goals,
    p_commitment_time,
    p_progress_tracking,
    p_living_situation,
    p_household_support,
    p_ai_tone_preference,
    p_wants_daily_tips,
    p_tca_answer,
    COALESCE(p_tca_flagged, FALSE),
    v_now,
    v_now
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    weight_loss_experience = EXCLUDED.weight_loss_experience,
    past_diets = EXCLUDED.past_diets,
    biggest_challenges = EXCLUDED.biggest_challenges,
    eating_triggers = EXCLUDED.eating_triggers,
    emotional_eating_frequency = EXCLUDED.emotional_eating_frequency,
    food_relationship = EXCLUDED.food_relationship,
    meals_per_day = EXCLUDED.meals_per_day,
    snacking_frequency = EXCLUDED.snacking_frequency,
    cooking_frequency = EXCLUDED.cooking_frequency,
    eats_out_frequency = EXCLUDED.eats_out_frequency,
    water_intake = EXCLUDED.water_intake,
    sleep_quality = EXCLUDED.sleep_quality,
    stress_level = EXCLUDED.stress_level,
    diet_restrictions = EXCLUDED.diet_restrictions,
    allergies = EXCLUDED.allergies,
    secondary_goals = EXCLUDED.secondary_goals,
    commitment_time = EXCLUDED.commitment_time,
    progress_tracking = EXCLUDED.progress_tracking,
    living_situation = EXCLUDED.living_situation,
    household_support = EXCLUDED.household_support,
    ai_tone_preference = EXCLUDED.ai_tone_preference,
    wants_daily_tips = EXCLUDED.wants_daily_tips,
    tca_answer = EXCLUDED.tca_answer,
    tca_flagged = EXCLUDED.tca_flagged,
    onboarding_completed_at = EXCLUDED.onboarding_completed_at,
    updated_at = v_now;

  INSERT INTO public.user_tdee_state (
    user_id,
    tdee,
    goal_kcal,
    protein_g,
    carbs_g,
    fat_g,
    updated_at
  )
  VALUES (
    v_user_id,
    p_tdee,
    p_goal_kcal,
    p_protein_g,
    p_carbs_g,
    p_fat_g,
    v_now
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    tdee = EXCLUDED.tdee,
    goal_kcal = EXCLUDED.goal_kcal,
    protein_g = EXCLUDED.protein_g,
    carbs_g = EXCLUDED.carbs_g,
    fat_g = EXCLUDED.fat_g,
    updated_at = v_now;

  UPDATE public.user_profiles
  SET
    onboarding_completed = TRUE,
    updated_at = v_now
  WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_onboarding_atomic(
  TEXT, INTEGER, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC,
  TEXT, TEXT[], TEXT[], TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT[], TEXT[], TEXT[], TEXT, TEXT[], TEXT, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN,
  NUMERIC, INTEGER, NUMERIC, NUMERIC, NUMERIC
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_onboarding_atomic(
  TEXT, INTEGER, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC,
  TEXT, TEXT[], TEXT[], TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT[], TEXT[], TEXT[], TEXT, TEXT[], TEXT, TEXT, TEXT, BOOLEAN, TEXT, BOOLEAN,
  NUMERIC, INTEGER, NUMERIC, NUMERIC, NUMERIC
) TO authenticated;

CREATE OR REPLACE FUNCTION public.activate_meal_plan_atomic(
  p_plan_id UUID,
  p_started_at DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.meal_plans
    WHERE id = p_plan_id
  ) THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND';
  END IF;

  UPDATE public.user_meal_plans
  SET is_active = FALSE
  WHERE user_id = v_user_id
    AND is_active = TRUE
    AND plan_id <> p_plan_id;

  INSERT INTO public.user_meal_plans (
    user_id,
    plan_id,
    started_at,
    is_active
  )
  VALUES (
    v_user_id,
    p_plan_id,
    COALESCE(p_started_at, CURRENT_DATE),
    TRUE
  )
  ON CONFLICT (user_id, plan_id) DO UPDATE
  SET
    started_at = EXCLUDED.started_at,
    is_active = TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_meal_plan_atomic(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_meal_plan_atomic(UUID, DATE) TO authenticated;
