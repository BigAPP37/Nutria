// src/app/(tabs)/index.tsx
// Dashboard diario — pantalla principal de Nutria.
// El usuario la ve 3+ veces al día. Prioridad: velocidad y claridad.

import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { isTodayDateKey, parseDateKey, shiftDateKey } from "@/lib/date";
import { queryKeys } from "@/lib/constants";

// Queries y mutations
import { useDailyLog } from "@/features/dashboard/useDailyLog";
import { useMarkDayComplete } from "@/features/dashboard/useMarkDayComplete";
import { useWaterLog, useAddWater, useRemoveWater } from "@/features/dashboard/useWaterLog";
import { useDeleteLogEntry } from "@/features/logging/useDeleteLogEntry";
import { useTdeeState } from "@/features/tdee/useTdeeState";

// Stores
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

// Componentes
import { MacroRing } from "@/components/dashboard/MacroRing";
import { MacroBars } from "@/components/dashboard/MacroBars";
import { WaterTracker } from "@/components/dashboard/WaterTracker";
import { MealCard } from "@/components/dashboard/MealCard";

// Tipos
import type { DailyLogEntry } from "@/features/dashboard/useDailyLog";

// ─── Constantes ──────────────────────────────────────────────
const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_ORDER)[number];

// ─── Helpers ─────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

function formatDateLabel(dateStr: string): string {
  if (isTodayDateKey(dateStr)) return "Hoy";
  const d = parseDateKey(dateStr);
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

// ─── Componente Principal ────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Stores
  const { selectedDate, setSelectedDate, goToToday, hapticFeedback } =
    useUiStore();
  const user = useAuthStore((s) => s.user);

  const isTodaySelected = isTodayDateKey(selectedDate);

  // Queries
  const { data: entries = [], isLoading: logLoading, error: logError } =
    useDailyLog(selectedDate);
  const { data: tdee, isLoading: tdeeLoading } = useTdeeState();
  const { data: waterData } = useWaterLog(selectedDate);

  // Mutations
  const deleteEntry = useDeleteLogEntry();
  const markComplete = useMarkDayComplete();
  const addWater = useAddWater();
  const removeWater = useRemoveWater();

  // Nombre del usuario
  const userName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "";

  // ─── Cálculos derivados ──────────────────────────────────

  // Totales del día
  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          calories: acc.calories + (e.calories_kcal ?? 0),
          protein: acc.protein + (e.protein_g ?? 0),
          carbs: acc.carbs + (e.carbs_g ?? 0),
          fat: acc.fat + (e.fat_g ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [entries]
  );

  // Agrupar entradas por meal_type
  const groupedMeals = useMemo(() => {
    const map = new Map<MealType, DailyLogEntry[]>();
    for (const meal of MEAL_ORDER) map.set(meal, []);
    for (const entry of entries) {
      const list = map.get(entry.meal_type as MealType);
      if (list) list.push(entry);
    }
    return map;
  }, [entries]);

  // Estado de expansión de meals (local)
  const [mealVisibilityOverrides, setMealVisibilityOverrides] = useState<
    Partial<Record<MealType, boolean>>
  >({});

  const expandedMeals = useMemo(() => {
    const state: Record<MealType, boolean> = {
      breakfast: false,
      lunch: false,
      dinner: false,
      snack: false,
    };

    for (const meal of MEAL_ORDER) {
      const mealEntries = groupedMeals.get(meal) ?? [];
      state[meal] = mealVisibilityOverrides[meal] ?? mealEntries.length > 0;
    }

    return state;
  }, [groupedMeals, mealVisibilityOverrides]);

  const toggleMeal = useCallback((meal: string) => {
    hapticFeedback("light");
    setMealVisibilityOverrides((prev) => ({
      ...prev,
      [meal]: !expandedMeals[meal as MealType],
    }));
  }, [expandedMeals, hapticFeedback]);

  // ─── Handlers ────────────────────────────────────────────

  const handleDatePrev = () => {
    setSelectedDate(shiftDateKey(selectedDate, -1));
  };

  const handleDateNext = () => {
    // No permitir fechas futuras
    if (!isTodaySelected) {
      setSelectedDate(shiftDateKey(selectedDate, 1));
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    hapticFeedback("medium");
    deleteEntry.mutate(entryId);
  };

  const handleMarkComplete = () => {
    hapticFeedback("heavy");
    markComplete.mutate({ date: selectedDate, totals });
  };

  const handleAddWater = (ml: number) => {
    addWater.mutate({ date: selectedDate, ml });
  };

  const handleRemoveWater = (ml: number) => {
    if ((waterData?.amount_ml ?? 0) <= 0) return;
    removeWater.mutate({ date: selectedDate, ml });
  };

  // ─── Render ──────────────────────────────────────────────

  // Estado de carga: skeleton
  if (logLoading && entries.length === 0) {
    return (
      <View
        className="flex-1 bg-neutral-50 px-6"
        style={{ paddingTop: insets.top + 12 }}
      >
        {/* Saludo */}
        <Text className="font-display text-xl text-neutral-900">
          {getGreeting()}{userName ? `, ${userName}` : ""} 👋
        </Text>

        {/* Skeleton del anillo */}
        <View className="items-center mt-8 mb-6">
          <View className="w-[200px] h-[200px] rounded-full bg-neutral-100" />
        </View>

        {/* Skeleton cards */}
        <View className="h-20 rounded-xl bg-neutral-100 mb-3" />
        <View className="h-20 rounded-xl bg-neutral-100 mb-3" />
      </View>
    );
  }

  // Estado de error
  if (logError) {
    return (
      <View
        className="flex-1 bg-neutral-50 px-6 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-neutral-500 text-center mb-4">
          No pudimos cargar tus datos.{"\n"}Comprueba tu conexión.
        </Text>
        <Pressable
          onPress={() => {
            deleteEntry.reset();
            markComplete.reset();
            queryClient.invalidateQueries({ queryKey: queryKeys.dailyLog(selectedDate) });
            queryClient.invalidateQueries({ queryKey: queryKeys.waterLog(selectedDate) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tdeeState() });
          }}
          className="bg-primary-500 px-6 py-3 rounded-xl"
          accessibilityLabel="Reintentar carga de datos"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const goalKcal = tdee?.goal_kcal ?? 0;
  const macroTargets = tdee?.macro_targets ?? null;

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="pb-32"
      showsVerticalScrollIndicator={false}
    >
      {/* ═══ 1. HEADER ═══ */}
      <View
        className="px-6 pt-3 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        {/* Saludo */}
        <Text className="font-display text-xl text-neutral-900 mb-3">
          {getGreeting()}{userName ? `, ${userName}` : ""} 👋
        </Text>

        {/* Selector de fecha */}
        <View className="flex-row items-center justify-center mb-1">
          <Pressable
            onPress={handleDatePrev}
            accessibilityLabel="Día anterior"
            accessibilityRole="button"
            className="p-2"
          >
            <Text className="text-xl text-neutral-500">◀</Text>
          </Pressable>

          <Pressable
            onPress={goToToday}
            accessibilityLabel="Ir a hoy"
            accessibilityRole="button"
            className="px-4 py-1.5 mx-2 rounded-lg bg-white"
          >
            <Text className="text-base font-medium text-neutral-800">
              {formatDateLabel(selectedDate)}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDateNext}
            disabled={isTodaySelected}
            accessibilityLabel="Día siguiente"
            accessibilityRole="button"
            className="p-2"
          >
            <Text
              className={cn(
                "text-xl",
                isTodaySelected ? "text-neutral-200" : "text-neutral-500"
              )}
            >
              ▶
            </Text>
          </Pressable>
        </View>

        {/* Badge de historial */}
        {!isTodaySelected && (
          <View className="items-center">
            <View className="bg-warm-100 rounded-full px-3 py-0.5">
              <Text className="text-xs text-warm-700">Historial</Text>
            </View>
          </View>
        )}
      </View>

      {/* ═══ 2. MACRO RING ═══ */}
      <View className="items-center py-4">
        {tdeeLoading ? (
          <View className="w-[200px] h-[200px] rounded-full bg-neutral-100" />
        ) : !tdee ? (
          <View className="w-[200px] h-[200px] rounded-full bg-neutral-100 items-center justify-center px-8">
            <Text className="text-center text-sm text-neutral-500">
              Completa el onboarding para ver tu objetivo diario.
            </Text>
          </View>
        ) : (
          <MacroRing consumed={totals.calories} goal={goalKcal} />
        )}

        {/* Consumido / Objetivo en texto debajo del anillo */}
        <Text className="text-sm text-neutral-500 mt-2">
          {Math.round(totals.calories).toLocaleString("es")} /{" "}
          {tdee ? `${goalKcal.toLocaleString("es")} kcal` : "objetivo pendiente"}
        </Text>
      </View>

      {/* ═══ 3. MINI BARRAS DE MACROS ═══ */}
      <View className="px-6 mb-5">
        {macroTargets ? (
          <MacroBars consumed={totals} targets={macroTargets} />
        ) : (
          <View className="rounded-2xl border border-neutral-100 bg-white px-4 py-4">
            <Text className="text-sm text-neutral-500">
              Tus objetivos de macros aparecerán cuando el plan esté configurado.
            </Text>
          </View>
        )}
      </View>

      {/* ═══ 4. AGUA ═══ */}
      {isTodaySelected && (
        <View className="px-6 mb-5">
          <WaterTracker
            currentMl={waterData?.amount_ml ?? 0}
            onAdd={handleAddWater}
            onRemove={handleRemoveWater}
          />
        </View>
      )}

      {/* ═══ 5. COMIDAS ═══ */}
      <View className="px-6 mb-4">
        <Text className="text-sm font-medium text-neutral-500 mb-2 uppercase tracking-wide">
          Comidas
        </Text>

        {MEAL_ORDER.map((meal) => (
          <MealCard
            key={meal}
            mealType={meal}
            entries={groupedMeals.get(meal) ?? []}
            isExpanded={expandedMeals[meal] ?? false}
            onToggle={() => toggleMeal(meal)}
            onDeleteEntry={handleDeleteEntry}
          />
        ))}
      </View>

      {/* ═══ 6. MARCAR DÍA COMPLETO ═══ */}
      {isTodaySelected && entries.length > 0 && (
        <View className="px-6 mb-6">
          <Pressable
            onPress={handleMarkComplete}
            disabled={markComplete.isPending}
            accessibilityLabel="Marcar que he terminado de logear hoy"
            accessibilityRole="button"
            className={cn(
              "flex-row items-center justify-center py-3.5 rounded-xl border",
              markComplete.isSuccess
                ? "bg-secondary-50 border-secondary-200"
                : "bg-white border-neutral-200 active:bg-neutral-50"
            )}
          >
            {markComplete.isPending ? (
              <ActivityIndicator size="small" color="#78716C" />
            ) : (
              <>
                <Text className="text-lg mr-2">
                  {markComplete.isSuccess ? "✅" : "📝"}
                </Text>
                <Text
                  className={cn(
                    "text-base font-medium",
                    markComplete.isSuccess
                      ? "text-secondary-700"
                      : "text-neutral-700"
                  )}
                >
                  {markComplete.isSuccess
                    ? "Día marcado como completo"
                    : "He terminado de logear hoy"}
                </Text>
              </>
            )}
          </Pressable>

          {markComplete.isSuccess && (
            <Text className="text-xs text-neutral-400 text-center mt-2">
              Estos datos se usarán para mejorar tu plan
            </Text>
          )}
        </View>
      )}

      {/* Estado vacío */}
      {entries.length === 0 && (
        <View className="px-6 items-center py-8">
          <Text className="text-5xl mb-3">🍽️</Text>
          <Text className="text-base text-neutral-500 text-center">
            {isTodaySelected
              ? "Todavía no has registrado nada hoy.\nToca el + para empezar."
              : "No hay registros para este día."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
