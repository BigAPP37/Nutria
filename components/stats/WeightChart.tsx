// src/components/stats/WeightChart.tsx
// Gráfico de tendencia de peso con victory-native v41 (CartesianChart API).
// Línea suave, tooltip al presionar, placeholder si < 3 puntos.

import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Circle, useFont } from "@shopify/react-native-skia";
import { colors } from "@/lib/constants";
import type { WeightPoint } from "@/features/profile/useWeightHistory";

interface WeightChartProps {
  data: WeightPoint[];
  unit: "kg" | "lb";
}

function WeightChartComponent({ data, unit }: WeightChartProps) {
  // Convertir datos al formato de victory-native v41
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      x: index,
      y: unit === "lb" ? point.weight_kg * 2.20462 : point.weight_kg,
      label: point.date,
    }));
  }, [data, unit]);

  // Estado de press para tooltip
  const { state, isActive } = useChartPressState({
    x: 0,
    y: { y: 0 },
  });

  // Placeholder si pocos datos
  if (data.length < 3) {
    return (
      <View className="bg-white rounded-2xl p-5 border border-neutral-100">
        <Text className="text-sm font-medium text-neutral-700 mb-3">
          Tendencia de peso
        </Text>
        <View className="h-48 items-center justify-center bg-neutral-50 rounded-xl">
          <Text className="text-3xl mb-2">📊</Text>
          <Text className="text-neutral-500 text-center text-sm px-8">
            Registra tu peso regularmente para ver tu tendencia
          </Text>
          <Text className="text-neutral-400 text-xs mt-1">
            Necesitas al menos 3 registros
          </Text>
        </View>
      </View>
    );
  }

  // Calcular rango del eje Y con margen
  const weights = chartData.map((d) => d.y);
  const minY = Math.floor(Math.min(...weights) - 2);
  const maxY = Math.ceil(Math.max(...weights) + 2);

  // Etiquetas del eje X: cada ~2 semanas
  const xLabels = useMemo(() => {
    const step = Math.max(1, Math.floor(data.length / 5));
    return chartData
      .filter((_, i) => i % step === 0 || i === chartData.length - 1)
      .map((d) => {
        const date = new Date(data[d.x].date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
  }, [data]);

  // Tooltip activo
  const activeIndex = isActive ? Math.round(state.x.value.value) : -1;
  const activePoint =
    activeIndex >= 0 && activeIndex < data.length ? data[activeIndex] : null;

  return (
    <View className="bg-white rounded-2xl p-5 border border-neutral-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-neutral-700">
          Tendencia de peso
        </Text>
        {activePoint && (
          <View className="bg-primary-50 rounded-lg px-2.5 py-1">
            <Text className="text-xs font-medium text-primary-700">
              {(unit === "lb"
                ? activePoint.weight_kg * 2.20462
                : activePoint.weight_kg
              ).toFixed(1)}{" "}
              {unit} · {formatDateShort(activePoint.date)}
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 200 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domain={{ y: [minY, maxY] }}
          chartPressState={state}
          axisOptions={{
            tickCount: { x: 5, y: 4 },
            formatXLabel: (val) => {
              const idx = Math.round(val as number);
              if (idx >= 0 && idx < data.length) {
                const d = new Date(data[idx].date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }
              return "";
            },
            formatYLabel: (val) => `${Math.round(val as number)}`,
            labelColor: colors.neutral[400],
            lineColor: colors.neutral[200],
          }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.y}
                color={colors.primary[500]}
                strokeWidth={2.5}
                curveType="natural"
              />
              {/* Punto activo al presionar */}
              {isActive && (
                <Circle
                  cx={state.x.position}
                  cy={state.y.y.position}
                  r={6}
                  color={colors.primary[600]}
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>

      {/* Resumen */}
      <View className="flex-row justify-between mt-3 px-1">
        <View>
          <Text className="text-xs text-neutral-400">Inicio</Text>
          <Text className="text-sm font-medium text-neutral-700">
            {formatWeight(data[0].weight_kg, unit)} {unit}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-neutral-400">Cambio</Text>
          <Text className="text-sm font-medium text-neutral-700">
            {formatDelta(
              data[data.length - 1].weight_kg - data[0].weight_kg,
              unit
            )}{" "}
            {unit}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-neutral-400">Actual</Text>
          <Text className="text-sm font-medium text-neutral-700">
            {formatWeight(data[data.length - 1].weight_kg, unit)} {unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Helpers
function formatWeight(kg: number, unit: "kg" | "lb"): string {
  const val = unit === "lb" ? kg * 2.20462 : kg;
  return val.toFixed(1);
}

function formatDelta(deltaKg: number, unit: "kg" | "lb"): string {
  const val = unit === "lb" ? deltaKg * 2.20462 : deltaKg;
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export const WeightChart = React.memo(WeightChartComponent);
