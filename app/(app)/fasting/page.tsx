"use client";
import { useEffect, useState } from "react";
import { getFastingProgress, formatFastingTime } from "@/lib/utils/fasting";

export default function FastingPage() {
  const [session, setSession] = useState<{ started_at: string; target_hours: number } | null>(null);
  const [progress, setProgress] = useState({ elapsed: 0, remaining: 0, percentage: 0, label: "" });
  const [loading, setLoading] = useState(false);
  const [targetHours, setTargetHours] = useState(16);

  useEffect(() => {
    fetch("/api/fasting").then(r => r.json()).then(({ session: s }) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session) return;
    const update = () => setProgress(getFastingProgress(session.started_at, session.target_hours));
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, [session]);

  async function toggle() {
    setLoading(true);
    const action = session ? "stop" : "start";
    const res = await fetch("/api/fasting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, target_hours: targetHours }),
    });
    const { session: s } = await res.json();
    setSession(action === "stop" ? null : s);
    setLoading(false);
  }

  const circumference = 2 * Math.PI * 80;
  const strokeDash = circumference - (progress.percentage / 100) * circumference;

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-8">Ayuno Intermitente</h1>

      {/* Circle Timer */}
      <div className="flex flex-col items-center mb-8">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#1e1e1e" strokeWidth="8" />
          <circle
            cx="100" cy="100" r="80"
            fill="none"
            stroke={progress.percentage >= 100 ? "#22c55e" : "#3b82f6"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={session ? strokeDash : circumference}
            transform="rotate(-90 100 100)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
          <text x="100" y="88" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="-apple-system">
            {session ? formatFastingTime(progress.elapsed) : "--:--"}
          </text>
          <text x="100" y="112" textAnchor="middle" fill="#888" fontSize="12" fontFamily="-apple-system">
            {session ? progress.label : "Sin ayuno activo"}
          </text>
        </svg>

        {session && (
          <p className="text-gray-400 text-sm mt-2">
            Faltan {formatFastingTime(progress.remaining)} para completar
          </p>
        )}
      </div>

      {/* Target selector */}
      {!session && (
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">Duración objetivo</p>
          <div className="flex gap-2">
            {[12, 14, 16, 18, 20].map(h => (
              <button key={h} onClick={() => setTargetHours(h)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${targetHours === h ? "border-green-500 bg-green-500/10 text-green-400" : "border-[#2a2a2a] text-gray-500"}`}>
                {h}h
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-semibold transition-all disabled:opacity-50 ${session ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-green-500 text-black hover:bg-green-400"}`}>
        {loading ? "..." : session ? "Terminar ayuno" : `Iniciar ayuno ${targetHours}h`}
      </button>

      {/* Info */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { h: "0-4h", label: "Digestión" },
          { h: "4-12h", label: "Glucógeno" },
          { h: "12h+", label: "Cetosis" },
        ].map(item => (
          <div key={item.h} className="bg-[#141414] rounded-xl p-3 border border-[#2a2a2a] text-center">
            <p className="text-xs text-green-400 font-medium">{item.h}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
