import { ReactNode, useEffect, useState } from "react";
import { CircularProgress, Box } from "@mui/material";
import { listHabits } from "../lib/api";
import { useProGate } from "../hooks/useProGate";
import { usePaywall } from "../paywall/usePaywall";

/**
 * Wrap a route (like /new) to enforce the free limit of 3 habits.
 * If user is Pro → always allow.
 * If user is Free → fetch habits and block if >=3.
 */
export function RequireHabitLimit({ children }: { children: ReactNode }) {
  const { guard, isPro } = useProGate();
  const { openPaywall } = usePaywall();

  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const habits = await listHabits();
        if (cancelled) return;
        const allowed = habits.length < 3;
        setCanCreate(allowed);
      } catch (e) {
        console.error("[RequireHabitLimit] failed to fetch habits", e);
        setCanCreate(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!isPro) check();
    else {
      setCanCreate(true);
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [isPro]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!guard(canCreate, () => openPaywall("Unlimited habits"))) {
    return null;
  }

  return <>{children}</>;
}