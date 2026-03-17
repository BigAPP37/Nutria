"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ name: string; target_calories: number; target_protein: number; target_carbs: number; target_fat: number; goal: string; diet_type: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(({ profile: p }) => setProfile(p));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) return null;

  const goalLabels: Record<string, string> = { cut: "Perder grasa", maintain: "Mantener", bulk: "Ganar músculo", recomp: "Recomposición" };

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Perfil</h1>

      <div className="space-y-3">
        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-400">Nombre</p>
          <p className="font-medium mt-1">{profile.name}</p>
        </div>

        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-400 mb-3">Objetivo diario</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Calorías", value: profile.target_calories, unit: "kcal", color: "text-white" },
              { label: "Proteína", value: profile.target_protein, unit: "g", color: "text-blue-400" },
              { label: "Carbos", value: profile.target_carbs, unit: "g", color: "text-amber-400" },
              { label: "Grasa", value: profile.target_fat, unit: "g", color: "text-green-400" },
            ].map(item => (
              <div key={item.label}>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500">{item.unit}</p>
                <p className="text-xs text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
            <p className="text-xs text-gray-400">Meta</p>
            <p className="font-medium mt-1">{goalLabels[profile.goal] || profile.goal}</p>
          </div>
          <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
            <p className="text-xs text-gray-400">Dieta</p>
            <p className="font-medium mt-1 capitalize">{profile.diet_type}</p>
          </div>
        </div>

        <button onClick={signOut}
          className="w-full py-4 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium mt-4">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
