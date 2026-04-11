CREATE OR REPLACE FUNCTION public.get_active_user_ids(since_date DATE)
RETURNS TABLE (user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT fle.user_id
  FROM public.food_log_entries fle
  WHERE fle.log_date >= since_date
    AND fle.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_active_user_ids(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_user_ids(DATE) TO service_role;
