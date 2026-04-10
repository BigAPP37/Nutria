// src/features/dashboard/useDailyLog.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

export interface DailyLogEntry {
  id: string; meal_type: "breakfast"|"lunch"|"dinner"|"snack"; logged_at: string;
  quantity_grams: number; serving_quantity: number | null;
  calories_kcal: number; protein_g: number; carbs_g: number; fat_g: number;
  logging_method: string; ai_confidence: number | null;
  photo_storage_path: string | null; custom_description: string | null;
  food_name: string | null; food_brand: string | null; serving_name: string | null;
  deleted_at: string | null;
}

interface DailyLogRow extends Omit<DailyLogEntry, "food_name" | "food_brand" | "serving_name"> {
  foods: { name: string | null; brand: string | null }[] | null;
  food_servings: { serving_name: string | null }[] | null;
}

async function fetchDailyLog(userId: string, date: string): Promise<DailyLogEntry[]> {
  const { data, error } = await supabase.from("food_log_entries")
    .select("id,meal_type,logged_at,quantity_grams,serving_quantity,calories_kcal,protein_g,carbs_g,fat_g,fiber_g,logging_method,ai_confidence,photo_storage_path,custom_description,deleted_at,foods(name,brand),food_servings(serving_name)")
    .eq("user_id", userId).eq("log_date", date).is("deleted_at", null).order("logged_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as DailyLogRow[]).map(({ foods, food_servings, ...row }) => ({
    ...row,
    food_name: foods?.[0]?.name ?? null,
    food_brand: foods?.[0]?.brand ?? null,
    serving_name: food_servings?.[0]?.serving_name ?? null,
  }));
}

export function useDailyLog(date: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: queryKeys.dailyLog(date), queryFn: () => fetchDailyLog(userId!, date), enabled: !!userId, staleTime: 1000*60 });
}
