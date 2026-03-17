"use client";
import { useState, useRef } from "react";
import { getMealTypeByHour } from "@/lib/utils/macros";

interface Props {
  onMealAdded: () => void;
}

export default function ChatInput({ onMealAdded }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ name: string; calories: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setInput("");

    const res = await fetch("/api/ai/parse-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: text,
        meal_type: getMealTypeByHour(new Date().getHours()),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.parsed) {
      setLastResult({ name: data.parsed.name, calories: data.parsed.calories });
      onMealAdded();
      setTimeout(() => setLastResult(null), 3000);
    }

    inputRef.current?.focus();
  }

  return (
    <div className="my-4">
      {/* Feedback */}
      {lastResult && (
        <div className="mb-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 animate-pulse">
          <span className="text-green-400 text-sm">✓</span>
          <span className="text-green-300 text-sm font-medium">{lastResult.name}</span>
          <span className="text-green-500 text-sm ml-auto">{lastResult.calories} kcal</span>
        </div>
      )}

      <div className="flex gap-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-2 focus-within:border-green-500/50 transition-colors">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Qué has comido... ej: 2 huevos revueltos y tostada"
          className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-2 text-sm"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-green-400 transition-colors flex-shrink-0"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-2 text-center">
        Escribe en lenguaje natural · La IA calcula los macros
      </p>
    </div>
  );
}
