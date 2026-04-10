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
  primary: { 50:"#FFF7F1",100:"#FFE8D5",200:"#FFD2AD",300:"#FFB170",400:"#FA8B3D",500:"#F26A21",600:"#D95314",700:"#B74412",800:"#923614",900:"#742D14" },
  secondary: { 50:"#EAFBF5",100:"#D2F5E8",200:"#ADEBD7",300:"#7EDCBF",400:"#4BC89E",500:"#20AC7F",600:"#168A65" },
  warm: { 50:"#FFF8E8",100:"#FEEDC2",200:"#F9DA88",300:"#F1C04B",400:"#E4A823",500:"#C98A13" },
  neutral: { 50:"#F6F4EF",100:"#EFEBE2",200:"#E0D9CB",300:"#C9BFAE",400:"#9F9586",500:"#746B5F",600:"#5A5248",700:"#463F37",800:"#2C2824",900:"#181613" },
  accent: { 50:"#EEF7FF",100:"#D9EBFF",200:"#B9D9FF",300:"#88BEFF",400:"#4F98FF",500:"#2D77F1",600:"#205DC2" },
} as const;

export const TIMEOUTS = {
  AI_LOG: 25_000,
  PHOTO_UPLOAD: 15_000,
  SEARCH_DEBOUNCE: 300,
} as const;
