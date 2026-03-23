// src/components/stats/WeeklySnapshotCard.tsx
// Card compacta de resumen semanal del algoritmo TDEE.
// Muestra: semana, días completos, calorías, delta peso, badge de estado.
// Deltas de peso SIEMPRE en neutral — ni verde ni rojo.

import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/cn";
import type { WeeklySnapshotDisplay } from "@/types/tdee";

interface WeeklySnapshotCardProps {
  snapshot: WeeklySnapshotDisplay;
}

function WeeklySnapshotCardComponent({ snapshot }: WeeklySnapshotCardProps) {
  const {
    week_label,
    avg_weight_kg,
    weight_delta_kg,
    avg_calories_day,
    complete_days,
    was_adjusted,
    adjustment_kcal,
  } = snapshot;

  const hasEnoughData = complete_days >= 4;

  return (
    <View className="bg-white rounded-xl px-4 py-3 mb-2 border border-neutral-100">
      <View className="flex-row items-center justify-between">
        {/* Semana label */}
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-800">
            {week_label}
          </Text>
          <Text className="text-xs text-neutral-400 mt-0.5">
            {complete_days}/7 días completos
          </Text>
        </View>

        {/* Datos de la semana */}
        {hasEnoughData ? (
          <View className="flex-row items-center gap-4">
            {/* Calorías promedio */}
            {avg_calories_day !== null && (
              <View className="items-end">
                <Text className="text-sm font-medium text-neutral-700">
                  {Math.round(avg_calories_day)}
                </Text>
                <Text className="text-xs text-neutral-400">kcal/día</Text>
              </View>
            )}

            {/* Delta de peso — siempre neutral */}
            {weight_delta_kg !== null && (
              <View className="items-end min-w-[52px]">
                <Text className="text-sm font-medium text-neutral-700">
                  {weight_delta_kg >= 0 ? "+" : ""}
                  {weight_delta_kg.toFixed(1)} kg
                </Text>
                <Text className="text-xs text-neutral-400">Δ peso</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="bg-neutral-100 rounded-lg px-2.5 py-1">
            <Text className="text-xs text-neutral-500">Sin datos</Text>
          </View>
        )}
      </View>

      {/* Badge de ajuste TDEE */}
      {was_adjusted && hasEnoughData && (
        <View className="flex-row items-center mt-2 pt-2 border-t border-neutral-50">
          <View className="bg-primary-50 rounded-md px-2 py-0.5">
            <Text className="text-xs text-primary-700">
              Plan ajustado {adjustment_kcal > 0 ? "+" : ""}
              {adjustment_kcal} kcal
            </Text>
          </View>
        </View>
      )}

      {/* Badge de semana atípica */}
      {!hasEnoughData && complete_days > 0 && (
        <View className="flex-row items-center mt-2 pt-2 border-t border-neutral-50">
          <View className="bg-warm-50 rounded-md px-2 py-0.5">
            <Text className="text-xs text-warm-700">
              Semana incompleta — no se usó para ajustar
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export const WeeklySnapshotCard = React.memo(WeeklySnapshotCardComponent);
