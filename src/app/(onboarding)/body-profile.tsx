// src/app/(onboarding)/body-profile.tsx
// Datos físicos del usuario — paso 2 del onboarding.
// Campos: nombre (opcional), peso, altura, fecha de nacimiento, sexo biológico.

import { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { routes } from "@/types/navigation";

export default function BodyProfileScreen() {
  const router = useRouter();
  const {
    displayName,
    weightKg,
    heightCm,
    dateOfBirth,
    biologicalSex,
    unitWeight,
    setField,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  // Estado local para inputs de texto (se sincronizan con store al cambiar)
  const [weightInput, setWeightInput] = useState(
    weightKg ? String(weightKg) : ""
  );
  const [heightInput, setHeightInput] = useState(
    heightCm ? String(heightCm) : ""
  );
  const [dobDay, setDobDay] = useState(
    dateOfBirth ? dateOfBirth.split("-")[2] : ""
  );
  const [dobMonth, setDobMonth] = useState(
    dateOfBirth ? dateOfBirth.split("-")[1] : ""
  );
  const [dobYear, setDobYear] = useState(
    dateOfBirth ? dateOfBirth.split("-")[0] : ""
  );

  // Validación
  const validate = (): boolean => {
    const w = parseFloat(weightInput);
    const h = parseFloat(heightInput);
    const y = parseInt(dobYear, 10);
    const m = parseInt(dobMonth, 10);
    const d = parseInt(dobDay, 10);

    if (!w || w < 30 || w > 300) {
      Alert.alert("Peso", "Introduce un peso entre 30 y 300 kg");
      return false;
    }
    if (!h || h < 100 || h > 250) {
      Alert.alert("Altura", "Introduce una altura entre 100 y 250 cm");
      return false;
    }
    if (!y || !m || !d || y < 1920 || y > 2013 || m < 1 || m > 12 || d < 1 || d > 31) {
      Alert.alert(
        "Fecha de nacimiento",
        "Introduce una fecha válida (debes tener entre 13 y 100 años)"
      );
      return false;
    }
    if (!biologicalSex) {
      Alert.alert("Sexo biológico", "Selecciona una opción para calcular tu metabolismo");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validate()) return;

    // Sincronizar con store
    const w = parseFloat(weightInput);
    const h = parseFloat(heightInput);
    const dob = `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`;

    // Convertir si el usuario usa lb
    const weightInKg = unitWeight === "lb" ? w * 0.453592 : w;

    setField("weightKg", Math.round(weightInKg * 10) / 10);
    setField("heightCm", h);
    setField("dateOfBirth", dob);

    nextStep();
    router.push(routes.onboarding.goal);
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="px-6 pb-10"
      style={{ paddingTop: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text className="font-display text-2xl text-neutral-900 mb-2">
        Cuéntanos sobre ti
      </Text>
      <Text className="text-neutral-500 mb-8">
        Necesitamos estos datos para calcular tu plan personalizado.
      </Text>

      {/* Nombre (opcional) */}
      <View className="mb-5">
        <Text className="text-sm font-medium text-neutral-700 mb-1.5">
          ¿Cómo te llamamos?{" "}
          <Text className="text-neutral-400">(opcional)</Text>
        </Text>
        <TextInput
          value={displayName}
          onChangeText={(t) => setField("displayName", t)}
          placeholder="Tu nombre"
          placeholderTextColor="#A8A29E"
          className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-base text-neutral-900"
          accessibilityLabel="Nombre para mostrar"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Peso */}
      <View className="mb-5">
        <Text className="text-sm font-medium text-neutral-700 mb-1.5">
          Peso actual ({unitWeight})
        </Text>
        <TextInput
          value={weightInput}
          onChangeText={setWeightInput}
          placeholder={unitWeight === "kg" ? "70" : "154"}
          placeholderTextColor="#A8A29E"
          keyboardType="decimal-pad"
          className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-base text-neutral-900"
          accessibilityLabel={`Peso actual en ${unitWeight}`}
        />
      </View>

      {/* Altura */}
      <View className="mb-5">
        <Text className="text-sm font-medium text-neutral-700 mb-1.5">
          Altura (cm)
        </Text>
        <TextInput
          value={heightInput}
          onChangeText={setHeightInput}
          placeholder="170"
          placeholderTextColor="#A8A29E"
          keyboardType="number-pad"
          className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-base text-neutral-900"
          accessibilityLabel="Altura en centímetros"
        />
      </View>

      {/* Fecha de nacimiento — 3 inputs */}
      <View className="mb-5">
        <Text className="text-sm font-medium text-neutral-700 mb-1.5">
          Fecha de nacimiento
        </Text>
        <View className="flex-row gap-3">
          <TextInput
            value={dobDay}
            onChangeText={(t) => setDobDay(t.replace(/[^0-9]/g, "").slice(0, 2))}
            placeholder="DD"
            placeholderTextColor="#A8A29E"
            keyboardType="number-pad"
            maxLength={2}
            className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-base text-neutral-900 text-center"
            accessibilityLabel="Día de nacimiento"
          />
          <TextInput
            value={dobMonth}
            onChangeText={(t) => setDobMonth(t.replace(/[^0-9]/g, "").slice(0, 2))}
            placeholder="MM"
            placeholderTextColor="#A8A29E"
            keyboardType="number-pad"
            maxLength={2}
            className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-base text-neutral-900 text-center"
            accessibilityLabel="Mes de nacimiento"
          />
          <TextInput
            value={dobYear}
            onChangeText={(t) => setDobYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
            placeholder="AAAA"
            placeholderTextColor="#A8A29E"
            keyboardType="number-pad"
            maxLength={4}
            className="flex-[1.5] bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-base text-neutral-900 text-center"
            accessibilityLabel="Año de nacimiento"
          />
        </View>
      </View>

      {/* Sexo biológico — 2 cards */}
      <View className="mb-8">
        <Text className="text-sm font-medium text-neutral-700 mb-1.5">
          Sexo biológico{" "}
          <Text className="text-neutral-400">(para calcular tu metabolismo)</Text>
        </Text>
        <View className="flex-row gap-3">
          <SexCard
            label="Hombre"
            emoji="♂️"
            isSelected={biologicalSex === "male"}
            onPress={() => setField("biologicalSex", "male")}
          />
          <SexCard
            label="Mujer"
            emoji="♀️"
            isSelected={biologicalSex === "female"}
            onPress={() => setField("biologicalSex", "female")}
          />
        </View>
      </View>

      {/* Botones */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={handleBack}
          accessibilityLabel="Volver al paso anterior"
          accessibilityRole="button"
          className="flex-1 py-4 rounded-2xl items-center border border-neutral-200 bg-white active:bg-neutral-100"
        >
          <Text className="text-neutral-600 font-semibold text-base">
            Atrás
          </Text>
        </Pressable>
        <Pressable
          onPress={handleNext}
          accessibilityLabel="Continuar al siguiente paso"
          accessibilityRole="button"
          className="flex-[2] py-4 rounded-2xl items-center bg-primary-500 active:bg-primary-600"
        >
          <Text className="text-white font-semibold text-base">Continuar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// Subcomponente: card de selección de sexo biológico
function SexCard({
  label,
  emoji,
  isSelected,
  onPress,
}: {
  label: string;
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Reanimated shared values are mutated imperatively by design.
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle} className="flex-1">
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`Sexo biológico: ${label}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        className={cn(
          "items-center py-5 rounded-xl border-2",
          isSelected
            ? "border-primary-500 bg-primary-50"
            : "border-neutral-200 bg-white"
        )}
      >
        <Text className="text-2xl mb-1">{emoji}</Text>
        <Text
          className={cn(
            "text-base font-medium",
            isSelected ? "text-primary-700" : "text-neutral-700"
          )}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
