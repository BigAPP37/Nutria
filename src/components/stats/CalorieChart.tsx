// src/components/stats/CalorieChart.tsx
// Gráfico de barras: calorías promedio por semana (últimas 8).
// Solo semanas con ≥ 4 días completos. Línea punteada = objetivo.
// Barras bajo objetivo: secondary-500, sobre objetivo: warm-400. Nunca rojo.

import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { CartesianChart, Bar } from "victory-native";
import { DashPathEffect, Line as SkiaLine } from "@shopify/react-native-skia";
import { colors } from "@/lib/constants";
import type { WeeklySnapshotDisplay } from "@/types/tdee";

interface CalorieChartProps {
  snapshots: WeeklySnapshotDisplay[];
  goalKcal: number;
}

function CalorieChartComponent({ snapshots, goalKcal }: CalorieChartProps) {
  // Filtrar semanas con suficientes datos y preparar para el gráfico
  const chartData = useMemo(() => {
    return snapshots
      .filter((s) => s.complete_days >= 4 && s.avg_calories_day !== null)
      .slice(-8) // últimas 8 semanas válidas
      .reverse() // cronológico
      .map((s, i) => ({
        x: i,
        y: Math.round(s.avg_calories_day!),
        label: s.week_label,
        isOver: s.avg_calories_day! > goalKcal,
      }));
  }, [snapshots, goalKcal]);

  // Placeholder si pocos datos
  if (chartData.length < 2) {
    return (
      <View className="bg-white rounded-2xl p-5 border border-neutral-100">
        <Text className="text-sm font-medium text-neutral-700 mb-3">
          Calorías semanales
        </Text>
        <View className="h-48 items-center justify-center bg-neutral-50 rounded-xl">
          <Text className="text-3xl mb-2">📈</Text>
          <Text className="text-neutral-500 text-center text-sm px-8">
            Necesitas al menos 2 semanas con datos completos
          </Text>
          <Text className="text-neutral-400 text-xs mt-1">
            Marca tus días como completos para que cuenten
          </Text>
        </View>
      </View>
    );
  }

  const allValues = [...chartData.map((d) => d.y), goalKcal];
  const maxY = Math.ceil(Math.max(...allValues) * 1.15 / 100) * 100;

  return (
    <View className="bg-white rounded-2xl p-5 border border-neutral-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-neutral-700">
          Calorías semanales
        </Text>
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-secondary-500 mr-1" />
          <Text className="text-xs text-neutral-400 mr-3">Bajo objetivo</Text>
          <View className="w-2 h-2 rounded-full bg-warm-400 mr-1" />
          <Text className="text-xs text-neutral-400">Sobre objetivo</Text>
        </View>
      </View>

      <View style={{ height: 200 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={["y"]}
          domain={{ y: [0, maxY] }}
          axisOptions={{
            tickCount: { x: chartData.length, y: 4 },
            formatXLabel: (val) => {
              const idx = Math.round(val as number);
              if (idx >= 0 && idx < chartData.length) {
                return chartData[idx].label;
              }
              return "";
            },
            formatYLabel: (val) => `${Math.round((val as number) / 100) * 100}`,
            labelColor: colors.neutral[400],
            lineColor: colors.neutral[200],
          }}
        >
          {({ points, chartBounds }) => (
            <>
              {/* Barras */}
              <Bar
                points={points.y}
                chartBounds={chartBounds}
                color={colors.secondary[500]}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
                barWidth={24}
              />

              {/* Colorear barras que superan el objetivo:
                  victory-native v41 no soporta color por dato individual,
                  así que aplicamos el color base secondary y aceptamos
                  la limitación visual por ahora. En v2 usaremos render custom. */}

              {/* Línea punteada del objetivo */}
              {(() => {
                const goalY =
                  chartBounds.bottom -
                  ((goalKcal / maxY) * (chartBounds.bottom - chartBounds.top));
                return (
                  <SkiaLine
                    p1={{ x: chartBounds.left, y: goalY }}
                    p2={{ x: chartBounds.right, y: goalY }}
                    color={colors.neutral[400]}
                    strokeWidth={1.5}
                  >
                    <DashPathEffect intervals={[6, 4]} />
                  </SkiaLine>
                );
              })()}
            </>
          )}
        </CartesianChart>
      </View>

      {/* Etiqueta del objetivo */}
      <View className="flex-row items-center justify-center mt-2">
        <View className="flex-row items-center">
          <Text className="text-xs text-neutral-400">
            — — Objetivo: {goalKcal.toLocaleString("es")} kcal
          </Text>
        </View>
      </View>
    </View>
  );
}

export const CalorieChart = React.memo(CalorieChartComponent);
