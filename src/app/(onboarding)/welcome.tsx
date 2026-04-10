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
import { routes } from "@/types/navigation";

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
    // Reanimated shared values are mutated imperatively by design.
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity, translateY]);

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
    router.push(routes.onboarding.bodyProfile);
  };

  return (
    <View
      className="flex-1 justify-between bg-neutral-50 px-6"
      style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}
    >
      <Animated.View style={animatedStyle} className="items-center flex-1 justify-center">
        <View className="mb-8 h-[260px] w-full max-w-[320px] items-center justify-center rounded-[40px] bg-white shadow-lg shadow-black/5">
          <View className="absolute left-6 top-6 h-10 w-10 rounded-2xl bg-secondary-100" />
          <View className="absolute bottom-8 right-8 h-16 w-16 rounded-[28px] bg-primary-100" />
          <Image
            source="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80"
            alt="Bodegón de comida saludable"
            style={{ width: 240, height: 240, borderRadius: 28 }}
            contentFit="cover"
            accessibilityLabel="Imagen de bienvenida de Nutria"
          />
        </View>

        {/* Saludo */}
        <Text className="font-display mt-2 text-center text-4xl text-neutral-900">
          {userName ? `Hola, ${userName} 👋` : "¡Bienvenido a Nutria! 👋"}
        </Text>

        {/* Propuesta de valor */}
        <Text className="mt-4 px-4 text-center text-base leading-7 text-neutral-600">
          Seguimiento claro, decisiones más tranquilas y una interfaz hecha para volver varias veces al día sin fatiga.
        </Text>
      </Animated.View>

      {/* Botón de empezar */}
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handleStart}
          accessibilityLabel="Empezar configuración"
          accessibilityRole="button"
          className="items-center rounded-[28px] bg-primary-500 py-5 active:bg-primary-600"
        >
          <Text className="text-white font-semibold text-base">Empezar</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
