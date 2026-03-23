// src/features/auth/useAuthListener.ts
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export function useAuthListener() {
  const { setSession, setOnboardingCompleted, setLoading } = useAuthStore();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkOnboarding(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session && event === "SIGNED_IN") await checkOnboarding(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function checkOnboarding(userId: string) {
    const { data } = await supabase.from("user_profiles").select("onboarding_completed").eq("id", userId).single();
    setOnboardingCompleted(data?.onboarding_completed ?? false);
    setLoading(false);
  }
}
