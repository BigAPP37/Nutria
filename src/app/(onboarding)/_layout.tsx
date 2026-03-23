// src/app/(onboarding)/_layout.tsx
// Layout del grupo de onboarding: Stack con transición slide_from_right.
// Incluye barra de progreso animada visible en todos los pasos excepto welcome.

import { Stack } from "expo-router";
import { View } from "react-native";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { StepProgressBar } from "@/components/onboarding/StepProgressBar";

export default function OnboardingLayout() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Barra de progreso: visible en pasos 2-7, oculta en welcome (paso 1) */}
      {currentStep > 1 && (
        <StepProgressBar currentStep={currentStep} totalSteps={7} />
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: false,
          contentStyle: { backgroundColor: "#FAFAF9" },
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="body-profile" />
        <Stack.Screen name="goal" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="tca-screening" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="ready" />
      </Stack>
    </View>
  );
}
