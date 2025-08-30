import { useEffect, useMemo, useRef, useState } from "react";
import {
  CoachSuggestion,
  getCoachSuggestions,
  acceptCoachSuggestion,
  dismissCoachSuggestion,
} from "../lib/api";

export function useCoachSuggestions() {
  const [data, setData] = useState<CoachSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const items = await getCoachSuggestions();
      const arr = Array.isArray(items) ? items : Array.isArray((items as any)?.data) ? (items as any).data : [];
      setData(arr);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, []);

  const accept = async (id: number) => {
    // optimistic remove
    const prev = data;
    setData((s) => s.filter((x) => x.id !== id));
    try {
      await acceptCoachSuggestion(id);
    } catch (e) {
      // rollback on failure
      setData(prev);
      throw e;
    }
  };

  const dismiss = async (id: number) => {
    const prev = data;
    setData((s) => s.filter((x) => x.id !== id));
    try {
      await dismissCoachSuggestion(id);
    } catch (e) {
      setData(prev);
      throw e;
    }
  };

  const grouped = useMemo(() => {
    const byType: Record<string, CoachSuggestion[]> = { encourage: [], adjust: [], congratulate: [] };
    for (const s of data) byType[s.type]?.push(s);
    return byType;
  }, [data]);

  return { data, grouped, loading, error, refetch, accept, dismiss };
}
