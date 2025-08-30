import { useState } from "react";
import { atomicHabit } from "../lib/api";

export function useAtomicHabit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const generate = async (text: string) => {
    setLoading(true); setError(null);
    try {
      const res = await atomicHabit(text);
      return res.data; // { starter_goal, cue, duration_min, location, metric }
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
