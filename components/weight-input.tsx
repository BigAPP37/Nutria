"use client";
import { useState } from "react";

export default function WeightInput({ onSaved }: { onSaved: () => void }) {
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!weight || loading) return;
    setLoading(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_kg: parseFloat(weight) }),
    });
    setLoading(false);
    setSaved(true);
    setWeight("");
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] mb-4">
      <p className="text-sm text-gray-400 mb-3">Registrar peso de hoy</p>
      <div className="flex gap-3">
        <input
          type="number"
          step="0.1"
          placeholder="75.5"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors"
        />
        <span className="flex items-center text-gray-500 text-sm">kg</span>
        <button
          onClick={save}
          disabled={loading || !weight}
          className="px-5 py-3 bg-green-500 text-black font-semibold rounded-xl disabled:opacity-40 hover:bg-green-400 transition-colors"
        >
          {saved ? "✓" : loading ? "..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
