// src/app/(onboarding)/ready.tsx
// Pantalla final — paso 7 del onboarding.
// Calcula TDEE con lógica pura local (sin red).
// Muestra objetivo calórico + macros de forma amigable.
// Botón "¡Empezar!" ejecuta submitOnboarding() y el guard redirige a (tabs).

import { useEffect, useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { calculateInitialTdee } from "@/features/tdee/algorithm";
import { submitOnboarding } from "@/features/onboarding/submitOnboarding";

export default function ReadyScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const store = useOnboardingStore();

  // Calcular TDEE — lógica pura, sin llamada de red
  const result = useMemo(() => {
    if (
      !store.weightKg ||
      !store.heightCm ||
      !store.dateOfBirth ||
      !store.biologicalSex ||
      !store.goal ||
      !store.activityLevel
    ) {
      return null;
    }

    return calculateInitialTdee(
      {
        biological_sex: store.biologicalSex,
        date_of_birth: store.dateOfBirth,
        height_cm: store.heightCm,
        activity_level: store.activityLevel,
        goal: store.goal,
      },
      store.weightKg
    );
  }, [
    store.weightKg,
    store.heightCm,
    store.dateOfBirth,
    store.biologicalSex,
    store.goal,
    store.activityLevel,
  ]);

  // Animaciones de entrada escalonadas
  const titleOpacity = useSharedValue(0);
  const numberScale = useSharedValue(0.8);
  const numberOpacity = useSharedValue(0);
  const macrosOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    numberOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    numberScale.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    macrosOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const numberStyle = useAnimatedStyle(() => ({
    opacity: numberOpacity.value,
    transform: [{ scale: numberScale.value }],
  }));
  const macrosStyle = useAnimatedStyle(() => ({ opacity: macrosOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  // Texto del objetivo legible
  const goalText =
    store.goal === "lose_weight"
      ? "Perder peso"
      : store.goal === "gain_muscle"
        ? "Ganar músculo"
        : "Mantener peso";

  // Handler de submit
  const handleStart = async () => {
    if (!userId || store.isSubmitting) return;
    store.setSubmitting(true);
    store.setSubmitError(null);

    try {
      await submitOnboarding(store, userId);
      // Stack.Protected detecta hasCompletedOnboarding = true
      // y redirige automáticamente a (tabs). No hacer router.replace().
    } catch (err: any) {
      store.setSubmitError(
        err.message || "Hubo un error al guardar. Inténtalo de nuevo."
      );
      store.setSubmitting(false);
    }
  };

  if (!result) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <Text className="text-neutral-500">Calculando tu plan...</Text>
      </View>
    );
  }

  const { calorie_goal } = result;

  return (
    <View
      className="flex-1 bg-neutral-50 px-6 justify-between"
      style={{ paddingTop: 24, paddingBottom: insets.bottom + 24 }}
    >
      {/* Contenido principal */}
      <View className="flex-1 justify-center items-center">
        {/* Título */}
        <Animated.View style={titleStyle}>
          <Text className="font-display text-2xl text-neutral-900 text-center mb-2">
            ¡Tu plan está listo! 🎉
          </Text>
          <Text className="text-neutral-500 text-center mb-8">
            Objetivo: {goalText}
          </Text>
        </Animated.View>

        {/* Número grande del objetivo calórico */}
        <Animated.View style={numberStyle} className="items-center mb-8">
          <Text className="text-neutral-500 text-sm mb-1">
            Tu objetivo diario
          </Text>
          <Text className="font-display text-6xl text-primary-600">
            {calorie_goal.goal_kcal.toLocaleString("es")}
          </Text>
          <Text className="text-neutral-400 text-lg">
            {store.unitEnergy}
          </Text>
        </Animated.View>

        {/* Desglose de macros */}
        <Animated.View style={macrosStyle} className="flex-row gap-4 mb-6">
          <MacroBox
            label="Proteína"
            value={calorie_goal.protein_g}
            unit="g"
            color="text-secondary-600"
            bg="bg-secondary-50"
          />
          <MacroBox
            label="Carbos"
            value={calorie_goal.carbs_g}
            unit="g"
            color="text-primary-600"
            bg="bg-primary-50"
          />
          <MacroBox
            label="Grasa"
            value={calorie_goal.fat_g}
            unit="g"
            color="text-warm-600"
            bg="bg-warm-50"
          />
        </Animated.View>

        {/* Etiqueta de confianza */}
        <Animated.View style={macrosStyle}>
          <Text className="text-neutral-400 text-sm text-center">
            {calorie_goal.confidence_label} — irá mejorando cada semana
          </Text>
        </Animated.View>
      </View>

      {/* Error de submit */}
      {store.submitError && (
        <View className="bg-warm-50 border border-warm-200 rounded-xl p-3 mb-3">
          <Text className="text-warm-700 text-sm text-center">
            {store.submitError}
          </Text>
        </View>
      )}

      {/* Botón de empezar */}
      <Animated.View style={buttonStyle}>
        <Pressable
          onPress={handleStart}
          disabled={store.isSubmitting}
          accessibilityLabel="Empezar a usar Nutria"
          accessibilityRole="button"
          className={cn(
            "py-4 rounded-2xl items-center",
            store.isSubmitting
              ? "bg-primary-300"
              : "bg-primary-500 active:bg-primary-600"
          )}
        >
          {store.isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">
              ¡Empezar con Nutria!
            </Text>
          )}
        </Pressable>

        <Text className="text-neutral-400 text-xs text-center mt-3">
          Podrás cambiar tu objetivo y preferencias cuando quieras
        </Text>
      </Animated.View>
    </View>
  );
}

// Subcomponente: caja de macro individual
function MacroBox({
  label,
  value,
  unit,
  color,
  bg,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <View className={cn("flex-1 items-center py-4 rounded-xl", bg)}>
      <Text className={cn("font-display text-2xl font-bold", color)}>
        {value}
        <Text className="text-sm font-normal">{unit}</Text>
      </Text>
      <Text className="text-neutral-500 text-xs mt-1">{label}</Text>
    </View>
  );
}
