import type { Href } from "expo-router";

export type MealTypeRouteParam = "breakfast" | "lunch" | "dinner" | "snack";
export type MealType = MealTypeRouteParam;

export const routes = {
  auth: {
    login: "/(auth)/login",
    register: "/(auth)/register",
  },
  tabs: {
    root: "/(tabs)",
    log: "/(tabs)/log",
  },
  onboarding: {
    welcome: "/(onboarding)/welcome",
    bodyProfile: "/(onboarding)/body-profile",
    goal: "/(onboarding)/goal",
    activity: "/(onboarding)/activity",
    tcaScreening: "/(onboarding)/tca-screening",
    preferences: "/(onboarding)/preferences",
    ready: "/(onboarding)/ready",
  },
  modals: {
    camera: "/(modals)/camera",
    weightLog: "/(modals)/weight-log",
  },
} as const satisfies Record<string, Record<string, Href>>;

export function foodDetailRoute(foodId: string, mealType?: MealTypeRouteParam) {
  return {
    pathname: "/(modals)/food-detail",
    params: mealType ? { foodId, mealType } : { foodId },
  } as const satisfies Href;
}
