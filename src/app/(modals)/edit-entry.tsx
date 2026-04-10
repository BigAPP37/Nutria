import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditEntryModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 justify-between bg-neutral-50 px-6"
      style={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 }}
    >
      <View className="gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm shadow-black/5">
          <Text className="text-2xl">✏️</Text>
        </View>
        <View className="gap-3">
          <Text className="font-display text-3xl text-neutral-900">
            Edición en preparación
          </Text>
          <Text className="text-base leading-7 text-neutral-600">
            Esta pantalla todavía no tiene el flujo final de edición manual.
            De momento puedes volver atrás y borrar o volver a registrar la comida.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver al registro"
        className="items-center rounded-[26px] bg-primary-500 py-4 active:bg-primary-600"
      >
        <Text className="text-base font-semibold text-white">Volver</Text>
      </Pressable>
    </View>
  );
}
