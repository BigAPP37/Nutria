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
  v_plan_is_premium BOOLEAN;
  v_user_has_premium BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT is_premium
  INTO v_plan_is_premium
  FROM public.meal_plans
  WHERE id = p_plan_id;

  IF v_plan_is_premium IS NULL THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND';
  END IF;

  IF v_plan_is_premium THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = v_user_id
        AND COALESCE(is_premium, FALSE) = TRUE
        AND COALESCE(subscription_status, 'free') IN ('active', 'trialing')
        AND (
          premium_expires_at IS NULL
          OR premium_expires_at > NOW()
        )
    )
    INTO v_user_has_premium;

    IF NOT v_user_has_premium THEN
      RAISE EXCEPTION 'PREMIUM_REQUIRED';
    END IF;
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
