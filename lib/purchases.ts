// src/lib/purchases.ts
// Configuración de RevenueCat para monetización.
// Maneja inicialización, verificación de status, compra y restauración.
// Sincroniza el estado premium con Supabase (user_profiles).

import { Platform } from "react-native";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import { supabase } from "@/lib/supabase";

// Claves de API de RevenueCat (una por plataforma)
const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "";
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "";

// IDs de producto (configurados en App Store Connect / Google Play Console)
export const MONTHLY_PRODUCT_ID = "nutria_premium_monthly";
export const ANNUAL_PRODUCT_ID = "nutria_premium_annual";

// Entitlement ID en RevenueCat (el acceso premium)
const PREMIUM_ENTITLEMENT = "premium";

let isConfigured = false;

/**
 * Inicializa RevenueCat. Llamar una vez al montar la app.
 * Si ya está configurado, no hace nada (idempotente).
 */
export async function configurePurchases(userId?: string): Promise<void> {
  if (isConfigured) return;

  const apiKey = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;

  if (!apiKey) {
    console.warn("RevenueCat API key no configurada para esta plataforma");
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey,
    appUserID: userId ?? null, // vincular con el user de Supabase
  });

  isConfigured = true;
}

/**
 * Vincula el user de Supabase Auth con RevenueCat.
 * Llamar después del login.
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.error("Error identificando usuario en RevenueCat:", err);
  }
}

/**
 * Verifica si el usuario tiene premium activo.
 * Consulta RevenueCat (fuente de verdad) y sincroniza con Supabase.
 */
export async function checkPremiumStatus(userId?: string): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium =
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    // Sincronizar con Supabase si tenemos userId
    if (userId) {
      const expiresAt =
        customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]
          ?.expirationDate ?? null;

      await supabase
        .from("user_profiles")
        .update({
          is_premium: isPremium,
          premium_expires_at: expiresAt,
        })
        .eq("id", userId);
    }

    return isPremium;
  } catch (err) {
    console.error("Error verificando premium:", err);
    // Fallback: consultar Supabase si RevenueCat falla
    if (userId) {
      return checkPremiumFromSupabase(userId);
    }
    return false;
  }
}

/**
 * Fallback: verificar premium desde Supabase
 * (si RevenueCat no responde).
 */
async function checkPremiumFromSupabase(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", userId)
      .single();

    if (!data?.is_premium) return false;
    if (!data.premium_expires_at) return data.is_premium;

    // Verificar que no haya expirado
    return new Date(data.premium_expires_at) > new Date();
  } catch {
    return false;
  }
}

/**
 * Obtiene las ofertas disponibles (mensual y anual).
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (err) {
    console.error("Error obteniendo ofertas:", err);
    return null;
  }
}

/**
 * Ejecuta la compra de un paquete.
 * RevenueCat maneja los receipts automáticamente.
 * Si la compra es exitosa, sincroniza con Supabase.
 */
export async function purchasePackage(
  pkg: PurchasesPackage,
  userId?: string
): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium =
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    // Sincronizar con Supabase
    if (isPremium && userId) {
      const expiresAt =
        customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]
          ?.expirationDate ?? null;

      await supabase
        .from("user_profiles")
        .update({
          is_premium: true,
          premium_expires_at: expiresAt,
        })
        .eq("id", userId);
    }

    return { success: isPremium, customerInfo };
  } catch (err: any) {
    // El usuario canceló la compra — no es un error real
    if (err.userCancelled) {
      return { success: false };
    }
    console.error("Error en compra:", err);
    throw err;
  }
}

/**
 * Restaura compras anteriores (cambio de dispositivo, reinstalación).
 */
export async function restorePurchases(
  userId?: string
): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium =
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    if (userId) {
      await supabase
        .from("user_profiles")
        .update({
          is_premium: isPremium,
          premium_expires_at: isPremium
            ? customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]
                ?.expirationDate ?? null
            : null,
        })
        .eq("id", userId);
    }

    return isPremium;
  } catch (err) {
    console.error("Error restaurando compras:", err);
    return false;
  }
}
