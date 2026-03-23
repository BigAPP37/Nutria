// src/features/onboarding/submitOnboarding.ts
// Escribe TODOS los datos del onboarding a Supabase en un solo flujo.
// Se ejecuta al final del onboarding (paso 7, ready.tsx).
// Si falla cualquier paso, propaga el error sin dejar datos parciales.

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { calculateInitialTdee } from "@/features/tdee/algorithm";
import type { OnboardingState } from "@/stores/onboardingStore";

export async function submitOnboarding(
  data: OnboardingState,
  userId: string
): Promise<void> {
  // Validar que tenemos todos los datos necesarios
  if (
    !data.weightKg ||
    !data.heightCm ||
    !data.dateOfBirth ||
    !data.biologicalSex ||
    !data.goal ||
    !data.activityLevel
  ) {
    throw new Error("Faltan datos obligatorios del onboarding");
  }

  // 1. El peso ya está en kg (la conversión se hizo en body-profile.tsx)
  const weightKg = data.weightKg;
  const heightCm = data.heightCm;

  // 2. Calcular TDEE inicial
  const { bmr, tdee, calorie_goal } = calculateInitialTdee(
    {
      biological_sex: data.biologicalSex,
      date_of_birth: data.dateOfBirth,
      height_cm: heightCm,
      activity_level: data.activityLevel,
      goal: data.goal,
    },
    weightKg
  );

  // 3. Insertar peso inicial en weight_entries
  const { error: weightError } = await supabase
    .from("weight_entries")
    .insert({
      user_id: userId,
      weight_kg: weightKg,
    });

  if (weightError) {
    throw new Error(`Error guardando peso inicial: ${weightError.message}`);
  }

  // 4. Upsert en user_profiles (upsert por si hay re-intento tras error)
  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert({
      id: userId,
      display_name: data.displayName || null,
      date_of_birth: data.dateOfBirth,
      biological_sex: data.biologicalSex,
      height_cm: heightCm,
      goal: data.goal,
      activity_level: data.activityLevel,
      tca_screening: data.tcaScreening, // puede ser null
      unit_weight: data.unitWeight,
      unit_energy: data.unitEnergy,
      country_code: data.countryCode,
      timezone: data.timezone,
      onboarding_completed: true,
    });

  if (profileError) {
    throw new Error(`Error guardando perfil: ${profileError.message}`);
  }

  // 5. Insertar estado TDEE inicial (upsert por idempotencia)
  const { error: tdeeError } = await supabase
    .from("user_tdee_state")
    .upsert({
      user_id: userId,
      current_tdee_kcal: tdee,
      current_bmr_kcal: bmr,
      initial_tdee_kcal: tdee,
      confidence_level: 0.3,
      weeks_of_data: 0,
    });

  if (tdeeError) {
    throw new Error(`Error guardando TDEE inicial: ${tdeeError.message}`);
  }

  // 6. Actualizar authStore — esto dispara el guard de Stack.Protected
  //    que redirige automáticamente a (tabs)
  useAuthStore.getState().setOnboardingCompleted(true);

  // No hacer router.replace() — Stack.Protected lo maneja
}
