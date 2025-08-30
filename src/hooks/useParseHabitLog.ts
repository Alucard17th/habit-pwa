import { useState } from "react";
import { parseHabitLog } from "../lib/api";

export function useParseHabitLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const parse = async (message: string) => {
    setLoading(true); setError(null);
    try {
      const res = await parseHabitLog(message);
      return res.data; // { habit_id, fallback_name, count, when }
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { parse, loading, error };
}
