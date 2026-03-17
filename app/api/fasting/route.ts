import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data } = await supabase
    .from("fasting_sessions")
    .select("*")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .single();

  return NextResponse.json({ session: data || null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { action, target_hours } = await req.json();

  if (action === "start") {
    const { data, error } = await supabase
      .from("fasting_sessions")
      .insert({ user_id: user.id, started_at: new Date().toISOString(), target_hours: target_hours || 16 })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: data });
  }

  if (action === "stop") {
    const { data: active } = await supabase
      .from("fasting_sessions")
      .select("id,started_at,target_hours")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .single();

    if (!active) return NextResponse.json({ error: "No hay ayuno activo" }, { status: 400 });

    const elapsed = (Date.now() - new Date(active.started_at).getTime()) / 3600000;
    const { data, error } = await supabase
      .from("fasting_sessions")
      .update({ ended_at: new Date().toISOString(), completed: elapsed >= active.target_hours })
      .eq("id", active.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: data });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
