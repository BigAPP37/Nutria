// src/components/dashboard/MacroRing.tsx
// Anillo SVG animado de progreso calórico — componente hero del dashboard.
// REGLA: sin rojo nunca. Colores van de naranja → verde → ámbar → gris.

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "@/lib/constants";

// DECLARADO FUERA del componente — obligatorio con React 19 + Reanimated v4
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

/** Devuelve el color del anillo según el ratio consumido/objetivo */
function getRingColor(ratio: number): string {
  if (ratio <= 0.9) return colors.primary[500];     // naranja: progresando
  if (ratio <= 1.0) return colors.secondary[500];   // verde menta: meta cerca
  if (ratio <= 1.1) return colors.warm[400];         // ámbar: superado un poco
  return colors.neutral[400];                         // gris suave: >110%
}

function MacroRingComponent({
  consumed,
  goal,
  size = 200,
  strokeWidth = 14,
}: MacroRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Ratio clampeado a 0-1 para el anillo (visualmente no pasa de 100%)
  const visualRatio = Math.min(consumed / Math.max(goal, 1), 1);
  const colorRatio = consumed / Math.max(goal, 1); // sin clamp para color

  // Valor animado del progreso (0 a 1)
  const progress = useSharedValue(0);

  useEffect(() => {
    // Al montar: animar desde 0
    // eslint-disable-next-line react-hooks/immutability
    progress.value = withTiming(visualRatio, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, visualRatio]);

  useEffect(() => {
    // Al cambiar consumed: animar al nuevo valor
    // eslint-disable-next-line react-hooks/immutability
    progress.value = withTiming(visualRatio, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, visualRatio]);

  // Props animadas del círculo de progreso
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Texto central
  const remaining = goal - consumed;
  const isOver = consumed > goal;
  const displayNumber = Math.abs(Math.round(remaining));
  const label = isOver ? "de más" : "restantes";

  const ringColor = getRingColor(colorRatio);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG del anillo */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Anillo de fondo */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.neutral[200]}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Anillo de progreso — rotado -90° para empezar desde arriba */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>

      {/* Número central — posición absoluta encima del SVG */}
      <View className="absolute items-center justify-center">
        <Text className="font-display text-4xl font-bold text-neutral-900">
          {displayNumber.toLocaleString("es")}
        </Text>
        <Text className="text-sm text-neutral-500 mt-0.5">
          kcal {label}
        </Text>
      </View>
    </View>
  );
}

export const MacroRing = React.memo(MacroRingComponent);
