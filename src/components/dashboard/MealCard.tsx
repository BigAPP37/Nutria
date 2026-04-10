// src/components/dashboard/MealCard.tsx
// Tarjeta expandible por tipo de comida (desayuno/almuerzo/cena/snack).
// Header tap expande/colapsa. Entries con badge de estimación IA.
// Long press en entrada → confirmación de eliminar (soft delete).

import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { DailyLogEntry } from "@/features/dashboard/useDailyLog";

interface MealCardProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  entries: DailyLogEntry[];
  isExpanded: boolean;
  onToggle: () => void;
  onDeleteEntry: (id: string) => void;
}

// Mapeo de meal_type a español
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

// Subcomponente: fila de una entrada individual
function LogEntryRow({
  entry,
  onDelete,
}: {
  entry: DailyLogEntry;
  onDelete: () => void;
}) {
  const name = entry.food_name || entry.custom_description || "Alimento";
  const showEstimationBadge =
    entry.ai_confidence !== null && entry.ai_confidence < 0.6;

  const handleLongPress = () => {
    Alert.alert(
      "Eliminar entrada",
      `¿Quieres eliminar "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      accessibilityLabel={`${name}, ${Math.round(entry.calories_kcal ?? 0)} kilocalorías. Mantén pulsado para eliminar`}
      accessibilityRole="button"
      className="flex-row items-center py-2.5 border-b border-neutral-100 last:border-b-0"
    >
      {/* Nombre + badge */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-center">
          <Text
            className="text-base text-neutral-800 flex-shrink"
            numberOfLines={1}
          >
            {name}
          </Text>
          {showEstimationBadge && (
            <View className="bg-warm-100 rounded-md px-1.5 py-0.5 ml-2">
              <Text className="text-xs text-warm-700">Estimación</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-neutral-400 mt-0.5">
          {Math.round(entry.quantity_grams)}g
        </Text>
      </View>

      {/* Calorías */}
      <Text className="text-base font-medium text-neutral-700">
        {Math.round(entry.calories_kcal ?? 0)}{" "}
        <Text className="text-xs font-normal text-neutral-400">kcal</Text>
      </Text>
    </Pressable>
  );
}

export function MealCard({
  mealType,
  entries,
  isExpanded,
  onToggle,
  onDeleteEntry,
}: MealCardProps) {
  const label = MEAL_LABELS[mealType];
  const emoji = MEAL_EMOJIS[mealType];
  const totalKcal = entries.reduce((s, e) => s + (e.calories_kcal ?? 0), 0);
  const hasEntries = entries.length > 0;

  // Animación de expansión/colapso
  const bodyHeight = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    bodyHeight.value = withTiming(isExpanded ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [bodyHeight, isExpanded]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyHeight.value,
    maxHeight: bodyHeight.value * 600, // suficiente para ~10 entradas
    overflow: "hidden" as const,
  }));

  // Rotación del chevron
  const chevronRotation = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    chevronRotation.value = withTiming(isExpanded ? 1 : 0, { duration: 250 });
  }, [chevronRotation, isExpanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 180}deg` }],
  }));

  return (
    <View className="bg-white rounded-xl mb-3 overflow-hidden">
      {/* Header — siempre visible */}
      <Pressable
        onPress={onToggle}
        accessibilityLabel={`${label}: ${Math.round(totalKcal)} kilocalorías, ${entries.length} entradas`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        className="flex-row items-center px-4 py-3.5"
      >
        <Text className="text-xl mr-2.5">{emoji}</Text>
        <Text className="flex-1 text-base font-semibold text-neutral-800">
          {label}
        </Text>

        {hasEntries ? (
          <Text className="text-base text-neutral-600 mr-2">
            {Math.round(totalKcal)}{" "}
            <Text className="text-xs text-neutral-400">kcal</Text>
          </Text>
        ) : (
          <Text className="text-sm text-primary-500 mr-2">
            + Añadir
          </Text>
        )}

        {/* Chevron */}
        {hasEntries && (
          <Animated.View style={chevronStyle}>
            <Text className="text-neutral-400 text-sm">▼</Text>
          </Animated.View>
        )}
      </Pressable>

      {/* Body — lista de entradas */}
      {hasEntries && (
        <Animated.View style={bodyStyle}>
          <View className="px-4 pb-3 border-t border-neutral-100">
            {entries.map((entry) => (
              <LogEntryRow
                key={entry.id}
                entry={entry}
                onDelete={() => onDeleteEntry(entry.id)}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
