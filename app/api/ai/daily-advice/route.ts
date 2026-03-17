import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDailyAdvice } from "@/lib/ai/advice-engine";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];

    const [{ data: profile }, { data: meals }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("meal_logs")
        .select("calories,protein_g,carbs_g,fat_g,fiber_g")
        .eq("user_id", user.id)
        .gte("logged_at", `${today}T00:00:00`)
        .lte("logged_at", `${today}T23:59:59`),
    ]);

    if (!profile) return NextResponse.json({ advice: "Completa tu perfil para obtener consejos." });

    const totals = (meals || []).reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein_g: acc.protein_g + (m.protein_g || 0),
        carbs_g: acc.carbs_g + (m.carbs_g || 0),
        fat_g: acc.fat_g + (m.fat_g || 0),
        fiber_g: acc.fiber_g + (m.fiber_g || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    );

    const advice = await getDailyAdvice(profile, totals, new Date().getHours());
    return NextResponse.json({ advice, totals });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
