"use client";
import { useEffect, useState } from "react";

export default function AiAdviceBanner() {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/daily-advice")
      .then(r => r.json())
      .then(({ advice: a }) => { setAdvice(a || ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] mb-4 animate-pulse">
        <div className="h-3 bg-[#2a2a2a] rounded w-3/4" />
      </div>
    );
  }

  if (!advice) return null;

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/5 rounded-2xl p-4 border border-green-500/20 mb-4">
      <div className="flex gap-3 items-start">
        <span className="text-lg">✨</span>
        <p className="text-sm text-gray-300 leading-relaxed">{advice}</p>
      </div>
    </div>
  );
}
