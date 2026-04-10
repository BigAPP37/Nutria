import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import { formatLocalDateKey, getTodayDateKey, parseDateKey } from "@/lib/date";

interface StreakData {
  streak: number;
  totalComplete: number;
}

function getYesterdayDateKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatLocalDateKey(date);
}

async function fetchStreakDays(userId: string): Promise<StreakData> {
  const { data, error } = await supabase
    .from("daily_log_status")
    .select("log_date, is_day_complete")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(60);

  if (error) throw error;
  if (!data || data.length === 0) return { streak: 0, totalComplete: 0 };

  const completionMap = new Map<string, boolean>();
  data.forEach((row) => completionMap.set(row.log_date, row.is_day_complete));

  const totalComplete = data.filter((row) => row.is_day_complete).length;
  const today = getTodayDateKey();
  const yesterday = getYesterdayDateKey();

  let currentDate: Date;
  if (completionMap.get(today)) {
    currentDate = parseDateKey(today);
  } else if (completionMap.get(yesterday)) {
    currentDate = parseDateKey(yesterday);
  } else {
    return { streak: 0, totalComplete };
  }

  let streak = 0;
  while (true) {
    const key = formatLocalDateKey(currentDate);
    if (completionMap.get(key) === true) {
      streak += 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak, totalComplete };
}

export function useStreakDays() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.streakDays(),
    queryFn: () => fetchStreakDays(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
