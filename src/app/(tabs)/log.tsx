// src/app/(tabs)/log.tsx
// Hub principal de logging — orquesta foto, texto, búsqueda manual.
// Lee step y method de logSessionStore y renderiza el componente correcto.

import { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { useLogSessionStore } from "@/stores/logSessionStore";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { useAiLog } from "@/features/logging/useAiLog";
import { useDailyLog } from "@/features/dashboard/useDailyLog";
import { useProfile } from "@/features/profile/useProfile";
import { TextLogInput } from "@/components/logging/TextLogInput";
import { FoodSearchBar } from "@/components/logging/FoodSearchBar";
import { AiConfirmSheet } from "@/components/logging/AiConfirmSheet";
import type { FoodSearchResult } from "@/features/logging/useFoodSearch";
import { foodDetailRoute, routes } from "@/types/navigation";

// ─── Constantes ──────────────────────────────────────────────

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_OPTIONS: Array<{ key: MealType; label: string; emoji: string }> = [
  { key: "breakfast", label: "Desayuno", emoji: "🌅" },
  { key: "lunch", label: "Almuerzo", emoji: "☀️" },
  { key: "dinner", label: "Cena", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍎" },
];

const ANALYZING_TEXTS = [
  "Identificando alimentos...",
  "Estimando porciones...",
  "Calculando nutrientes...",
];

/** Infiere la comida por hora del día */
function inferMealType(): MealType {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 21) return "dinner";
  return "snack";
}

// ─── Componente Principal ────────────────────────────────────

export default function LogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ mealType?: string }>();

  const userId = useAuthStore((s) => s.user?.id);
  const { selectedDate, hapticFeedback } = useUiStore();
  const aiLog = useAiLog();
  const { data: profile } = useProfile();

  const {
    step,
    method,
    mealType,
    photoUri,
    aiResult,
    editedAlimentos,
    errorMessage,
    startPhotoCapture,
    startTextLog,
    startManualSearch,
    setField,
    setStep,
    updateAlimento,
    removeAlimento,
    setError,
    reset,
  } = useLogSessionStore();

  // Historial reciente (últimas 5 entradas de hoy)
  const { data: todayEntries = [] } = useDailyLog(selectedDate);
  const recentEntries = useMemo(
    () => todayEntries.slice(-5).reverse(),
    [todayEntries]
  );

  // Pre-seleccionar mealType desde params o por hora
  const effectiveMealType = (params.mealType as MealType) || mealType || inferMealType();

  // Actualizar store si mealType cambió
  useEffect(() => {
    if (step === "idle" && effectiveMealType !== mealType) {
      setField("mealType", effectiveMealType);
    }
  }, [effectiveMealType, mealType, setField, step]);

  // ─── Timeout de 25s para análisis IA ──────────────────────
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showLongWait, setShowLongWait] = useState(false);
  const [analyzingTextIndex, setAnalyzingTextIndex] = useState(0);
  const [isDiscarding, setIsDiscarding] = useState(false);

  useEffect(() => {
    if (step === "analyzing") {
      // Texto rotativo cada 2.5s
      const textInterval = setInterval(() => {
        setAnalyzingTextIndex((i: number) => (i + 1) % ANALYZING_TEXTS.length);
      }, 2500);

      // "Esto está tardando..." a los 10s
      longWaitRef.current = setTimeout(() => setShowLongWait(true), 10_000);

      // Timeout total a los 25s
      timeoutRef.current = setTimeout(() => {
        setError("No pudimos conectar con el servidor. Inténtalo de nuevo.");
      }, 25_000);

      return () => {
        clearInterval(textInterval);
        if (longWaitRef.current) clearTimeout(longWaitRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowLongWait(false);
        setAnalyzingTextIndex(0);
      };
    }
  }, [setError, step]);

  // ─── Handlers ─────────────────────────────────────────────

  const handleSelectMealType = (mt: MealType) => {
    hapticFeedback("light");
    setField("mealType", mt);
  };

  const handlePhotoCapture = () => {
    startPhotoCapture(effectiveMealType);
    router.push(routes.modals.camera);
  };

  const handleTextSubmit = (text: string) => {
    if (!userId) return;
    aiLog.mutate({
      method: "text",
      payload: text,
      user_id: userId,
      meal_type: effectiveMealType,
      country_code: profile?.country_code ?? "ES",
    });
  };

  const handleFoodSelect = (food: FoodSearchResult) => {
    router.push(foodDetailRoute(food.food_id, effectiveMealType));
  };

  const handleConfirm = () => {
    // Las entradas ya están en DB (ai-log las insertó).
    // Si el usuario editó cantidades, aquí se haría UPDATE.
    // Por ahora: confirmar y limpiar.
    hapticFeedback("medium");
    setStep("done");
    setTimeout(() => reset(), 600); // breve delay para feedback visual
  };

  const handleDismiss = () => {
    const logEntryIds = aiResult?.log_entry_ids ?? [];

    if (logEntryIds.length === 0) {
      reset();
      return;
    }

    setIsDiscarding(true);
    supabase
      .from("food_log_entries")
      .delete()
      .in("id", logEntryIds)
      .then(({ error }) => {
        if (error) {
          setIsDiscarding(false);
          setError("No pudimos descartar la entrada. Inténtalo de nuevo.");
          return;
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.dailyLog(selectedDate) });
        setIsDiscarding(false);
        reset();
      });
  };

  const handleRetry = () => {
    reset();
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <View
      className="flex-1 bg-neutral-50"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
    >
      {/* ═══ IDLE: selección de método ═══ */}
      {(step === "idle" || step === "done") && (
        <View className="flex-1 px-6">
          <Text className="font-display text-2xl text-neutral-900 mb-4">
            ¿Qué has comido?
          </Text>

          {/* Pills de meal_type */}
          <View className="flex-row gap-2 mb-6">
            {MEAL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => handleSelectMealType(opt.key)}
                accessibilityLabel={`Comida: ${opt.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: effectiveMealType === opt.key }}
                className={cn(
                  "flex-1 py-2.5 rounded-xl items-center border",
                  effectiveMealType === opt.key
                    ? "border-primary-500 bg-primary-50"
                    : "border-neutral-200 bg-white"
                )}
              >
                <Text className="text-sm">
                  {opt.emoji}{" "}
                  <Text
                    className={cn(
                      "font-medium",
                      effectiveMealType === opt.key
                        ? "text-primary-700"
                        : "text-neutral-600"
                    )}
                  >
                    {opt.label}
                  </Text>
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 3 botones de método */}
          <View className="gap-3 mb-6">
            <MethodButton
              emoji="📷"
              title="Foto"
              subtitle="Toma una foto de tu plato"
              onPress={handlePhotoCapture}
            />
            <MethodButton
              emoji="✏️"
              title="Texto"
              subtitle="Describe lo que comiste"
              onPress={() => startTextLog(effectiveMealType)}
            />
            <MethodButton
              emoji="🔍"
              title="Buscar"
              subtitle="Busca en nuestra base de datos"
              onPress={() => startManualSearch(effectiveMealType)}
            />
          </View>

          {/* Historial reciente */}
          {recentEntries.length > 0 && (
            <View>
              <Text className="text-sm font-medium text-neutral-500 mb-2 uppercase tracking-wide">
                Hoy
              </Text>
              {recentEntries.map((entry) => (
                <View
                  key={entry.id}
                  className="flex-row items-center bg-white rounded-xl px-4 py-2.5 mb-1.5 border border-neutral-100"
                >
                  <Text className="flex-1 text-sm text-neutral-700" numberOfLines={1}>
                    {entry.food_name || entry.custom_description || "Alimento"}
                  </Text>
                  <Text className="text-sm text-neutral-500">
                    {Math.round(entry.calories_kcal ?? 0)} kcal
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Checkmark de éxito breve */}
          {step === "done" && (
            <View className="items-center py-4">
              <Text className="text-4xl">✅</Text>
              <Text className="text-secondary-600 font-medium mt-1">
                ¡Registrado!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ═══ CAPTURING: texto natural ═══ */}
      {step === "capturing" && method === "natural_text" && (
        <View className="flex-1 px-6">
          <View className="flex-row items-center mb-4">
            <Pressable onPress={reset} className="mr-3 p-1">
              <Text className="text-2xl text-neutral-500">←</Text>
            </Pressable>
            <Text className="font-display text-xl text-neutral-900">
              Describe tu comida
            </Text>
          </View>
          <TextLogInput
            mealType={effectiveMealType}
            onSubmit={handleTextSubmit}
            isLoading={step === "capturing" && aiLog.isPending}
          />
        </View>
      )}

      {/* ═══ CAPTURING: búsqueda manual ═══ */}
      {step === "idle" && method === "manual" && (
        <View className="flex-1 px-6">
          <View className="flex-row items-center mb-4">
            <Pressable onPress={reset} className="mr-3 p-1">
              <Text className="text-2xl text-neutral-500">←</Text>
            </Pressable>
            <Text className="font-display text-xl text-neutral-900">
              Buscar alimento
            </Text>
          </View>
          <FoodSearchBar
            countryCode={profile?.country_code ?? "ES"}
            onSelectFood={handleFoodSelect}
          />
        </View>
      )}

      {/* ═══ ANALYZING: overlay con spinner ═══ */}
      {(step === "analyzing" || step === "uploading") && (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-base text-neutral-700 mt-4">
            {step === "uploading"
              ? "Subiendo foto..."
              : ANALYZING_TEXTS[analyzingTextIndex]}
          </Text>
          {showLongWait && step === "analyzing" && (
            <Text className="text-sm text-neutral-400 mt-2">
              Esto está tardando un poco más de lo normal...
            </Text>
          )}
        </View>
      )}

      {/* ═══ CONFIRMING: AiConfirmSheet ═══ */}
      {step === "confirming" && aiResult && editedAlimentos && (
        <AiConfirmSheet
          isVisible
          result={aiResult}
          editedAlimentos={editedAlimentos}
          photoUri={photoUri}
          onConfirm={handleConfirm}
          onUpdateAlimento={updateAlimento}
          onRemoveAlimento={removeAlimento}
          onDismiss={handleDismiss}
        />
      )}

      {isDiscarding && (
        <View className="absolute inset-0 items-center justify-center bg-neutral-50/80">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="mt-4 text-sm text-neutral-600">
            Descartando registro...
          </Text>
        </View>
      )}

      {/* ═══ ERROR ═══ */}
      {step === "error" && (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-warm-50 border border-warm-200 rounded-2xl p-6 w-full">
            <Text className="text-warm-700 text-center text-base mb-4">
              {errorMessage || "Algo salió mal"}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  reset();
                  startManualSearch(effectiveMealType);
                }}
                accessibilityLabel="Registrar manualmente"
                accessibilityRole="button"
                className="flex-1 py-3.5 rounded-xl items-center border border-neutral-200 bg-white"
              >
                <Text className="text-neutral-600 font-semibold text-sm">
                  Registro manual
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRetry}
                accessibilityLabel="Reintentar"
                accessibilityRole="button"
                className="flex-1 py-3.5 rounded-xl items-center bg-primary-500"
              >
                <Text className="text-white font-semibold text-sm">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Sub-componente: botón de método ─────────────────────────

function MethodButton({
  emoji,
  title,
  subtitle,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${title}: ${subtitle}`}
      accessibilityRole="button"
      className="flex-row items-center bg-white rounded-xl px-4 py-4 border border-neutral-200 active:bg-neutral-50"
    >
      <Text className="text-2xl mr-4">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-800">
          {title}
        </Text>
        <Text className="text-sm text-neutral-500">{subtitle}</Text>
      </View>
      <Text className="text-neutral-300 text-lg">›</Text>
    </Pressable>
  );
}
