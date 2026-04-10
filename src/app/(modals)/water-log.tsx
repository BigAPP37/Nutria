import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAddWater } from "@/features/dashboard/useWaterLog";
import { useUiStore } from "@/stores/uiStore";

const OPTIONS = [250, 500, 750, 1000] as const;

export default function WaterLogModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addWater = useAddWater();
  const selectedDate = useUiStore((s) => s.selectedDate);

  const handleAdd = (ml: number) => {
    addWater.mutate(
      { date: selectedDate, ml },
      { onSuccess: () => router.back() }
    );
  };

  return (
    <View
      className="flex-1 bg-neutral-50 px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="mb-8 flex-row items-center justify-between">
        <Text className="font-display text-2xl text-neutral-900">
          Registrar agua
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar modal de agua"
          className="rounded-xl bg-white px-4 py-2"
        >
          <Text className="font-medium text-neutral-600">Cerrar</Text>
        </Pressable>
      </View>

      <View className="gap-3">
        {OPTIONS.map((ml) => (
          <Pressable
            key={ml}
            onPress={() => handleAdd(ml)}
            disabled={addWater.isPending}
            accessibilityRole="button"
            accessibilityLabel={`Añadir ${ml} mililitros de agua`}
            className="rounded-3xl border border-neutral-100 bg-white px-5 py-5 active:bg-neutral-50"
          >
            <Text className="text-lg font-medium text-neutral-900">
              + {ml} ml
            </Text>
          </Pressable>
        ))}
      </View>

      {addWater.error instanceof Error && (
        <View className="mt-4 rounded-2xl border border-warm-200 bg-warm-50 p-4">
          <Text className="text-sm text-warm-700">
            {addWater.error.message}
          </Text>
        </View>
      )}

      {addWater.isPending && (
        <View className="mt-6 items-center">
          <ActivityIndicator color="#F26A21" />
        </View>
      )}
    </View>
  );
}
