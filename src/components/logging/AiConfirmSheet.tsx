// src/components/logging/AiConfirmSheet.tsx
// Bottom sheet para confirmar/editar resultado del análisis de IA.
// Muestra alimentos detectados con cantidades editables y totales en tiempo real.

import { useMemo } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { cn } from "@/lib/cn";
import type { AiLogResponse, AlimentoDetectado } from "@/types/ai-log";

interface AiConfirmSheetProps {
  isVisible: boolean;
  result: AiLogResponse;
  editedAlimentos: AlimentoDetectado[];
  photoUri?: string | null;
  onConfirm: () => void;
  onUpdateAlimento: (index: number, updates: Partial<AlimentoDetectado>) => void;
  onRemoveAlimento: (index: number) => void;
  onDismiss: () => void;
}

// Badge de confianza (nunca rojo)
function ConfidenceBanner({ confidence }: { confidence: number }) {
  if (confidence >= 0.6) return null;

  return (
    <View className="bg-neutral-100 rounded-xl px-4 py-3 mb-4">
      <Text className="text-sm text-neutral-600">
        💡 Esta estimación puede no ser exacta. Puedes ajustar las cantidades antes de guardar.
      </Text>
    </View>
  );
}

// Banner de ambigüedades
function AmbiguityBanner({ ambiguedades }: { ambiguedades: string[] }) {
  if (!ambiguedades.length) return null;

  return (
    <View className="bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 mb-4">
      {ambiguedades.map((a, i) => (
        <Text key={i} className="text-sm text-warm-700">
          ⚠ {a}
        </Text>
      ))}
    </View>
  );
}

// Fila editable de un alimento
function AlimentoRow({
  alimento,
  index,
  onUpdate,
  onRemove,
}: {
  alimento: AlimentoDetectado;
  index: number;
  onUpdate: (updates: Partial<AlimentoDetectado>) => void;
  onRemove: () => void;
}) {
  const handleGramsChange = (text: string) => {
    const grams = parseFloat(text);
    if (!isNaN(grams) && grams > 0) {
      onUpdate({ cantidad_gramos: grams });
    }
  };

  return (
    <View className="flex-row items-center py-3 border-b border-neutral-100">
      {/* Info del alimento */}
      <View className="flex-1 mr-3">
        <Text className="text-base text-neutral-800" numberOfLines={1}>
          {alimento.nombre}
        </Text>
        {alimento.notas && (
          <Text className="text-xs text-neutral-400 mt-0.5" numberOfLines={1}>
            {alimento.notas}
          </Text>
        )}
        <Text className="text-xs text-neutral-500 mt-1">
          {Math.round(alimento.calorias_estimadas)} kcal
          {" · "}P {alimento.proteina_g}g
          {" · "}C {alimento.carbohidratos_g}g
          {" · "}G {alimento.grasa_g}g
        </Text>
      </View>

      {/* Input de gramos */}
      <View className="flex-row items-center">
        <TextInput
          defaultValue={String(Math.round(alimento.cantidad_gramos))}
          onEndEditing={(e) => handleGramsChange(e.nativeEvent.text)}
          keyboardType="number-pad"
          className="bg-neutral-100 rounded-lg px-2.5 py-1.5 text-sm text-neutral-900 text-center w-16"
          accessibilityLabel={`Cantidad en gramos de ${alimento.nombre}`}
        />
        <Text className="text-xs text-neutral-400 ml-1">g</Text>
      </View>

      {/* Botón eliminar */}
      <Pressable
        onPress={onRemove}
        accessibilityLabel={`Eliminar ${alimento.nombre}`}
        accessibilityRole="button"
        className="ml-2 p-1.5"
      >
        <Text className="text-neutral-400 text-lg">✕</Text>
      </Pressable>
    </View>
  );
}

export function AiConfirmSheet({
  isVisible,
  result,
  editedAlimentos,
  photoUri,
  onConfirm,
  onUpdateAlimento,
  onRemoveAlimento,
  onDismiss,
}: AiConfirmSheetProps) {
  // Recalcular totales en tiempo real
  const totals = useMemo(
    () => ({
      calorias: editedAlimentos.reduce((s, a) => s + a.calorias_estimadas, 0),
      proteina: editedAlimentos.reduce((s, a) => s + a.proteina_g, 0),
      carbos: editedAlimentos.reduce((s, a) => s + a.carbohidratos_g, 0),
      grasa: editedAlimentos.reduce((s, a) => s + a.grasa_g, 0),
    }),
    [editedAlimentos]
  );

  const snapPoints = useMemo(() => ["85%"], []);

  if (!isVisible) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
      backgroundStyle={{ backgroundColor: "#FAFAF9" }}
      handleIndicatorStyle={{ backgroundColor: "#D6D3D1" }}
    >
      <BottomSheetView className="flex-1 px-5">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
        >
          {/* Foto thumbnail + descripción */}
          <View className="flex-row items-center mb-4">
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={{ width: 56, height: 56, borderRadius: 12 }}
                contentFit="cover"
                className="mr-3"
              />
            )}
            <View className="flex-1">
              <Text className="text-lg font-semibold text-neutral-900" numberOfLines={2}>
                {result.plato_descripcion}
              </Text>
              {result.origen_cultural && (
                <Text className="text-xs text-neutral-400 mt-0.5">
                  Origen: {result.origen_cultural}
                </Text>
              )}
            </View>
          </View>

          {/* Banners */}
          <ConfidenceBanner confidence={result.confianza_general} />
          <AmbiguityBanner ambiguedades={result.ambiguedades ?? []} />

          {/* Lista de alimentos editables */}
          <Text className="text-sm font-medium text-neutral-500 mb-2 uppercase tracking-wide">
            Alimentos detectados
          </Text>

          {editedAlimentos.map((alimento, index) => (
            <AlimentoRow
              key={`${alimento.nombre}-${index}`}
              alimento={alimento}
              index={index}
              onUpdate={(updates) => onUpdateAlimento(index, updates)}
              onRemove={() => onRemoveAlimento(index)}
            />
          ))}

          {editedAlimentos.length === 0 && (
            <View className="py-6 items-center">
              <Text className="text-neutral-400">
                No quedan alimentos. Descarta o añade manualmente.
              </Text>
            </View>
          )}

          {/* Totales */}
          <View className="bg-white rounded-xl p-4 mt-4 border border-neutral-100">
            <Text className="text-sm font-medium text-neutral-500 mb-2">
              Total
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="font-display text-xl font-bold text-neutral-900">
                  {Math.round(totals.calorias)}
                </Text>
                <Text className="text-xs text-neutral-400">kcal</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="font-display text-lg font-semibold text-secondary-600">
                  {Math.round(totals.proteina)}g
                </Text>
                <Text className="text-xs text-neutral-400">Prot</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="font-display text-lg font-semibold text-primary-600">
                  {Math.round(totals.carbos)}g
                </Text>
                <Text className="text-xs text-neutral-400">Carbs</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="font-display text-lg font-semibold text-warm-600">
                  {Math.round(totals.grasa)}g
                </Text>
                <Text className="text-xs text-neutral-400">Grasa</Text>
              </View>
            </View>
          </View>

          {/* Botones */}
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={onDismiss}
              accessibilityLabel="Descartar entrada"
              accessibilityRole="button"
              className="flex-1 py-4 rounded-2xl items-center border border-neutral-200 bg-white active:bg-neutral-50"
            >
              <Text className="text-neutral-600 font-semibold text-base">
                Descartar
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={editedAlimentos.length === 0}
              accessibilityLabel="Guardar entrada"
              accessibilityRole="button"
              className={cn(
                "flex-[2] py-4 rounded-2xl items-center",
                editedAlimentos.length > 0
                  ? "bg-primary-500 active:bg-primary-600"
                  : "bg-neutral-200"
              )}
            >
              <Text
                className={cn(
                  "font-semibold text-base",
                  editedAlimentos.length > 0 ? "text-white" : "text-neutral-400"
                )}
              >
                Guardar
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}
