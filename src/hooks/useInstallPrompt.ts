import { useEffect, useState } from "react";

// Temporary type until TS adds it
declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    prompt(): Promise<void>;
  }
}


export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // prevent mini-infobar
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as any);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as any);
  }, []);

  const canInstall = !!deferred;
  const promptInstall = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  };

  return { canInstall, promptInstall };
}
