// src/components/logging/TextLogInput.tsx
// Input de texto natural para logging por descripción hablada/escrita.
// Placeholder: "Ej: dos huevos fritos con jamón y un café con leche"
// Sugerencias rápidas como chips tocables.

import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { ActivityIndicator } from "react-native";
import { cn } from "@/lib/cn";

interface TextLogInputProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

// Sugerencias rápidas por tipo de comida
const SUGGESTIONS: Record<string, string[]> = {
  breakfast: ["Café con leche", "Tostada con aceite", "Fruta", "Cereales con leche", "Zumo de naranja"],
  lunch: ["Menú del día", "Ensalada", "Bocadillo", "Arroz con pollo", "Pasta"],
  dinner: ["Sopa", "Tortilla francesa", "Ensalada", "Pescado a la plancha", "Verduras"],
  snack: ["Fruta", "Yogur", "Frutos secos", "Galletas", "Café"],
};

export function TextLogInput({ mealType, onSubmit, isLoading }: TextLogInputProps) {
  const [text, setText] = useState("");

  const canSubmit = text.trim().length >= 3 && !isLoading;
  const suggestions = SUGGESTIONS[mealType] ?? SUGGESTIONS.lunch;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(text.trim());
  };

  const handleSuggestion = (suggestion: string) => {
    // Añadir al texto existente separado por coma
    if (text.trim()) {
      setText((prev) => `${prev.trim()}, ${suggestion.toLowerCase()}`);
    } else {
      setText(suggestion);
    }
  };

  return (
    <View className="flex-1">
      {/* Sugerencias rápidas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerClassName="gap-2"
      >
        {suggestions.map((s) => (
          <Pressable
            key={s}
            onPress={() => handleSuggestion(s)}
            disabled={isLoading}
            accessibilityLabel={`Sugerencia: ${s}`}
            accessibilityRole="button"
            className="bg-white border border-neutral-200 rounded-full px-3.5 py-2 active:bg-neutral-100"
          >
            <Text className="text-sm text-neutral-700">{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Input + botón enviar */}
      <View className="flex-row items-end bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ej: dos huevos fritos con jamón y un café con leche"
          placeholderTextColor="#A8A29E"
          multiline
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          blurOnSubmit={false}
          className="flex-1 px-4 py-3.5 text-base text-neutral-900 max-h-32"
          accessibilityLabel="Describe lo que has comido"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityLabel="Enviar descripción de comida"
          accessibilityRole="button"
          className={cn(
            "w-12 h-12 items-center justify-center rounded-xl m-1.5",
            canSubmit ? "bg-primary-500 active:bg-primary-600" : "bg-neutral-100"
          )}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              className={cn(
                "text-lg",
                canSubmit ? "text-white" : "text-neutral-400"
              )}
            >
              ➤
            </Text>
          )}
        </Pressable>
      </View>

      {/* Hint */}
      <Text className="text-xs text-neutral-400 mt-2 px-1">
        Describe tu comida de forma natural. La IA identificará los alimentos y estimará las cantidades.
      </Text>
    </View>
  );
}
