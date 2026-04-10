import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import type { UserProfile } from "./useProfile";

type ProfileUpdates = Partial<UserProfile>;

async function updateProfile(
  userId: string,
  updates: ProfileUpdates
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(
      "goal, biological_sex, unit_weight, unit_energy, country_code, display_name, avatar_url, height_cm"
    )
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (updates: ProfileUpdates) => {
      if (!userId) throw new Error("No hay sesión activa");
      return updateProfile(userId, updates);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile(), profile);
    },
  });
}
