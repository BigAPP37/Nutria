// src/components/logging/FoodResultCard.tsx
// Card compacta de resultado de búsqueda de alimento.
// Muestra: nombre, marca, kcal/100g, badge verificado, bandera de país.

import { View, Text, Pressable } from "react-native";
import type { FoodSearchResult } from "@/features/logging/useFoodSearch";

// Banderas emoji por código de país
const FLAGS: Record<string, string> = {
  ES: "🇪🇸", MX: "🇲🇽", AR: "🇦🇷", CO: "🇨🇴", CL: "🇨🇱",
  PE: "🇵🇪", VE: "🇻🇪", EC: "🇪🇨", BO: "🇧🇴", UY: "🇺🇾",
};

interface FoodResultCardProps {
  food: FoodSearchResult;
  onSelect: (food: FoodSearchResult) => void;
}

export function FoodResultCard({ food, onSelect }: FoodResultCardProps) {
  const flag = food.origin_country ? FLAGS[food.origin_country] : null;

  return (
    <Pressable
      onPress={() => onSelect(food)}
      accessibilityLabel={`${food.food_name}${food.brand ? `, ${food.brand}` : ""}, ${Math.round(food.calories_kcal)} kilocalorías por 100 gramos`}
      accessibilityRole="button"
      className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-2 border border-neutral-100 active:bg-neutral-50"
    >
      {/* Nombre + marca + bandera */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-center">
          <Text className="text-base font-medium text-neutral-800 flex-shrink" numberOfLines={1}>
            {food.food_name}
          </Text>
          {flag && <Text className="text-sm ml-1.5">{flag}</Text>}
          {food.is_verified && (
            <View className="bg-secondary-100 rounded px-1 py-0.5 ml-1.5">
              <Text className="text-[10px] text-secondary-700">✓</Text>
            </View>
          )}
        </View>
        {food.brand && (
          <Text className="text-sm text-neutral-400 mt-0.5" numberOfLines={1}>
            {food.brand}
          </Text>
        )}
      </View>

      {/* Calorías por 100g */}
      <View className="items-end">
        <Text className="text-base font-semibold text-neutral-700">
          {Math.round(food.calories_kcal)}
        </Text>
        <Text className="text-xs text-neutral-400">kcal/100g</Text>
      </View>
    </Pressable>
  );
}
