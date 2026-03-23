// src/app/(onboarding)/tca-screening.tsx
// Screening suave de TCA — paso 5 del onboarding.
// TOTALMENTE OPCIONAL. El botón "Continuar" siempre está activo.
// Si selecciona "Complicada", se muestra un mensaje cálido de apoyo.
// Si no selecciona nada y avanza, se guarda null.

import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";
import { useOnboardingStore } from "@/stores/onboardingStore";
import type { TcaScreeningAnswer } from "@/stores/onboardingStore";

const OPTIONS: Array<{
  key: TcaScreeningAnswer;
  emoji: string;
  text: string;
}> = [
  {
    key: "very_positive",
    emoji: "😊",
    text: "Muy positiva — disfruto comer sin preocupaciones",
  },
  {
    key: "positive",
    emoji: "🙂",
    text: "Positiva — a veces me preocupa un poco",
  },
  {
    key: "neutral",
    emoji: "😐",
    text: "Neutral — no lo pienso mucho",
  },
  {
    key: "complicated",
    emoji: "💛",
    text: "Complicada — tengo o he tenido dificultades",
  },
  {
    key: "prefer_not_to_say",
    emoji: "🤐",
    text: "Prefiero no responder",
  },
];

function OptionCard({
  option,
  isSelected,
  onPress,
}: {
  option: (typeof OPTIONS)[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        accessibilityLabel={option.text}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        className={cn(
          "flex-row items-center px-4 py-3.5 rounded-xl mb-2.5 border-2",
          isSelected
            ? "border-primary-500 bg-primary-50"
            : "border-neutral-200 bg-white"
        )}
      >
        <Text className="text-xl mr-3">{option.emoji}</Text>
        <Text
          className={cn(
            "flex-1 text-base",
            isSelected ? "text-primary-700 font-medium" : "text-neutral-700"
          )}
        >
          {option.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function TcaScreeningScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tcaScreening, setField, nextStep, prevStep } = useOnboardingStore();

  // Mensaje de apoyo visible solo si selecciona "complicated"
  const supportOpacity = useSharedValue(0);
  const supportHeight = useSharedValue(0);

  const supportStyle = useAnimatedStyle(() => ({
    opacity: supportOpacity.value,
    maxHeight: supportHeight.value,
    overflow: "hidden" as const,
  }));

  const handleSelect = (key: TcaScreeningAnswer) => {
    setField("tcaScreening", key);
    if (key === "complicated") {
      supportOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      supportHeight.value = withTiming(160, { duration: 400, easing: Easing.out(Easing.cubic) });
    } else {
      supportOpacity.value = withTiming(0, { duration: 200 });
      supportHeight.value = withTiming(0, { duration: 200 });
    }
  };

  const handleNext = () => {
    // No requiere selección — guardar null si no eligió nada
    nextStep();
    router.push("/(onboarding)/preferences");
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
          Una pregunta personal
        </Text>
        <Text className="text-neutral-500 mb-1">
          ¿Cómo describirías tu relación con la comida?
        </Text>
        <Text className="text-neutral-400 text-sm mb-6">
          Es totalmente opcional — puedes pasar directamente.
        </Text>

        {OPTIONS.map((option) => (
          <OptionCard
            key={option.key}
            option={option}
            isSelected={tcaScreening === option.key}
            onPress={() => handleSelect(option.key)}
          />
        ))}

        {/* Mensaje de apoyo para "complicada" */}
        <Animated.View style={supportStyle}>
          <View className="bg-warm-50 border border-warm-200 rounded-xl p-4 mt-2">
            <Text className="text-warm-700 text-base leading-6">
              💛 Gracias por compartirlo. Nutria está diseñada para ser una
              herramienta de apoyo, nunca de presión. Puedes usar la app a tu
              ritmo, y siempre puedes ocultar las calorías si lo prefieres.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Botones — "Continuar" SIEMPRE activo */}
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
          accessibilityLabel="Continuar al siguiente paso"
          accessibilityRole="button"
          className="flex-[2] py-4 rounded-2xl items-center bg-primary-500 active:bg-primary-600"
        >
          <Text className="text-white font-semibold text-base">Continuar</Text>
        </Pressable>
      </View>
    </View>
  );
}
