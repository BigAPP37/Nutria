// src/app/(onboarding)/preferences.tsx
// Preferencias del usuario — paso 6 del onboarding.
// País (prioridad hispanos), unidades de peso y energía, timezone.

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { routes } from "@/types/navigation";

// Países hispanos primero, luego otros
const COUNTRIES = [
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    countryCode,
    unitWeight,
    unitEnergy,
    timezone,
    setField,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);

  const filteredCountries = countrySearch
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES;

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  const handleSelectCountry = (code: string) => {
    setField("countryCode", code);
    setShowCountryList(false);
    setCountrySearch("");
  };

  const handleNext = () => {
    nextStep();
    router.push(routes.onboarding.ready);
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  return (
    <View
      className="flex-1 bg-neutral-50"
      style={{ paddingBottom: insets.bottom + 24 }}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pt-4 pb-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-display text-2xl text-neutral-900 mb-2">
          Tus preferencias
        </Text>
        <Text className="text-neutral-500 mb-8">
          Adaptamos la app a tu país y unidades preferidas.
        </Text>

        {/* País */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-700 mb-1.5">País</Text>

          {/* Selector de país */}
          <Pressable
            onPress={() => setShowCountryList(!showCountryList)}
            accessibilityLabel={`País seleccionado: ${selectedCountry?.name || "Ninguno"}`}
            accessibilityRole="button"
            className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 flex-row items-center"
          >
            <Text className="text-xl mr-3">{selectedCountry?.flag || "🌍"}</Text>
            <Text className="text-base text-neutral-900 flex-1">
              {selectedCountry?.name || "Selecciona tu país"}
            </Text>
            <Text className="text-neutral-400">
              {showCountryList ? "▲" : "▼"}
            </Text>
          </Pressable>

          {/* Lista desplegable de países */}
          {showCountryList && (
            <View className="bg-white border border-neutral-200 rounded-xl mt-2 max-h-64 overflow-hidden">
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder="Buscar país..."
                placeholderTextColor="#A8A29E"
                className="px-4 py-3 border-b border-neutral-100 text-base text-neutral-900"
                autoFocus
                accessibilityLabel="Buscar país"
              />
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectCountry(item.code)}
                    className={cn(
                      "flex-row items-center px-4 py-3 border-b border-neutral-50",
                      countryCode === item.code && "bg-primary-50"
                    )}
                    accessibilityLabel={item.name}
                    accessibilityRole="button"
                  >
                    <Text className="text-lg mr-3">{item.flag}</Text>
                    <Text
                      className={cn(
                        "text-base",
                        countryCode === item.code
                          ? "text-primary-700 font-medium"
                          : "text-neutral-800"
                      )}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>

        {/* Unidades de peso */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-700 mb-1.5">
            Unidades de peso
          </Text>
          <View className="flex-row gap-3">
            <ToggleOption
              label="kg"
              isSelected={unitWeight === "kg"}
              onPress={() => setField("unitWeight", "kg")}
            />
            <ToggleOption
              label="lb"
              isSelected={unitWeight === "lb"}
              onPress={() => setField("unitWeight", "lb")}
            />
          </View>
        </View>

        {/* Unidades de energía */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-700 mb-1.5">
            Unidades de energía
          </Text>
          <View className="flex-row gap-3">
            <ToggleOption
              label="kcal"
              isSelected={unitEnergy === "kcal"}
              onPress={() => setField("unitEnergy", "kcal")}
            />
            <ToggleOption
              label="kJ"
              isSelected={unitEnergy === "kJ"}
              onPress={() => setField("unitEnergy", "kJ")}
            />
          </View>
        </View>

        {/* Zona horaria (detectada automáticamente) */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-700 mb-1.5">
            Zona horaria
          </Text>
          <View className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5">
            <Text className="text-base text-neutral-900">{timezone}</Text>
            <Text className="text-xs text-neutral-400 mt-1">
              Detectada automáticamente
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botones */}
      <View className="flex-row gap-3 px-6">
        <Pressable
          onPress={handleBack}
          accessibilityLabel="Volver al paso anterior"
          accessibilityRole="button"
          className="flex-1 py-4 rounded-2xl items-center border border-neutral-200 bg-white active:bg-neutral-100"
        >
          <Text className="text-neutral-600 font-semibold text-base">Atrás</Text>
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
    </View>
  );
}

// Toggle genérico de 2 opciones
function ToggleOption({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Unidad: ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={cn(
        "flex-1 py-3.5 rounded-xl items-center border-2",
        isSelected
          ? "border-primary-500 bg-primary-50"
          : "border-neutral-200 bg-white"
      )}
    >
      <Text
        className={cn(
          "text-base font-semibold",
          isSelected ? "text-primary-700" : "text-neutral-600"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
