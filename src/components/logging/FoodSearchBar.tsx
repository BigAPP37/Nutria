// src/components/logging/FoodSearchBar.tsx
// Barra de búsqueda manual + lista de resultados con FlashList.
// Debounce de 300ms ya implementado en useFoodSearch.

import { useState } from "react";
import { View, Text, TextInput, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useFoodSearch } from "@/features/logging/useFoodSearch";
import { FoodResultCard } from "@/components/logging/FoodResultCard";
import type { FoodSearchResult } from "@/features/logging/useFoodSearch";

interface FoodSearchBarProps {
  countryCode: string;
  onSelectFood: (food: FoodSearchResult) => void;
}

export function FoodSearchBar({ countryCode, onSelectFood }: FoodSearchBarProps) {
  const [query, setQuery] = useState("");

  const { data: results = [], isLoading, isFetching } = useFoodSearch(
    query,
    countryCode
  );

  const showSpinner = isFetching && query.length >= 2;
  const showNoResults = !isLoading && !isFetching && query.length >= 2 && results.length === 0;

  return (
    <View className="flex-1">
      {/* Barra de búsqueda */}
      <View className="flex-row items-center bg-white rounded-xl border border-neutral-200 px-4 mb-3">
        <Text className="text-lg mr-2">🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar alimento..."
          placeholderTextColor="#A8A29E"
          autoFocus
          autoCorrect={false}
          className="flex-1 py-3.5 text-base text-neutral-900"
          accessibilityLabel="Buscar alimento en la base de datos"
        />
        {showSpinner && (
          <ActivityIndicator size="small" color="#A8A29E" />
        )}
      </View>

      {/* Sin resultados */}
      {showNoResults && (
        <View className="items-center py-8">
          <Text className="text-neutral-500 text-center">
            Sin resultados para &quot;{query}&quot;
          </Text>
          <Text className="text-neutral-400 text-sm text-center mt-1">
            Prueba con otro nombre o usa el registro por texto
          </Text>
        </View>
      )}

      {/* Lista de resultados */}
      {results.length > 0 && (
        <FlashList
          data={results}
          keyExtractor={(item) => item.food_id}
          estimatedItemSize={72}
          renderItem={({ item }) => (
            <FoodResultCard food={item} onSelect={onSelectFood} />
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Hint inicial */}
      {query.length < 2 && (
        <View className="items-center py-8">
          <Text className="text-4xl mb-3">🥗</Text>
          <Text className="text-neutral-400 text-center">
            Escribe al menos 2 caracteres para buscar
          </Text>
        </View>
      )}
    </View>
  );
}
