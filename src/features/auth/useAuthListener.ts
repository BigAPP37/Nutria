// src/features/auth/useAuthListener.ts
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export function useAuthListener() {
  const { setSession, setOnboardingCompleted, setLoading } = useAuthStore();

  useEffect(() => {
    let isActive = true;

    async function syncSession(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      if (!isActive) return;

      setLoading(true);
      setSession(session);

      if (!session) {
        setOnboardingCompleted(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("[useAuthListener] Error recuperando onboarding:", error);
        }

        if (!isActive) return;

        setOnboardingCompleted(data?.onboarding_completed ?? false);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => syncSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [setLoading, setOnboardingCompleted, setSession]);
}
