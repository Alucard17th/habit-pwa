import React, { createContext, useContext, useState, useCallback } from "react";
import PaywallDialog from "./Paywall";

type Ctx = {
  openPaywall: (reason?: string) => void;
  closePaywall: () => void;
};

const PaywallCtx = createContext<Ctx>({ openPaywall: () => {}, closePaywall: () => {} });

export function usePaywall() {
  return useContext(PaywallCtx);
}

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>(undefined);

  const openPaywall = useCallback((r?: string) => { setReason(r); setOpen(true); }, []);
  const closePaywall = useCallback(() => setOpen(false), []);

  return (
    <PaywallCtx.Provider value={{ openPaywall, closePaywall }}>
      {children}
      <PaywallDialog open={open} reason={reason} onClose={closePaywall} />
    </PaywallCtx.Provider>
  );
}
