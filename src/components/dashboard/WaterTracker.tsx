// src/components/dashboard/WaterTracker.tsx
// Tracker de agua compacto: 8 vasos tap-able (250ml cada uno = 2000ml total).
// Tap en vacío → añade, long press en lleno → quita.
// Feedback háptico en cada acción.

import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/stores/uiStore";

interface WaterTrackerProps {
  currentMl: number;
  goalMl?: number;
  onAdd: (ml: number) => void;
  onRemove: (ml: number) => void;
}

const GLASS_ML = 250;
const TOTAL_GLASSES = 8;

function WaterGlass({
  index,
  isFull,
  isPartial,
  onTap,
  onLongPress,
}: {
  index: number;
  isFull: boolean;
  isPartial: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const opacity = useSharedValue(isFull || isPartial ? 1 : 0.3);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(isFull ? 1 : isPartial ? 0.6 : 0.3, {
      duration: 300,
    });
  }, [isFull, isPartial, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPress={onTap}
      onLongPress={onLongPress}
      accessibilityLabel={
        isFull
          ? `Vaso ${index + 1}: lleno. Mantén pulsado para quitar`
          : `Vaso ${index + 1}: vacío. Toca para añadir agua`
      }
      accessibilityRole="button"
    >
      <Animated.View
        style={animatedStyle}
        className={cn(
          "w-8 h-8 items-center justify-center rounded-lg",
          isFull ? "bg-secondary-100" : "bg-neutral-100"
        )}
      >
        <Text className="text-lg">💧</Text>
      </Animated.View>
    </Pressable>
  );
}

function WaterTrackerComponent({
  currentMl,
  goalMl = 2000,
  onAdd,
  onRemove,
}: WaterTrackerProps) {
  const { hapticFeedback } = useUiStore();

  const fullGlasses = Math.floor(currentMl / GLASS_ML);
  const hasPartial = currentMl % GLASS_ML > 0;

  const handleTap = (index: number) => {
    // Tap en vaso vacío → añadir
    if (index >= fullGlasses) {
      onAdd(GLASS_ML);
      hapticFeedback("light");
    }
  };

  const handleLongPress = (index: number) => {
    // Long press en vaso lleno → quitar
    if (index < fullGlasses || (index === fullGlasses && hasPartial)) {
      onRemove(GLASS_ML);
      hapticFeedback("light");
    }
  };

  // Formato del texto: "1.5 / 2.0 L"
  const currentL = (currentMl / 1000).toFixed(1);
  const goalL = (goalMl / 1000).toFixed(1);

  return (
    <View className="bg-white rounded-xl px-4 py-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-neutral-700">Agua</Text>
        <Text className="text-sm text-neutral-500">
          {currentL} / {goalL} L
        </Text>
      </View>

      <View className="flex-row justify-between">
        {Array.from({ length: TOTAL_GLASSES }).map((_, i) => (
          <WaterGlass
            key={i}
            index={i}
            isFull={i < fullGlasses}
            isPartial={i === fullGlasses && hasPartial}
            onTap={() => handleTap(i)}
            onLongPress={() => handleLongPress(i)}
          />
        ))}
      </View>
    </View>
  );
}

export const WaterTracker = React.memo(WaterTrackerComponent);
