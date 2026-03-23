// src/app/(modals)/camera.tsx
// Modal de cámara para captura de foto de comida.
// Comprime a 1024px, sube a Storage, llama ai-log.

import { useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";
import { cn } from "@/lib/cn";
import { useLogSessionStore } from "@/stores/logSessionStore";
import { useAuthStore } from "@/stores/authStore";
import { uploadMealPhoto } from "@/features/logging/photoUpload";
import { useAiLog } from "@/features/logging/useAiLog";

export default function CameraModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mealType?: string }>();

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const userId = useAuthStore((s) => s.user?.id);
  const {
    mealType,
    step,
    setStep,
    setPhotoUri,
    setPhotoStoragePath,
    setError,
  } = useLogSessionStore();
  const aiLog = useAiLog();

  const effectiveMealType = (params.mealType as string) || mealType || "lunch";
  const isProcessing = step === "uploading" || step === "analyzing";

  // ─── Sin permisos ────────────────────────────────────────
  if (!permission) {
    return <View className="flex-1 bg-neutral-900" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center px-8">
        <Text className="text-5xl mb-4">📷</Text>
        <Text className="text-xl font-display text-neutral-900 text-center mb-2">
          Nutria necesita tu cámara
        </Text>
        <Text className="text-base text-neutral-500 text-center mb-6">
          Para analizar tus comidas con IA, necesitamos acceso a la cámara.
        </Text>
        <Pressable
          onPress={requestPermission}
          accessibilityLabel="Permitir acceso a la cámara"
          accessibilityRole="button"
          className="bg-primary-500 px-8 py-4 rounded-2xl active:bg-primary-600"
        >
          <Text className="text-white font-semibold text-base">Permitir cámara</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Volver atrás"
          accessibilityRole="button"
          className="mt-4 py-3"
        >
          <Text className="text-neutral-500">Volver</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Capturar foto ───────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || !userId || isProcessing) return;

    try {
      // 1. Capturar foto
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        setError("No se pudo tomar la foto");
        return;
      }

      setPhotoUri(photo.uri);
      setStep("uploading");

      // 2. Comprimir y subir a Storage
      const { path, base64 } = await uploadMealPhoto(
        photo.uri,
        userId,
        effectiveMealType
      );

      setPhotoStoragePath(path);

      // 3. Llamar a IA (la mutation cambia step a "analyzing" y luego "confirming")
      aiLog.mutate({
        method: "photo",
        payload: base64,
        user_id: userId,
        meal_type: effectiveMealType as any,
        country_code: "ES", // TODO: leer del perfil
        photo_storage_path: path,
      });

      // 4. Volver al tab de logging (el AiConfirmSheet se muestra ahí)
      router.back();
    } catch (err: any) {
      setError(err.message || "Error al procesar la foto");
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  // ─── Vista de cámara ────────────────────────────────────
  return (
    <View className="flex-1 bg-neutral-900">
      <CameraView
        ref={cameraRef}
        facing={facing}
        style={{ flex: 1 }}
      >
        {/* Overlay superior: botón cerrar */}
        <View
          className="flex-row justify-between px-5"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Cerrar cámara"
            accessibilityRole="button"
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <Text className="text-white text-lg">✕</Text>
          </Pressable>

          <Pressable
            onPress={toggleFacing}
            accessibilityLabel="Cambiar cámara"
            accessibilityRole="button"
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <Text className="text-white text-lg">🔄</Text>
          </Pressable>
        </View>

        {/* Hint central */}
        <View className="flex-1 items-center justify-center">
          {!isProcessing && (
            <View className="bg-black/30 rounded-xl px-4 py-2">
              <Text className="text-white text-sm text-center">
                Centra tu plato en la foto
              </Text>
            </View>
          )}

          {isProcessing && (
            <View className="bg-black/50 rounded-2xl px-6 py-4 items-center">
              <ActivityIndicator color="white" size="large" />
              <Text className="text-white text-sm mt-2">
                {step === "uploading" ? "Subiendo foto..." : "Analizando..."}
              </Text>
            </View>
          )}
        </View>

        {/* Controles inferiores: botón de captura */}
        <View
          className="items-center pb-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={handleCapture}
            disabled={isProcessing}
            accessibilityLabel="Tomar foto"
            accessibilityRole="button"
            className={cn(
              "w-20 h-20 rounded-full border-4 border-white items-center justify-center",
              isProcessing ? "bg-white/30" : "bg-white/20 active:bg-white/40"
            )}
          >
            <View
              className={cn(
                "w-16 h-16 rounded-full",
                isProcessing ? "bg-white/50" : "bg-white"
              )}
            />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}
