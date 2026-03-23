// src/app/(modals)/paywall.tsx
// Paywall como pantalla modal completa.
// Se usa cuando el contexto no permite bottom sheet (ej: desde stats).
// Misma lógica de compra que PaywallSheet, presentación full-screen.

import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/authStore";
import { usePremiumStore } from "@/stores/premiumStore";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from "@/lib/purchases";
import type { PurchasesPackage } from "react-native-purchases";
import type { PaywallTrigger } from "@/hooks/usePremiumGate";

const FEATURES = [
  { emoji: "📷", text: "Fotos ilimitadas al día" },
  { emoji: "🎯", text: "Algoritmo TDEE que aprende de ti" },
  { emoji: "📈", text: "Gráficos de peso y calorías" },
  { emoji: "📅", text: "Historial completo (90+ días)" },
  { emoji: "🥗", text: "Análisis de macros detallado" },
  { emoji: "📋", text: "Exportar datos a CSV" },
];

export default function PaywallModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ trigger?: string }>();
  const trigger = (params.trigger as PaywallTrigger) ?? "stats";

  const userId = useAuthStore((s) => s.user?.id);
  const { setPremium } = usePremiumStore();

  const [packages, setPackages] = useState<{
    monthly: PurchasesPackage | null;
    annual: PurchasesPackage | null;
  }>({ monthly: null, annual: null });
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    const offering = await getOfferings();
    if (!offering) return;
    setPackages({
      monthly:
        offering.availablePackages.find((p) => p.packageType === "MONTHLY") ??
        null,
      annual:
        offering.availablePackages.find((p) => p.packageType === "ANNUAL") ??
        null,
    });
  };

  const handlePurchase = async () => {
    const pkg = selectedPlan === "annual" ? packages.annual : packages.monthly;
    if (!pkg) return;

    setIsPurchasing(true);
    setError(null);

    try {
      const result = await purchasePackage(pkg, userId);
      if (result.success) {
        setPremium(true);
        router.back();
      }
    } catch {
      setError("No se pudo completar la compra.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);
    try {
      const restored = await restorePurchases(userId);
      if (restored) {
        setPremium(true);
        router.back();
      } else {
        setError("No se encontraron compras anteriores.");
      }
    } catch {
      setError("Error al restaurar.");
    } finally {
      setIsRestoring(false);
    }
  };

  const monthlyPrice = packages.monthly?.product.priceString ?? "4,99 €/mes";
  const annualPrice = packages.annual?.product.priceString ?? "39,99 €/año";
  const hasTrial = packages.annual?.product.introPrice !== null;

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Botón cerrar */}
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Cerrar"
        accessibilityRole="button"
        className="absolute z-10 right-5 w-10 h-10 rounded-full bg-neutral-200 items-center justify-center"
        style={{ top: insets.top + 8 }}
      >
        <Text className="text-neutral-600 text-lg">✕</Text>
      </Pressable>

      <ScrollView
        contentContainerClassName="px-6 pb-10 items-center"
        style={{ paddingTop: insets.top + 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Text className="text-6xl mb-4">✨</Text>
        <Text className="font-display text-3xl text-neutral-900 text-center mb-2">
          Nutria Premium
        </Text>
        <Text className="text-base text-neutral-500 text-center mb-8">
          Lleva tu nutrición al siguiente nivel
        </Text>

        {/* Features */}
        <View className="w-full mb-8">
          {FEATURES.map((f, i) => (
            <View key={i} className="flex-row items-center mb-3.5">
              <Text className="text-2xl mr-3.5">{f.emoji}</Text>
              <Text className="text-base text-neutral-700 flex-1">
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Planes */}
        <View className="flex-row gap-3 w-full mb-5">
          <Pressable
            onPress={() => setSelectedPlan("monthly")}
            accessibilityLabel={`Plan mensual: ${monthlyPrice}`}
            accessibilityRole="button"
            className={cn(
              "flex-1 py-4 px-3 rounded-xl border-2 items-center",
              selectedPlan === "monthly"
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 bg-white"
            )}
          >
            <Text
              className={cn(
                "text-sm font-medium mb-1",
                selectedPlan === "monthly" ? "text-primary-700" : "text-neutral-700"
              )}
            >
              Mensual
            </Text>
            <Text
              className={cn(
                "text-base font-bold",
                selectedPlan === "monthly" ? "text-primary-800" : "text-neutral-900"
              )}
            >
              {monthlyPrice}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedPlan("annual")}
            accessibilityLabel={`Plan anual: ${annualPrice}, ahorra 33%`}
            accessibilityRole="button"
            className={cn(
              "flex-1 py-4 px-3 rounded-xl border-2 items-center relative",
              selectedPlan === "annual"
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 bg-white"
            )}
          >
            <View className="absolute -top-2.5 bg-secondary-500 rounded-full px-2.5 py-0.5">
              <Text className="text-[10px] font-semibold text-white">Ahorra 33%</Text>
            </View>
            <Text
              className={cn(
                "text-sm font-medium mb-1",
                selectedPlan === "annual" ? "text-primary-700" : "text-neutral-700"
              )}
            >
              Anual
            </Text>
            <Text
              className={cn(
                "text-base font-bold",
                selectedPlan === "annual" ? "text-primary-800" : "text-neutral-900"
              )}
            >
              {annualPrice}
            </Text>
          </Pressable>
        </View>

        {/* Error */}
        {error && (
          <View className="bg-warm-50 rounded-xl px-4 py-2.5 mb-3 w-full">
            <Text className="text-sm text-warm-700 text-center">{error}</Text>
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing}
          accessibilityLabel={hasTrial ? "Probar 7 días gratis" : "Empezar Premium"}
          accessibilityRole="button"
          className="bg-primary-500 py-4 rounded-2xl items-center mb-3 w-full active:bg-primary-600"
        >
          {isPurchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">
              {hasTrial ? "Probar 7 días gratis" : "Empezar Premium"}
            </Text>
          )}
        </Pressable>

        {/* Restaurar */}
        <Pressable
          onPress={handleRestore}
          disabled={isRestoring}
          accessibilityLabel="Restaurar compras"
          accessibilityRole="button"
          className="py-2 mb-3"
        >
          <Text className="text-neutral-400 text-xs underline">
            {isRestoring ? "Restaurando..." : "Restaurar compras"}
          </Text>
        </Pressable>

        {/* Legal */}
        <Text className="text-xs text-neutral-400 text-center leading-4">
          Cancela cuando quieras · Sin compromiso{"\n"}
          La suscripción se renueva automáticamente.{"\n"}
          El pago se carga a tu cuenta de{" "}
          {/* Platform.OS === "ios" ? "Apple" : "Google" */}
          App Store/Google Play.
        </Text>
      </ScrollView>
    </View>
  );
}
