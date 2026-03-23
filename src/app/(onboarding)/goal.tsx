// src/app/(onboarding)/goal.tsx
// Selección de objetivo — paso 3 del onboarding.

import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { GoalSelector } from "@/components/onboarding/GoalSelector";

export default function GoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goal, setField, nextStep, prevStep } = useOnboardingStore();

  const handleNext = () => {
    if (!goal) return;
    nextStep();
    router.push("/(onboarding)/activity");
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  return (
    <View
      className="flex-1 bg-neutral-50 px-6 justify-between"
      style={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}
    >
      <View>
        <Text className="font-display text-2xl text-neutral-900 mb-2">
          ¿Cuál es tu objetivo?
        </Text>
        <Text className="text-neutral-500 mb-8">
          Ajustaremos tu plan según lo que quieres conseguir.
        </Text>
        <GoalSelector value={goal} onChange={(g) => setField("goal", g)} />
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={handleBack}
          accessibilityLabel="Volver al paso anterior"
          accessibilityRole="button"
          className="flex-1 py-4 rounded-2xl items-center border border-neutral-200 bg-white active:bg-neutral-100"
        >
          <Text className="text-neutral-600 font-semibold text-base">Atrás</Text>
        </Pressable>
        <Pressable
          onPress={handleNext}
          disabled={!goal}
          accessibilityLabel="Continuar al siguiente paso"
          accessibilityRole="button"
          className={cn(
            "flex-[2] py-4 rounded-2xl items-center",
            goal ? "bg-primary-500 active:bg-primary-600" : "bg-neutral-200"
          )}
        >
          <Text
            className={cn(
              "font-semibold text-base",
              goal ? "text-white" : "text-neutral-400"
            )}
          >
            Continuar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
