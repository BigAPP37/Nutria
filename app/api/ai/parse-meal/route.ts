import { NextRequest, NextResponse } from "next/server";
import { parseMealFromText } from "@/lib/ai/parse-meal";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { input, meal_type } = await req.json();
    if (!input?.trim()) return NextResponse.json({ error: "Input vacío" }, { status: 400 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("diet_type")
      .eq("id", user.id)
      .single();

    const parsed = await parseMealFromText(input, profile?.diet_type);

    const { data: meal, error } = await supabase
      .from("meal_logs")
      .insert({
        user_id: user.id,
        raw_input: input,
        meal_type: meal_type || "snack",
        parsed_name: parsed.name,
        calories: parsed.calories,
        protein_g: parsed.protein_g,
        carbs_g: parsed.carbs_g,
        fat_g: parsed.fat_g,
        fiber_g: parsed.fiber_g,
        confidence: parsed.confidence,
        source: "ai",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ meal, parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
