// src/app/(onboarding)/activity.tsx
// Nivel de actividad — paso 4 del onboarding.

import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { routes } from "@/types/navigation";
import { ActivitySelector } from "@/components/onboarding/ActivitySelector";

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activityLevel, setField, nextStep, prevStep } = useOnboardingStore();

  const handleNext = () => {
    if (!activityLevel) return;
    nextStep();
    router.push(routes.onboarding.tcaScreening);
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  return (
    <View
      className="flex-1 bg-neutral-50"
      style={{ paddingBottom: insets.bottom + 24 }}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pt-4 pb-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-display text-2xl text-neutral-900 mb-2">
          ¿Cuánto te mueves?
        </Text>
        <Text className="text-neutral-500 mb-6">
          Elige la opción que mejor describa tu semana típica.
        </Text>
        <ActivitySelector
          value={activityLevel}
          onChange={(l) => setField("activityLevel", l)}
        />
      </ScrollView>

      <View className="flex-row gap-3 px-6">
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
          disabled={!activityLevel}
          accessibilityLabel="Continuar al siguiente paso"
          accessibilityRole="button"
          className={cn(
            "flex-[2] py-4 rounded-2xl items-center",
            activityLevel
              ? "bg-primary-500 active:bg-primary-600"
              : "bg-neutral-200"
          )}
        >
          <Text
            className={cn(
              "font-semibold text-base",
              activityLevel ? "text-white" : "text-neutral-400"
            )}
          >
            Continuar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
