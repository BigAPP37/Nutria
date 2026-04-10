// src/app/(tabs)/stats.tsx
// Pantalla de estadísticas y progreso — Tab "Progreso".
// Secciones: resumen rápido, TDEE card, gráfico peso, gráfico calorías,
// macros promedio, historial de snapshots.

import { useMemo, useCallback, useState } from "react";
import {
  Alert,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { queryKeys } from "@/lib/constants";
import { getTodayDateKey } from "@/lib/date";
import { routes } from "@/types/navigation";

// Queries
import { useTdeeState } from "@/features/tdee/useTdeeState";
import { useWeeklySnapshots } from "@/features/tdee/useWeeklySnapshots";
import { useWeightHistory } from "@/features/profile/useWeightHistory";
import { useProfile } from "@/features/profile/useProfile";
import { useUpdateProfile } from "@/features/profile/useUpdateProfile";
import {
  removeProfileAvatar,
  uploadProfileAvatar,
} from "@/features/profile/avatarUpload";
import { useDailyLog } from "@/features/dashboard/useDailyLog";
import { useAuthStore } from "@/stores/authStore";

// Componentes
import { TdeeCard } from "@/components/stats/TdeeCard";
import { WeightChart } from "@/components/stats/WeightChart";
import { CalorieChart } from "@/components/stats/CalorieChart";
import { WeeklySnapshotCard } from "@/components/stats/WeeklySnapshotCard";

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Queries
  const { data: tdee, isLoading: tdeeLoading } = useTdeeState();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useWeeklySnapshots();
  const { data: weightHistory = [], isLoading: weightLoading } = useWeightHistory();
  const { data: profile } = useProfile();

  // Datos de la última semana para macros promedio
  const todayStr = getTodayDateKey();
  const { data: todayEntries = [] } = useDailyLog(todayStr);

  const isLoading = tdeeLoading || snapshotsLoading || weightLoading;

  // ─── Cálculos derivados ──────────────────────────────────

  // Peso actual (último registro)
  const currentWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight_kg
    : null;

  // Días logueados: semanas con datos / total semanas
  const weeksWithData = snapshots.filter((s) => s.complete_days >= 4).length;

  // Racha de días consecutivos (simplificado: días completos de la última semana)
  const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
  const currentStreak = latestSnapshot?.complete_days ?? 0;

  // Macros promedio de la semana actual (desde las últimas 7 entradas del dailyLog)
  // Simplificación: usamos los datos de hoy como proxy
  const macroAvg = useMemo(() => {
    if (todayEntries.length === 0) return null;
    return {
      protein: Math.round(
        todayEntries.reduce((s, e) => s + (e.protein_g ?? 0), 0)
      ),
      carbs: Math.round(
        todayEntries.reduce((s, e) => s + (e.carbs_g ?? 0), 0)
      ),
      fat: Math.round(
        todayEntries.reduce((s, e) => s + (e.fat_g ?? 0), 0)
      ),
    };
  }, [todayEntries]);

  const unit = profile?.unit_weight ?? "kg";

  // ─── Pull to refresh ─────────────────────────────────────
  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.tdeeState() });
    qc.invalidateQueries({ queryKey: queryKeys.weeklySnapshots() });
    qc.invalidateQueries({ queryKey: queryKeys.weightHistory() });
    qc.invalidateQueries({ queryKey: queryKeys.profile() });
  }, [qc]);

  const userName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "";

  const handlePickAvatar = useCallback(async () => {
    if (!user?.id || isUpdatingAvatar) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso necesario",
          "Necesitamos acceso a tu galería para actualizar la foto de perfil."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      setIsUpdatingAvatar(true);
      const previousAvatarUrl = profile?.avatar_url;
      const publicUrl = await uploadProfileAvatar(result.assets[0].uri, user.id);
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      if (previousAvatarUrl) {
        await removeProfileAvatar(previousAvatarUrl);
      }
      qc.invalidateQueries({ queryKey: queryKeys.profile() });
    } catch (error) {
      Alert.alert(
        "No se pudo actualizar la foto",
        error instanceof Error ? error.message : "Inténtalo de nuevo."
      );
    } finally {
      setIsUpdatingAvatar(false);
    }
  }, [isUpdatingAvatar, profile?.avatar_url, qc, updateProfile, user?.id]);

  const handleRemoveAvatar = useCallback(() => {
    if (!profile?.avatar_url || isUpdatingAvatar) return;

    Alert.alert("Quitar foto", "Se eliminará tu foto actual del perfil.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: async () => {
          try {
            setIsUpdatingAvatar(true);
            await updateProfile.mutateAsync({ avatar_url: null });
            await removeProfileAvatar(profile.avatar_url);
            qc.invalidateQueries({ queryKey: queryKeys.profile() });
          } catch (error) {
            Alert.alert(
              "No se pudo quitar la foto",
              error instanceof Error ? error.message : "Inténtalo de nuevo."
            );
          } finally {
            setIsUpdatingAvatar(false);
          }
        },
      },
    ]);
  }, [isUpdatingAvatar, profile?.avatar_url, qc, updateProfile]);

  // ─── Render ──────────────────────────────────────────────

  // Estado vacío total
  if (!isLoading && !tdee && weightHistory.length === 0) {
    return (
      <View
        className="flex-1 bg-neutral-50 items-center justify-center px-8"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-5xl mb-4">📊</Text>
        <Text className="font-display text-xl text-neutral-900 text-center mb-2">
          Aquí verás tu progreso
        </Text>
        <Text className="text-base text-neutral-500 text-center mb-6">
          Empieza registrando tus comidas y peso para que tu plan se ajuste a ti.
        </Text>
        <Pressable
          onPress={() => router.push(routes.tabs.log)}
          accessibilityLabel="Ir a registrar"
          accessibilityRole="button"
          className="bg-primary-500 px-8 py-4 rounded-2xl active:bg-primary-600"
        >
          <Text className="text-white font-semibold text-base">
            Empezar a registrar
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="pb-32"
      style={{ paddingTop: insets.top + 12 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="px-6 mb-5">
        <View className="mb-4 flex-row items-center gap-4 rounded-3xl bg-white px-4 py-4">
          <Pressable
            onPress={handlePickAvatar}
            accessibilityLabel="Cambiar foto de perfil"
            accessibilityRole="button"
            disabled={isUpdatingAvatar}
            className="h-16 w-16 items-center justify-center overflow-hidden rounded-[1.5rem] bg-neutral-100"
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                alt="Foto de perfil"
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Text className="font-display text-2xl text-neutral-500">
                {(userName || "N").slice(0, 1).toUpperCase()}
              </Text>
            )}
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text className="font-display text-lg text-neutral-900">
              {userName || "Tu perfil"}
            </Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Toca la foto para subir una imagen de perfil.
            </Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={handlePickAvatar}
                accessibilityLabel="Subir foto de perfil"
                accessibilityRole="button"
                disabled={isUpdatingAvatar}
                className="rounded-xl bg-primary-50 px-3 py-2 active:bg-primary-100"
              >
                <Text className="text-xs font-semibold text-primary-600">
                  {isUpdatingAvatar
                    ? "Guardando..."
                    : profile?.avatar_url
                      ? "Cambiar foto"
                      : "Subir foto"}
                </Text>
              </Pressable>
              {profile?.avatar_url ? (
                <Pressable
                  onPress={handleRemoveAvatar}
                  accessibilityLabel="Quitar foto de perfil"
                  accessibilityRole="button"
                  disabled={isUpdatingAvatar}
                  className="rounded-xl bg-neutral-100 px-3 py-2 active:bg-neutral-200"
                >
                  <Text className="text-xs font-semibold text-neutral-700">
                    Quitar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
        <Text className="font-display text-2xl text-neutral-900">
          Tu progreso
        </Text>
      </View>

      {/* ═══ 1. RESUMEN RÁPIDO ═══ */}
      <View className="flex-row px-6 gap-3 mb-5">
        <StatPill
          label="Semanas"
          value={String(weeksWithData)}
          sublabel="con datos"
        />
        <StatPill
          label="Peso"
          value={
            currentWeight
              ? `${formatWeight(currentWeight, unit)}`
              : "—"
          }
          sublabel={unit}
        />
        <StatPill
          label="Racha"
          value={String(currentStreak)}
          sublabel="días"
        />
      </View>

      {/* ═══ 2. OBJETIVO CALÓRICO ═══ */}
      {tdee ? (
        <View className="px-6 mb-5">
          <TdeeCard tdeeState={tdee} />
        </View>
      ) : tdeeLoading ? (
        <View className="px-6 mb-5">
          <View className="h-48 rounded-2xl bg-neutral-100" />
        </View>
      ) : null}

      {/* ═══ 3. GRÁFICO DE PESO ═══ */}
      <View className="px-6 mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
            Peso
          </Text>
          <Pressable
            onPress={() => router.push(routes.modals.weightLog)}
            accessibilityLabel="Registrar peso"
            accessibilityRole="button"
            className="bg-primary-50 rounded-lg px-3 py-1.5 active:bg-primary-100"
          >
            <Text className="text-xs font-semibold text-primary-600">
              + Registrar
            </Text>
          </Pressable>
        </View>
        {weightLoading ? (
          <View className="h-64 rounded-2xl bg-neutral-100" />
        ) : (
          <WeightChart data={weightHistory} unit={unit} />
        )}
      </View>

      {/* ═══ 4. GRÁFICO DE CALORÍAS ═══ */}
      <View className="px-6 mb-5">
        <Text className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-2">
          Calorías
        </Text>
        {snapshotsLoading ? (
          <View className="h-64 rounded-2xl bg-neutral-100" />
        ) : (
          <CalorieChart
            snapshots={snapshots}
            goalKcal={tdee?.goal_kcal ?? 2000}
          />
        )}
      </View>

      {/* ═══ 5. MACROS PROMEDIO ═══ */}
      {macroAvg && tdee && (
        <View className="px-6 mb-5">
          <Text className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Macros hoy
          </Text>
          <View className="bg-white rounded-2xl p-4 border border-neutral-100">
            <View className="flex-row gap-4">
              <MacroStat
                label="Proteína"
                current={macroAvg.protein}
                target={tdee.macro_targets.protein_g}
                color="text-secondary-600"
              />
              <MacroStat
                label="Carbos"
                current={macroAvg.carbs}
                target={tdee.macro_targets.carbs_g}
                color="text-primary-600"
              />
              <MacroStat
                label="Grasa"
                current={macroAvg.fat}
                target={tdee.macro_targets.fat_g}
                color="text-warm-600"
              />
            </View>
          </View>
        </View>
      )}

      {/* ═══ 6. HISTORIAL DE SNAPSHOTS ═══ */}
      {snapshots.length > 0 && (
        <View className="px-6 mb-5">
          <Text className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Historial semanal
          </Text>
          {snapshots.map((snapshot, i) => (
            <WeeklySnapshotCard key={`${snapshot.week_label}-${i}`} snapshot={snapshot} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────

function StatPill({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-xl py-3 px-3 items-center border border-neutral-100">
      <Text className="text-xs text-neutral-400 mb-0.5">{label}</Text>
      <Text className="font-display text-xl font-bold text-neutral-900">
        {value}
      </Text>
      <Text className="text-xs text-neutral-400">{sublabel}</Text>
    </View>
  );
}

function MacroStat({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className={`font-display text-lg font-semibold ${color}`}>
        {current}g
      </Text>
      <Text className="text-xs text-neutral-400 mt-0.5">
        de {target}g
      </Text>
      <Text className="text-xs text-neutral-500 mt-0.5">{label}</Text>
    </View>
  );
}

function formatWeight(kg: number, unit: "kg" | "lb"): string {
  const val = unit === "lb" ? kg * 2.20462 : kg;
  return val.toFixed(1);
}
