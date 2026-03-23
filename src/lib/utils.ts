// src/lib/utils.ts
// Utilidades de formateo para Nutria.

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return \`\${d.getDate()} \${months[d.getMonth()]} \${d.getFullYear()}\`;
}

export function formatWeight(kg: number, unit: "kg" | "lb"): string {
  const val = unit === "lb" ? kg * 2.20462 : kg;
  return val.toFixed(1);
}

export function round(n: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
