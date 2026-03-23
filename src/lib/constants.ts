// src/lib/constants.ts

export const queryKeys = {
  dailyLog: (date: string) => ["daily-log", date] as const,
  dailySummary: (date: string) => ["daily-summary", date] as const,
  foodSearch: (query: string) => ["food-search", query] as const,
  tdeeState: () => ["tdee-state"] as const,
  weeklySnapshots: () => ["weekly-snapshots"] as const,
  weightHistory: () => ["weight-history"] as const,
  waterLog: (date: string) => ["water-log", date] as const,
  profile: () => ["user-profile"] as const,
  psychFlags: () => ["psych-flags"] as const,
} as const;

export const colors = {
  primary: { 50:"#FFF7ED",100:"#FFEDD5",200:"#FED7AA",300:"#FDBA74",400:"#FB923C",500:"#F97316",600:"#EA580C",700:"#C2410C",800:"#9A3412",900:"#7C2D12" },
  secondary: { 50:"#ECFDF5",100:"#D1FAE5",200:"#A7F3D0",300:"#6EE7B7",400:"#34D399",500:"#10B981",600:"#059669" },
  warm: { 50:"#FFFBEB",100:"#FEF3C7",200:"#FDE68A",300:"#FCD34D",400:"#FBBF24",500:"#F59E0B" },
  neutral: { 50:"#FAFAF9",100:"#F5F5F4",200:"#E7E5E4",300:"#D6D3D1",400:"#A8A29E",500:"#78716C",600:"#57534E",700:"#44403C",800:"#292524",900:"#1C1917" },
} as const;

export const TIMEOUTS = {
  AI_LOG: 25_000,
  PHOTO_UPLOAD: 15_000,
  SEARCH_DEBOUNCE: 300,
} as const;
