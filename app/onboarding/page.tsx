"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GOALS = [
  { id: "cut", label: "Perder grasa", emoji: "🔥" },
  { id: "maintain", label: "Mantener peso", emoji: "⚖️" },
  { id: "bulk", label: "Ganar músculo", emoji: "💪" },
  { id: "recomp", label: "Recomposición", emoji: "🔄" },
];

const DIETS = [
  { id: "balanced", label: "Equilibrada" },
  { id: "keto", label: "Keto" },
  { id: "if", label: "Ayuno 16:8" },
  { id: "vegan", label: "Vegana" },
  { id: "mediterranean", label: "Mediterránea" },
];

const ACTIVITY = [
  { id: "sedentary", label: "Sedentario", sub: "Trabajo de escritorio" },
  { id: "light", label: "Ligero", sub: "1-3 días/semana" },
  { id: "moderate", label: "Moderado", sub: "3-5 días/semana" },
  { id: "active", label: "Activo", sub: "6-7 días/semana" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "male",
    height_cm: "",
    weight_kg: "",
    goal: "cut",
    diet_type: "balanced",
    activity_level: "moderate",
  });

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function finish() {
    setLoading(true);
    await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
      }),
    });
    router.push("/dashboard");
  }

  const steps = [
    // Step 0 — Personal
    <div key="personal" className="space-y-4">
      <h2 className="text-2xl font-bold">Hola, ¿cómo te llamas?</h2>
      <input
        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl px-4 py-4 text-white outline-none focus:border-green-500 transition-colors"
        placeholder="Tu nombre"
        value={form.name}
        onChange={e => set("name", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Edad</label>
          <input type="number" className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors" placeholder="25" value={form.age} onChange={e => set("age", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sexo</label>
          <select className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors" value={form.gender} onChange={e => set("gender", e.target.value)}>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Altura (cm)</label>
          <input type="number" className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors" placeholder="175" value={form.height_cm} onChange={e => set("height_cm", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Peso (kg)</label>
          <input type="number" className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors" placeholder="75" value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} />
        </div>
      </div>
    </div>,

    // Step 1 — Objetivo
    <div key="goal" className="space-y-4">
      <h2 className="text-2xl font-bold">¿Cuál es tu objetivo?</h2>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => (
          <button key={g.id} onClick={() => set("goal", g.id)}
            className={`rounded-2xl p-4 border text-left transition-all ${form.goal === g.id ? "border-green-500 bg-green-500/10" : "border-[#2a2a2a] bg-[#141414]"}`}>
            <div className="text-2xl mb-1">{g.emoji}</div>
            <div className="text-sm font-medium">{g.label}</div>
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-bold pt-2">¿Qué dieta sigues?</h2>
      <div className="flex flex-wrap gap-2">
        {DIETS.map(d => (
          <button key={d.id} onClick={() => set("diet_type", d.id)}
            className={`px-4 py-2 rounded-full border text-sm transition-all ${form.diet_type === d.id ? "border-green-500 bg-green-500/10 text-green-400" : "border-[#2a2a2a] text-gray-400"}`}>
            {d.label}
          </button>
        ))}
      </div>
    </div>,

    // Step 2 — Actividad
    <div key="activity" className="space-y-4">
      <h2 className="text-2xl font-bold">¿Cuánto te mueves?</h2>
      <div className="space-y-2">
        {ACTIVITY.map(a => (
          <button key={a.id} onClick={() => set("activity_level", a.id)}
            className={`w-full rounded-2xl p-4 border text-left transition-all ${form.activity_level === a.id ? "border-green-500 bg-green-500/10" : "border-[#2a2a2a] bg-[#141414]"}`}>
            <div className="font-medium">{a.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{a.sub}</div>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-12">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-green-500" : "bg-[#2a2a2a]"}`} />
          ))}
        </div>

        <div className="flex-1">{steps[step]}</div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-4 border border-[#2a2a2a] rounded-2xl text-gray-400 hover:text-white transition-colors">
              Atrás
            </button>
          )}
          <button
            onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : finish()}
            disabled={loading}
            className="flex-1 bg-green-500 text-black font-semibold rounded-2xl py-4 disabled:opacity-50 hover:bg-green-400 transition-colors">
            {loading ? "Guardando..." : step < steps.length - 1 ? "Continuar" : "¡Empezar!"}
          </button>
        </div>
      </div>
    </div>
  );
}
