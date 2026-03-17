"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import WeightInput from "@/components/weight-input";

export default function StatsPage() {
  const [weights, setWeights] = useState<{ logged_at: string; weight_kg: number }[]>([]);

  async function fetchWeights() {
    const res = await fetch("/api/weight");
    const { weights: w } = await res.json();
    setWeights((w || []).reverse());
  }

  useEffect(() => { fetchWeights(); }, []);

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Evolución</h1>

      <WeightInput onSaved={fetchWeights} />

      {weights.length > 1 && (
        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] mt-4">
          <p className="text-sm text-gray-400 mb-4">Peso (últimos 30 días)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weights}>
              <XAxis dataKey="logged_at" hide />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip
                contentStyle={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 12, color: "#fff" }}
                labelStyle={{ color: "#888", fontSize: 11 }}
                formatter={(v: number) => [`${v} kg`, "Peso"]}
              />
              <Line type="monotone" dataKey="weight_kg" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-gray-500">Inicio: <span className="text-white">{weights[0]?.weight_kg} kg</span></span>
            <span className="text-gray-500">Ahora: <span className="text-white">{weights[weights.length - 1]?.weight_kg} kg</span></span>
            <span className="text-gray-500">Δ: <span className={weights[weights.length-1]?.weight_kg - weights[0]?.weight_kg < 0 ? "text-green-400" : "text-red-400"}>
              {((weights[weights.length-1]?.weight_kg || 0) - (weights[0]?.weight_kg || 0)).toFixed(1)} kg
            </span></span>
          </div>
        </div>
      )}

      {weights.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">⚖️</p>
          <p>Registra tu peso para ver tu evolución</p>
        </div>
      )}
    </div>
  );
}
