// src/features/logging/useFoodSearch.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useDebounce } from "@/hooks/useDebounce";

export interface FoodSearchResult {
  food_id: string; food_name: string; brand: string | null; category: string;
  calories_kcal: number; protein_g: number; carbs_g: number; fat_g: number;
  origin_country: string | null; is_verified: boolean; combined_rank: number;
}

async function searchFoods(query: string, countryCode: string): Promise<FoodSearchResult[]> {
  const { data, error } = await supabase.rpc("search_foods", { p_query: query, p_embedding: null, p_country: countryCode, p_limit: 30 });
  if (error) throw error;
  return data ?? [];
}

export function useFoodSearch(query: string, countryCode = "ES") {
  const debouncedQuery = useDebounce(query, 300);
  return useQuery({ queryKey: queryKeys.foodSearch(debouncedQuery), queryFn: () => searchFoods(debouncedQuery, countryCode), enabled: debouncedQuery.length >= 2, staleTime: 1000*60*5 });
}
