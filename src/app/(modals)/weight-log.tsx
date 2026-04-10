import { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogWeight } from "@/features/profile/useLogWeight";

export default function WeightLogModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logWeight = useLogWeight();
  const [value, setValue] = useState("");
  const parsed = useMemo(() => Number.parseFloat(value.replace(",", ".")), [value]);
  const isValid = Number.isFinite(parsed) && parsed > 0;

  const handleSave = () => {
    if (!isValid) return;

    logWeight.mutate(parsed, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <View
      className="flex-1 bg-neutral-50 px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="mb-8 flex-row items-center justify-between">
        <Text className="font-display text-2xl text-neutral-900">
          Registrar peso
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar modal de peso"
          className="rounded-xl bg-white px-4 py-2"
        >
          <Text className="font-medium text-neutral-600">Cerrar</Text>
        </Pressable>
      </View>

      <View className="rounded-3xl border border-neutral-100 bg-white p-5">
        <Text className="mb-2 text-sm font-medium text-neutral-600">
          Peso actual
        </Text>
        <View className="flex-row items-end gap-3">
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="72.4"
            placeholderTextColor="#A8A29E"
            className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-2xl text-neutral-900"
          />
          <Text className="pb-4 text-base font-medium text-neutral-500">kg</Text>
        </View>
        <Text className="mt-3 text-sm text-neutral-400">
          Guarda un nuevo registro para actualizar tu tendencia y tu TDEE.
        </Text>
      </View>

      {logWeight.error instanceof Error && (
        <View className="mt-4 rounded-2xl border border-warm-200 bg-warm-50 p-4">
          <Text className="text-sm text-warm-700">
            {logWeight.error.message}
          </Text>
        </View>
      )}

      <View className="mt-auto gap-3">
        <Pressable
          onPress={handleSave}
          disabled={!isValid || logWeight.isPending}
          accessibilityRole="button"
          accessibilityLabel="Guardar peso"
          className={`items-center rounded-[28px] py-5 ${
            !isValid || logWeight.isPending
              ? "bg-primary-300"
              : "bg-primary-500 active:bg-primary-600"
          }`}
        >
          {logWeight.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-lg font-semibold text-white">
              Guardar peso
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
