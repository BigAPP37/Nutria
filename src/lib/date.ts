// src/lib/date.ts
// Helpers de fecha basados en la zona local del navegador.

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getTodayDateKey(): string {
  return formatLocalDateKey(new Date())
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0)
}

export function shiftDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return formatLocalDateKey(date)
}
