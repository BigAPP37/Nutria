// src/components/premium/PaywallSheet.tsx
// Bottom sheet de upgrade premium. No agresivo, propuesta de valor clara.
// Contenido contextual según el trigger (foto, historial, stats, TDEE).
// Tono: amigable, sin presión, sin FOMO agresivo.

import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
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

interface PaywallSheetProps {
  isVisible: boolean;
  trigger: PaywallTrigger;
  onDismiss: () => void;
  onPurchaseComplete?: () => void;
}

// Contenido contextual por trigger
const CONTENT: Record<
  PaywallTrigger,
  { title: string; bullets: string[] }
> = {
  photo_limit: {
    title: "Has usado tus 5 fotos de hoy",
    bullets: [
      "📷  Fotos ilimitadas para registrar cada comida",
      "📊  Algoritmo que aprende de ti cada semana",
      "📈  Gráficos de progreso detallados",
    ],
  },
  history: {
    title: "El historial completo es Premium",
    bullets: [
      "📅  Accede a todo tu historial (90+ días)",
      "📊  Algoritmo TDEE que se adapta a ti",
      "📷  Fotos ilimitadas al día",
    ],
  },
  stats: {
    title: "Los gráficos de progreso son Premium",
    bullets: [
      "📈  Gráficos de peso y calorías semanales",
      "📊  Algoritmo que mejora tu plan cada semana",
      "📅  Historial completo con tendencias",
    ],
  },
  adaptive_tdee: {
    title: "Tu plan podría ser más preciso",
    bullets: [
      "🎯  Algoritmo que aprende de tu cuerpo real",
      "📊  Se ajusta cada semana con tus datos",
      "📈  Gráficos de evolución detallados",
    ],
  },
};

export function PaywallSheet({
  isVisible,
  trigger,
  onDismiss,
  onPurchaseComplete,
}: PaywallSheetProps) {
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

  const snapPoints = useMemo(() => ["88%"], []);
  const content = CONTENT[trigger];

  // Cargar ofertas al abrir
  useEffect(() => {
    if (!isVisible) return;
    loadOfferings();
  }, [isVisible]);

  const loadOfferings = async () => {
    const offering = await getOfferings();
    if (!offering) return;

    // Buscar paquetes mensual y anual
    const monthly = offering.availablePackages.find(
      (p) => p.packageType === "MONTHLY"
    ) ?? null;
    const annual = offering.availablePackages.find(
      (p) => p.packageType === "ANNUAL"
    ) ?? null;

    setPackages({ monthly, annual });
  };

  // Comprar
  const handlePurchase = async () => {
    const pkg = selectedPlan === "annual" ? packages.annual : packages.monthly;
    if (!pkg) return;

    setIsPurchasing(true);
    setError(null);

    try {
      const result = await purchasePackage(pkg, userId);
      if (result.success) {
        setPremium(true);
        onDismiss();
        onPurchaseComplete?.();
      }
    } catch (err: any) {
      setError("No se pudo completar la compra. Inténtalo de nuevo.");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Restaurar
  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);

    try {
      const restored = await restorePurchases(userId);
      if (restored) {
        setPremium(true);
        onDismiss();
        onPurchaseComplete?.();
      } else {
        setError("No se encontraron compras anteriores.");
      }
    } catch {
      setError("Error al restaurar. Inténtalo de nuevo.");
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isVisible) return null;

  // Precios (de RevenueCat o fallback)
  const monthlyPrice = packages.monthly?.product.priceString ?? "4,99 €/mes";
  const annualPrice = packages.annual?.product.priceString ?? "39,99 €/año";
  const hasTrial = packages.annual?.product.introPrice !== null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
      backgroundStyle={{ backgroundColor: "#FAFAF9" }}
      handleIndicatorStyle={{ backgroundColor: "#D6D3D1" }}
    >
      <BottomSheetView className="flex-1 px-6 pt-2 pb-6">
        {/* Emoji hero */}
        <View className="items-center mb-4">
          <Text className="text-5xl">✨</Text>
        </View>

        {/* Título contextual */}
        <Text className="font-display text-2xl text-neutral-900 text-center mb-2">
          {content.title}
        </Text>
        <Text className="text-base text-neutral-500 text-center mb-6">
          Con Nutria Premium, sin límites.
        </Text>

        {/* Beneficios */}
        <View className="mb-6">
          {content.bullets.map((bullet, i) => (
            <View key={i} className="flex-row items-start mb-3">
              <Text className="text-base leading-6 text-neutral-700">
                {bullet}
              </Text>
            </View>
          ))}
        </View>

        {/* Selector de plan */}
        <View className="flex-row gap-3 mb-5">
          <PlanCard
            label="Mensual"
            price={monthlyPrice}
            isSelected={selectedPlan === "monthly"}
            onPress={() => setSelectedPlan("monthly")}
          />
          <PlanCard
            label="Anual"
            price={annualPrice}
            badge="Ahorra 33%"
            isSelected={selectedPlan === "annual"}
            onPress={() => setSelectedPlan("annual")}
          />
        </View>

        {/* Error */}
        {error && (
          <View className="bg-warm-50 rounded-xl px-4 py-2.5 mb-3">
            <Text className="text-sm text-warm-700 text-center">{error}</Text>
          </View>
        )}

        {/* Botón principal */}
        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing}
          accessibilityLabel={
            hasTrial ? "Probar 7 días gratis" : "Empezar Premium"
          }
          accessibilityRole="button"
          className="bg-primary-500 py-4 rounded-2xl items-center mb-3 active:bg-primary-600"
        >
          {isPurchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              {hasTrial ? "Probar 7 días gratis" : "Empezar Premium"}
            </Text>
          )}
        </Pressable>

        {/* Botón secundario: quizás más tarde */}
        <Pressable
          onPress={onDismiss}
          accessibilityLabel="Quizás más tarde"
          accessibilityRole="button"
          className="py-3 items-center mb-3"
        >
          <Text className="text-neutral-500 text-sm">Quizás más tarde</Text>
        </Pressable>

        {/* Restaurar compras */}
        <Pressable
          onPress={handleRestore}
          disabled={isRestoring}
          accessibilityLabel="Restaurar compras"
          accessibilityRole="button"
          className="py-2 items-center mb-2"
        >
          <Text className="text-neutral-400 text-xs underline">
            {isRestoring ? "Restaurando..." : "Restaurar compras"}
          </Text>
        </Pressable>

        {/* Legal */}
        <Text className="text-xs text-neutral-400 text-center leading-4">
          Cancela cuando quieras · Sin compromiso{"\n"}
          La suscripción se renueva automáticamente
        </Text>
      </BottomSheetView>
    </BottomSheet>
  );
}

// Subcomponente: card de plan
function PlanCard({
  label,
  price,
  badge,
  isSelected,
  onPress,
}: {
  label: string;
  price: string;
  badge?: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Plan ${label}: ${price}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={cn(
        "flex-1 py-4 px-3 rounded-xl border-2 items-center relative",
        isSelected
          ? "border-primary-500 bg-primary-50"
          : "border-neutral-200 bg-white"
      )}
    >
      {badge && (
        <View className="absolute -top-2.5 bg-secondary-500 rounded-full px-2.5 py-0.5">
          <Text className="text-[10px] font-semibold text-white">{badge}</Text>
        </View>
      )}
      <Text
        className={cn(
          "text-sm font-medium mb-1",
          isSelected ? "text-primary-700" : "text-neutral-700"
        )}
      >
        {label}
      </Text>
      <Text
        className={cn(
          "text-base font-bold",
          isSelected ? "text-primary-800" : "text-neutral-900"
        )}
      >
        {price}
      </Text>
    </Pressable>
  );
}
