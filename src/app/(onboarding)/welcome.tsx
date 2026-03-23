// src/app/(onboarding)/welcome.tsx
// Pantalla de bienvenida — paso 1 del onboarding.
// Sin progress bar, sin botón atrás.
// Animación de entrada: fade + slide up.

import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { setField, nextStep } = useOnboardingStore();

  // Nombre del usuario (de Supabase Auth metadata o email)
  const userName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "";

  // Animación de entrada
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleStart = () => {
    // Pre-cargar el nombre si existe
    if (userName) {
      setField("displayName", userName);
    }
    nextStep();
    router.push("/(onboarding)/body-profile");
  };

  return (
    <View
      className="flex-1 bg-neutral-50 px-6 justify-between"
      style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}
    >
      <Animated.View style={animatedStyle} className="items-center flex-1 justify-center">
        {/* Ilustración hero */}
        <Image
          source={require("@/../../assets/images/onboarding-hero.png")}
          style={{ width: 240, height: 240 }}
          contentFit="contain"
          accessibilityLabel="Ilustración de bienvenida a Nutria"
        />

        {/* Saludo */}
        <Text className="font-display text-3xl text-neutral-900 text-center mt-8 mb-3">
          {userName ? `Hola, ${userName} 👋` : "¡Bienvenido a Nutria! 👋"}
        </Text>

        {/* Propuesta de valor */}
        <Text className="text-base text-neutral-500 text-center leading-6 px-4">
          Tu compañero de nutrición inteligente.{"\n"}
          Aprende de ti para ayudarte a comer mejor, sin presiones.
        </Text>
      </Animated.View>

      {/* Botón de empezar */}
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handleStart}
          accessibilityLabel="Empezar configuración"
          accessibilityRole="button"
          className="bg-primary-500 py-4 rounded-2xl items-center active:bg-primary-600"
        >
          <Text className="text-white font-semibold text-base">Empezar</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
