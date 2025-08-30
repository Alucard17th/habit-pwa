import { useAuth } from "../context/AuthContext";

export function useProGate() {
  const { user } = useAuth();
  const isPro = !!user?.is_premium;

  function guard(canUse: boolean, onBlocked: () => void): boolean {
    if (isPro) return true;
    if (!canUse) { onBlocked?.(); return false; }
    return true;
  }

  return { isPro, guard };
}
