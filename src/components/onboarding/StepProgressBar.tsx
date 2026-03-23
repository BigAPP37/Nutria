// src/components/onboarding/StepProgressBar.tsx
// Barra de progreso animada para el onboarding.
// Se anima suavemente al cambiar de paso con Reanimated v4.

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StepProgressBarProps {
  currentStep: number; // 1-7
  totalSteps: number; // 7
}

export function StepProgressBar({
  currentStep,
  totalSteps,
}: StepProgressBarProps) {
  const insets = useSafeAreaInsets();

  // Paso 1 (welcome) no muestra la barra, así que el progreso efectivo
  // va de paso 2 (0%) a paso 7 (100%)
  const effectiveSteps = totalSteps - 1; // 6 pasos con barra
  const effectiveCurrent = currentStep - 1; // paso 2 = 1, paso 7 = 6
  const targetProgress = Math.min(effectiveCurrent / effectiveSteps, 1);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      className="px-6 pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      {/* Fondo de la barra */}
      <View className="h-1 w-full rounded-full bg-neutral-200 overflow-hidden">
        {/* Relleno animado */}
        <Animated.View
          className="h-full rounded-full bg-primary-500"
          style={animatedStyle}
        />
      </View>
    </View>
  );
}
