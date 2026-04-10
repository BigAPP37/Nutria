// src/components/stats/TdeeCard.tsx
// Card con objetivo calórico, barra de confianza y mensaje contextual.
// NUNCA muestra el TDEE crudo — solo goal_kcal.

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";
import type { TdeeDisplayState } from "@/types/tdee";

interface TdeeCardProps {
  tdeeState: TdeeDisplayState;
}

/** Mensaje contextual según nivel de confianza */
function getContextMessage(confidence: number): string {
  if (confidence < 0.3) {
    return "Registra tu peso semanalmente para mejorar la precisión";
  }
  if (confidence < 0.6) {
    return "Tu plan se está ajustando, sigue registrando";
  }
  return "Tu plan está bastante ajustado a ti";
}

/** Color de la barra de confianza */
function getConfidenceColor(confidence: number): string {
  if (confidence < 0.3) return "bg-neutral-400";
  if (confidence < 0.6) return "bg-warm-400";
  return "bg-secondary-500";
}

function TdeeCardComponent({ tdeeState }: TdeeCardProps) {
  const {
    goal_kcal,
    confidence_level,
    confidence_label,
    weeks_of_data,
    macro_targets,
  } = tdeeState;

  // Animación de la barra de confianza
  const barWidth = useSharedValue(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    barWidth.value = withTiming(confidence_level * 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [barWidth, confidence_level]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  return (
    <View className="bg-white rounded-2xl p-5 border border-neutral-100">
      {/* Etiqueta + número */}
      <Text className="text-sm text-neutral-500 mb-1">Tu objetivo diario</Text>
      <View className="flex-row items-baseline mb-4">
        <Text className="font-display text-4xl font-bold text-neutral-900">
          {goal_kcal.toLocaleString("es")}
        </Text>
        <Text className="text-lg text-neutral-400 ml-1">kcal</Text>
      </View>

      {/* Macros objetivo */}
      <View className="flex-row gap-4 mb-5">
        <View className="flex-1 bg-secondary-50 rounded-xl py-2 items-center">
          <Text className="font-semibold text-secondary-700">{macro_targets.protein_g}g</Text>
          <Text className="text-xs text-neutral-400">Proteína</Text>
        </View>
        <View className="flex-1 bg-primary-50 rounded-xl py-2 items-center">
          <Text className="font-semibold text-primary-700">{macro_targets.carbs_g}g</Text>
          <Text className="text-xs text-neutral-400">Carbos</Text>
        </View>
        <View className="flex-1 bg-warm-50 rounded-xl py-2 items-center">
          <Text className="font-semibold text-warm-700">{macro_targets.fat_g}g</Text>
          <Text className="text-xs text-neutral-400">Grasa</Text>
        </View>
      </View>

      {/* Barra de confianza */}
      <Text className="text-xs text-neutral-500 mb-1.5">
        Precisión del plan
      </Text>
      <View className="h-2 rounded-full bg-neutral-200 overflow-hidden mb-2">
        <Animated.View
          className={cn("h-full rounded-full", getConfidenceColor(confidence_level))}
          style={barStyle}
        />
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs text-neutral-500">{confidence_label}</Text>
        <Text className="text-xs text-neutral-400">
          {Math.round(confidence_level * 100)}%
        </Text>
      </View>

      {/* Mensaje contextual */}
      <View className="bg-neutral-50 rounded-xl px-3.5 py-2.5">
        <Text className="text-sm text-neutral-600">
          💡 {getContextMessage(confidence_level)}
        </Text>
        {weeks_of_data > 0 && (
          <Text className="text-xs text-neutral-400 mt-1">
            Basado en {weeks_of_data} semana{weeks_of_data !== 1 ? "s" : ""} de datos
          </Text>
        )}
      </View>
    </View>
  );
}

export const TdeeCard = React.memo(TdeeCardComponent);
