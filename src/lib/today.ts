export function todayYmd(tz?: string): string {
  // Keep it simple: use local date. If you have user TZ, pass from context.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
