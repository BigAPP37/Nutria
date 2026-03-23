// src/components/psych/PsychSupportCard.tsx
// Card no intrusiva de soporte psicológico.
// Aparece en el dashboard si hay un flag activo.
// Tono cálido, nunca alarmista. Feedback opcional tras dismiss.

import { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useUiStore } from "@/stores/uiStore";

interface PsychSupportCardProps {
  flagId: string;
  messageKey: string;
  messageContent: string;
  onDismiss: () => Promise<string>; // retorna responseId
  onFeedback: (responseId: string, helpful: boolean) => void;
}

export function PsychSupportCard({
  flagId,
  messageKey,
  messageContent,
  onDismiss,
  onFeedback,
}: PsychSupportCardProps) {
  const { hapticFeedback } = useUiStore();

  // Estados locales
  const [isDismissed, setIsDismissed] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Animaciones
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(-20);
  const feedbackOpacity = useSharedValue(0);

  // Animación de entrada: slide down + fade
  useEffect(() => {
    cardOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    cardTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }));

  // Handler: dismiss
  const handleDismiss = async () => {
    hapticFeedback("light");

    try {
      const id = await onDismiss();
      setResponseId(id);
      setIsDismissed(true);

      // Mostrar botones de feedback con fade
      feedbackOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 300 })
      );

      // Auto-ocultar feedback tras 5s
      setTimeout(() => {
        if (!feedbackGiven) {
          feedbackOpacity.value = withTiming(0, { duration: 300 });
        }
      }, 5000);
    } catch {
      // Fallar silenciosamente
    }
  };

  // Handler: feedback
  const handleFeedback = (helpful: boolean) => {
    if (!responseId || feedbackGiven) return;
    hapticFeedback("light");
    setFeedbackGiven(true);
    onFeedback(responseId, helpful);

    // Fade out todo el componente tras dar feedback
    setTimeout(() => {
      cardOpacity.value = withTiming(0, { duration: 400 });
    }, 800);
  };

  // Si ya dio feedback y pasó el tiempo, no renderizar
  // (el componente se oculta con opacity y el padre lo desmonta al invalidar la query)

  return (
    <Animated.View style={cardStyle} className="mx-6 mb-4">
      <View className="bg-warm-50 border border-warm-200 rounded-2xl p-5">
        {/* Mensaje principal */}
        {!isDismissed && (
          <>
            <Text className="text-base text-warm-800 leading-6 mb-4">
              {messageContent}
            </Text>

            <Pressable
              onPress={handleDismiss}
              accessibilityLabel="Entendido, cerrar mensaje"
              accessibilityRole="button"
              className="bg-white border border-warm-200 rounded-xl py-3 items-center active:bg-warm-100"
            >
              <Text className="text-warm-700 font-medium text-sm">
                Entendido
              </Text>
            </Pressable>
          </>
        )}

        {/* Feedback tras dismiss */}
        {isDismissed && !feedbackGiven && (
          <Animated.View style={feedbackStyle}>
            <Text className="text-sm text-warm-600 text-center mb-3">
              ¿Te fue útil este mensaje?
            </Text>
            <View className="flex-row justify-center gap-3">
              <Pressable
                onPress={() => handleFeedback(true)}
                accessibilityLabel="Sí, me fue útil"
                accessibilityRole="button"
                className="bg-white border border-warm-200 rounded-lg px-5 py-2 active:bg-warm-100"
              >
                <Text className="text-warm-700 text-sm">Sí 👍</Text>
              </Pressable>
              <Pressable
                onPress={() => handleFeedback(false)}
                accessibilityLabel="No me fue útil"
                accessibilityRole="button"
                className="bg-white border border-warm-200 rounded-lg px-5 py-2 active:bg-warm-100"
              >
                <Text className="text-warm-700 text-sm">No 👎</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Agradecimiento tras feedback */}
        {feedbackGiven && (
          <Animated.View style={feedbackStyle}>
            <Text className="text-sm text-warm-600 text-center">
              Gracias por tu respuesta 💛
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
