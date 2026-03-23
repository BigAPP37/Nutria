// src/features/profile/useProfile.ts
// Query para obtener el perfil del usuario desde user_profiles.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

export interface UserProfile {
  goal: "lose_weight" | "maintain" | "gain_muscle";
  biological_sex: "male" | "female";
  unit_weight: "kg" | "lb";
  unit_energy: "kcal" | "kJ";
  country_code: string;
  display_name: string | null;
  height_cm: number;
}

async function fetchProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "goal, biological_sex, unit_weight, unit_energy, country_code, display_name, height_cm"
    )
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}
