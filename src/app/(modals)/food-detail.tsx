// src/app/(modals)/food-detail.tsx
// Detalle de alimento + selector de porción + botón "Añadir".
// Se abre desde FoodResultCard al seleccionar un alimento.

import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";
import { useManualLog } from "@/features/logging/useManualLog";
import { useUiStore } from "@/stores/uiStore";
import { useLogSessionStore } from "@/stores/logSessionStore";

interface FoodServing {
  id: string;
  serving_name: string;
  serving_grams: number;
  is_default: boolean;
}

interface FoodDetail {
  id: string;
  name: string;
  brand: string | null;
  is_verified: boolean;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  servings: FoodServing[];
}

export default function FoodDetailModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    foodId: string;
    mealType?: string;
  }>();

  const { hapticFeedback, selectedDate } = useUiStore();
  const { mealType: storeMealType } = useLogSessionStore();
  const manualLog = useManualLog();

  const mealType = (params.mealType || storeMealType || "lunch") as
    "breakfast" | "lunch" | "dinner" | "snack";

  // Estado local
  const [food, setFood] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServing, setSelectedServing] = useState<FoodServing | null>(null);
  const [quantityInput, setQuantityInput] = useState("1");

  // Fetch del alimento + porciones
  useEffect(() => {
    async function fetchFood() {
      if (!params.foodId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("foods")
        .select(`
          id, name, brand, is_verified,
          calories_kcal, protein_g, carbs_g, fat_g, fiber_g,
          food_servings ( id, serving_name, serving_grams, is_default )
        `)
        .eq("id", params.foodId)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      const servings: FoodServing[] = [
        // 100g siempre como opción base
        { id: "__100g", serving_name: "100 gramos", serving_grams: 100, is_default: false },
        ...(data.food_servings || []),
      ];

      const fd: FoodDetail = {
        id: data.id,
        name: data.name,
        brand: data.brand,
        is_verified: data.is_verified,
        calories_kcal: data.calories_kcal,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        fiber_g: data.fiber_g ?? 0,
        servings,
      };

      setFood(fd);

      // Seleccionar la porción por defecto o 100g
      const defaultServing = servings.find((s) => s.is_default) || servings[0];
      setSelectedServing(defaultServing);
      setLoading(false);
    }

    fetchFood();
  }, [params.foodId]);

  // Calcular gramos y nutrientes
  const quantity = parseFloat(quantityInput) || 0;
  const totalGrams = selectedServing ? selectedServing.serving_grams * quantity : 0;

  const nutrients = useMemo(() => {
    if (!food || totalGrams <= 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const factor = totalGrams / 100;
    return {
      calories: Math.round(food.calories_kcal * factor),
      protein: Math.round(food.protein_g * factor * 10) / 10,
      carbs: Math.round(food.carbs_g * factor * 10) / 10,
      fat: Math.round(food.fat_g * factor * 10) / 10,
    };
  }, [food, totalGrams]);

  // Handler: añadir al log
  const handleAdd = () => {
    if (!food || totalGrams <= 0) return;
    hapticFeedback("medium");

    manualLog.mutate(
      {
        foodId: food.id,
        servingId: selectedServing?.id === "__100g" ? null : selectedServing?.id ?? null,
        servingQuantity: quantity,
        quantityGrams: totalGrams,
        mealType,
        date: selectedDate,
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  // Loading
  if (loading) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!food) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center px-6">
        <Text className="text-neutral-500 text-center">
          No se encontró el alimento
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4 py-3">
          <Text className="text-primary-500 font-semibold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const MEAL_LABELS: Record<string, string> = {
    breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena", snack: "Snack",
  };

  return (
    <View
      className="flex-1 bg-neutral-50"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pt-6 pb-4"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center mb-1">
          <Text className="font-display text-2xl text-neutral-900 flex-1" numberOfLines={2}>
            {food.name}
          </Text>
          {food.is_verified && (
            <View className="bg-secondary-100 rounded-md px-2 py-1 ml-2">
              <Text className="text-xs text-secondary-700">Verificado</Text>
            </View>
          )}
        </View>
        {food.brand && (
          <Text className="text-sm text-neutral-400 mb-4">{food.brand}</Text>
        )}
        <Text className="text-sm text-neutral-500 mb-6">
          Añadir a: {MEAL_LABELS[mealType]}
        </Text>

        {/* Selector de porción */}
        <Text className="text-sm font-medium text-neutral-700 mb-2">Porción</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerClassName="gap-2"
        >
          {food.servings.map((serving) => (
            <Pressable
              key={serving.id}
              onPress={() => setSelectedServing(serving)}
              accessibilityLabel={`Porción: ${serving.serving_name}, ${serving.serving_grams} gramos`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedServing?.id === serving.id }}
              className={cn(
                "px-4 py-2.5 rounded-xl border-2",
                selectedServing?.id === serving.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 bg-white"
              )}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  selectedServing?.id === serving.id
                    ? "text-primary-700"
                    : "text-neutral-700"
                )}
              >
                {serving.serving_name}
              </Text>
              <Text className="text-xs text-neutral-400">{serving.serving_grams}g</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Cantidad */}
        <Text className="text-sm font-medium text-neutral-700 mb-2">Cantidad</Text>
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => {
              const n = Math.max(0.5, quantity - 0.5);
              setQuantityInput(String(n));
            }}
            accessibilityLabel="Reducir cantidad"
            accessibilityRole="button"
            className="w-12 h-12 rounded-xl bg-neutral-200 items-center justify-center active:bg-neutral-300"
          >
            <Text className="text-xl text-neutral-700">−</Text>
          </Pressable>

          <TextInput
            value={quantityInput}
            onChangeText={setQuantityInput}
            keyboardType="decimal-pad"
            className="flex-1 mx-3 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-center text-lg font-semibold text-neutral-900"
            accessibilityLabel="Cantidad de porciones"
          />

          <Pressable
            onPress={() => {
              const n = quantity + 0.5;
              setQuantityInput(String(n));
            }}
            accessibilityLabel="Aumentar cantidad"
            accessibilityRole="button"
            className="w-12 h-12 rounded-xl bg-neutral-200 items-center justify-center active:bg-neutral-300"
          >
            <Text className="text-xl text-neutral-700">+</Text>
          </Pressable>
        </View>

        {/* Preview nutricional en tiempo real */}
        <View className="bg-white rounded-xl p-4 border border-neutral-100 mb-4">
          <Text className="text-sm text-neutral-500 mb-2">
            {Math.round(totalGrams)}g · Valores nutricionales
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="font-display text-2xl font-bold text-neutral-900">
                {nutrients.calories}
              </Text>
              <Text className="text-xs text-neutral-400">kcal</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="font-display text-lg font-semibold text-secondary-600">
                {nutrients.protein}g
              </Text>
              <Text className="text-xs text-neutral-400">Prot</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="font-display text-lg font-semibold text-primary-600">
                {nutrients.carbs}g
              </Text>
              <Text className="text-xs text-neutral-400">Carbs</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="font-display text-lg font-semibold text-warm-600">
                {nutrients.fat}g
              </Text>
              <Text className="text-xs text-neutral-400">Grasa</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botón añadir fijo abajo */}
      <View className="px-6">
        <Pressable
          onPress={handleAdd}
          disabled={totalGrams <= 0 || manualLog.isPending}
          accessibilityLabel={`Añadir ${food.name} al ${MEAL_LABELS[mealType]}`}
          accessibilityRole="button"
          className={cn(
            "py-4 rounded-2xl items-center",
            totalGrams > 0 && !manualLog.isPending
              ? "bg-primary-500 active:bg-primary-600"
              : "bg-neutral-200"
          )}
        >
          {manualLog.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className={cn(
                "font-semibold text-base",
                totalGrams > 0 ? "text-white" : "text-neutral-400"
              )}
            >
              Añadir {nutrients.calories > 0 ? `· ${nutrients.calories} kcal` : ""}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
