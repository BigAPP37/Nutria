// src/components/dashboard/MacroBars.tsx
// 3 mini barras de progreso para macronutrientes.
// Colores: proteína=secondary, carbos=primary, grasa=warm.
// Si supera el objetivo: barra al 100% + neutral-400. Sin alarma.

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";

interface MacroBarsProps {
  consumed: { protein: number; carbs: number; fat: number };
  targets: { protein_g: number; carbs_g: number; fat_g: number };
}

interface BarConfig {
  label: string;
  consumed: number;
  target: number;
  color: string;        // clase NativeWind para el fondo de la barra
  overColor: string;    // color cuando se pasa del objetivo
}

function MacroBar({
  label,
  consumed,
  target,
  color,
  overColor,
}: BarConfig) {
  const ratio = target > 0 ? consumed / target : 0;
  const clamped = Math.min(ratio, 1);
  const isOver = ratio > 1;

  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(clamped * 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [consumed, target]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View className="mb-3">
      {/* Labels */}
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-neutral-600">{label}</Text>
        <Text className="text-sm text-neutral-500">
          {Math.round(consumed)}g / {target}g
        </Text>
      </View>

      {/* Barra */}
      <View className="h-2.5 rounded-full bg-neutral-200 overflow-hidden">
        <Animated.View
          className={cn("h-full rounded-full", isOver ? overColor : color)}
          style={animatedStyle}
        />
      </View>
    </View>
  );
}

function MacroBarsComponent({ consumed, targets }: MacroBarsProps) {
  const bars: BarConfig[] = [
    {
      label: "Proteína",
      consumed: consumed.protein,
      target: targets.protein_g,
      color: "bg-secondary-500",
      overColor: "bg-neutral-400",
    },
    {
      label: "Carbos",
      consumed: consumed.carbs,
      target: targets.carbs_g,
      color: "bg-primary-500",
      overColor: "bg-neutral-400",
    },
    {
      label: "Grasa",
      consumed: consumed.fat,
      target: targets.fat_g,
      color: "bg-warm-500",
      overColor: "bg-neutral-400",
    },
  ];

  return (
    <View className="px-2">
      {bars.map((bar) => (
        <MacroBar key={bar.label} {...bar} />
      ))}
    </View>
  );
}

export const MacroBars = React.memo(MacroBarsComponent);
