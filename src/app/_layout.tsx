// src/app/_layout.tsx
// Root layout: providers + auth-aware route groups
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
    <View className="flex-1 items-center justify-center bg-neutral-50">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-[28px] bg-primary-500 shadow-lg shadow-black/5">
        <ActivityIndicator size="large" color="white" />
      </View>
    </View>
  );
}

export default function RootLayout() {
  useAuthListener();
  const { session, isLoading, hasCompletedOnboarding } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor="#F6F4EF" />
        {isLoading ? (
          <SplashLoading />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#F6F4EF" },
            }}
          >
            {!!session && hasCompletedOnboarding ? (
              <>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(modals)" />
              </>
            ) : null}
            {!!session && !hasCompletedOnboarding ? (
              <Stack.Screen name="(onboarding)" />
            ) : null}
            {!session ? (
              <Stack.Screen name="(auth)" />
            ) : null}
          </Stack>
        )}
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
