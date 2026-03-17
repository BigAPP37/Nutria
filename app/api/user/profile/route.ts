import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateTargets } from "@/lib/utils/macros";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const targets = calculateTargets({
    weight_kg: body.weight_kg,
    height_cm: body.height_cm,
    age: body.age,
    gender: body.gender,
    activity_level: body.activity_level,
    goal: body.goal,
  });

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      ...body,
      target_calories: targets.calories,
      target_protein: targets.protein,
      target_carbs: targets.carbs,
      target_fat: targets.fat,
      tdee_estimated: targets.calories,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
