// src/app/_layout.tsx
// Root layout: providers + Stack.Protected guards
import "../global.css";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { useAuthListener } from "@/features/auth/useAuthListener";

function SplashLoading() {
  return (
    <View className="flex-1 bg-neutral-50 items-center justify-center">
      <ActivityIndicator size="large" color="#F97316" />
    </View>
  );
}

export default function RootLayout() {
  useAuthListener();
  const { session, isLoading, hasCompletedOnboarding } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        {isLoading ? (
          <SplashLoading />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!!session && hasCompletedOnboarding}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(modals)" />
            </Stack.Protected>
            <Stack.Protected guard={!!session && !hasCompletedOnboarding}>
              <Stack.Screen name="(onboarding)" />
            </Stack.Protected>
            <Stack.Protected guard={!session}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        )}
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
