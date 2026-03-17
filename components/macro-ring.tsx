"use client";
import { getProgressColor } from "@/lib/utils/macros";
import { DayTotals } from "@/types";

interface Props {
  totals: DayTotals;
  targets: { calories: number; protein: number; carbs: number; fat: number };
}

function MiniBar({ value, target, color, label }: { value: number; target: number; color: string; label: string }) {
  const pct = Math.min(1, value / (target || 1));
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs text-gray-400">{Math.round(value)}g</span>
      </div>
      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function MacroRing({ totals, targets }: Props) {
  const pct = totals.calories / (targets.calories || 1);
  const size = 120;
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference - Math.min(1, pct) * circumference;

  return (
    <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] mb-4">
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2a2a2a" strokeWidth="10" />
            <circle
              cx={size/2} cy={size/2} r={r}
              fill="none"
              stroke={getProgressColor(pct)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
            <text x={size/2} y={size/2 - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="-apple-system">
              {Math.round(pct * 100)}%
            </text>
            <text x={size/2} y={size/2 + 14} textAnchor="middle" fill="#888" fontSize="10" fontFamily="-apple-system">
              de {targets.calories}
            </text>
          </svg>
        </div>

        {/* Macro bars */}
        <div className="flex-1 space-y-3">
          <MiniBar value={totals.protein_g} target={targets.protein} color="#3b82f6" label="Proteína" />
          <MiniBar value={totals.carbs_g} target={targets.carbs} color="#f59e0b" label="Carbos" />
          <MiniBar value={totals.fat_g} target={targets.fat} color="#22c55e" label="Grasa" />
        </div>
      </div>
    </div>
  );
}
