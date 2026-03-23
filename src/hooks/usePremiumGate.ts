// src/hooks/usePremiumGate.ts
// Hook para verificar acceso a features premium y mostrar paywall.
// Uso: const { checkPhotoLog, showPaywall } = usePremiumGate();

import { useState, useCallback } from "react";
import { usePremiumStore } from "@/stores/premiumStore";

export type PaywallTrigger =
  | "photo_limit"
  | "history"
  | "stats"
  | "adaptive_tdee";

export function usePremiumGate() {
  const {
    canUsePhotoLog,
    canViewHistory,
    canViewStats,
    canUseAdaptiveTdee,
    remainingPhotos,
  } = usePremiumStore();

  // Estado local para mostrar el paywall
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger>("photo_limit");

  const showPaywall = useCallback((trigger: PaywallTrigger) => {
    setPaywallTrigger(trigger);
    setPaywallVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setPaywallVisible(false);
  }, []);

  // Gate para foto: retorna true si puede, false si debe ver paywall
  const checkPhotoLog = useCallback((): boolean => {
    if (canUsePhotoLog()) return true;
    showPaywall("photo_limit");
    return false;
  }, [canUsePhotoLog]);

  // Gate para historial
  const checkHistory = useCallback(
    (daysBack: number): boolean => {
      if (canViewHistory(daysBack)) return true;
      showPaywall("history");
      return false;
    },
    [canViewHistory]
  );

  // Gate para estadísticas
  const checkStats = useCallback((): boolean => {
    if (canViewStats()) return true;
    showPaywall("stats");
    return false;
  }, [canViewStats]);

  // Gate para TDEE adaptativo
  const checkAdaptiveTdee = useCallback((): boolean => {
    if (canUseAdaptiveTdee()) return true;
    showPaywall("adaptive_tdee");
    return false;
  }, [canUseAdaptiveTdee]);

  return {
    // Gates (retornan boolean, muestran paywall si false)
    checkPhotoLog,
    checkHistory,
    checkStats,
    checkAdaptiveTdee,

    // Info
    remainingPhotos: remainingPhotos(),

    // Control del paywall
    paywallVisible,
    paywallTrigger,
    showPaywall,
    hidePaywall,
  };
}
