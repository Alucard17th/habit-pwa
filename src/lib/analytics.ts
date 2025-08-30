import { format, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { listHabits, listLogs } from "./api";

export type HabitLite = {
  id: number;
  name: string;
  target_per_day: number;
  streak_longest: number;
  streak_current: number;
  is_archived: boolean;
};

export function ymd(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export async function fetchHabitLogsInRange(habitId: number, start: Date, end: Date) {
  const logs = await listLogs(habitId, ymd(start), ymd(end));
  const byDate: Record<string, number> = {};
  logs.forEach((l: any) => {
    byDate[ymd(new Date(l.log_date))] = l.count ?? 0;
  });
  return byDate;
}

export function buildDaySeries(start: Date, end: Date) {
  return eachDayOfInterval({ start, end }).map(d => ({ date: new Date(d), key: ymd(d) }));
}

export function completedForDay(count: number, target: number) {
  const t = Math.max(1, target || 1);
  return (count || 0) >= t;
}

export function streakSeries(byDate: Record<string, number>, target: number, start: Date, end: Date) {
  const days = buildDaySeries(start, end);
  let running = 0;
  return days.map(({ date, key }) => {
    if (completedForDay(byDate[key] || 0, target)) running += 1;
    else running = 0;
    return { date, day: format(date, "EEE d"), value: running };
  });
}

export function completionRate(byDate: Record<string, number>, target: number, start: Date, end: Date) {
  const days = buildDaySeries(start, end);
  const done = days.filter(({ key }) => completedForDay(byDate[key] || 0, target)).length;
  return { done, total: days.length, pct: days.length ? Math.round((done / days.length) * 100) : 0 };
}

export async function computeHighlights(start: Date, end: Date) {
  const habits: HabitLite[] = await listHabits();
  const active = habits.filter(h => !h.is_archived);

  // Parallel fetch logs for each habit, compute completion rate and best streak within the range
  const results = await Promise.all(active.map(async (h) => {
    const byDate = await fetchHabitLogsInRange(h.id, start, end);
    // compute streak within the window
    const sSeries = streakSeries(byDate, h.target_per_day, start, end);
    const bestInWindow = sSeries.reduce((m, x) => Math.max(m, x.value), 0);
    const { pct } = completionRate(byDate, h.target_per_day, start, end);
    return {
      id: h.id,
      name: h.name,
      target: h.target_per_day,
      completionPct: pct,
      bestStreakWindow: bestInWindow,
      longestAllTime: h.streak_longest,
      currentStreak: h.streak_current,
    };
  }));

  // Best/weakest by completion % (ties broken by longest streak)
  const sorted = results.slice().sort((a,b) => b.completionPct - a.completionPct || b.bestStreakWindow - a.bestStreakWindow);
  const best = sorted[0] || null;
  const weakest = sorted[sorted.length - 1] || null;

  return { best, weakest, all: results };
}

export function getRange(kind: "week" | "month", base = new Date()) {
  if (kind === "week") {
    const start = startOfWeek(base, { weekStartsOn: 1 });
    const end = endOfWeek(base, { weekStartsOn: 1 });
    return { start, end, label: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}` };
  }
  const start = startOfMonth(base);
  const end = endOfMonth(base);
  return { start, end, label: format(start, "MMMM yyyy") };
}
