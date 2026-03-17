export function getFastingProgress(startedAt: string, targetHours: number): {
  elapsed: number;
  remaining: number;
  percentage: number;
  label: string;
} {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const elapsed = (now - start) / 1000 / 3600;
  const remaining = Math.max(0, targetHours - elapsed);
  const percentage = Math.min(100, (elapsed / targetHours) * 100);

  let label = "";
  if (elapsed < 4) label = "Fase digestiva";
  else if (elapsed < 12) label = "Glucógeno agotándose";
  else if (elapsed < 16) label = "Cetosis iniciando";
  else label = "✓ Objetivo alcanzado";

  return { elapsed, remaining, percentage, label };
}

export function formatFastingTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
