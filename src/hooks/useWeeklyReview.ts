import { useEffect, useState } from "react";
import { getWeeklyReview, WeeklyReview } from "../lib/api";

export function useWeeklyReview() {
  const [data, setData] = useState<WeeklyReview | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refetch = async (refresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWeeklyReview(refresh);
      setData(res.data);
      setCached(res.cached);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { data, cached, loading, error, refetch };
}
