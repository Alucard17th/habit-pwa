import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Mode = "light" | "dark";

type Ctx = {
  mode: Mode;
  toggleMode: () => void;
  setMode: (m: Mode) => void;
};
const ThemeModeCtx = createContext<Ctx | null>(null);
export const useThemeMode = () => {
  const ctx = useContext(ThemeModeCtx);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
};

function getInitialMode(): Mode {
  const saved = localStorage.getItem("themeMode") as Mode | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>(getInitialMode);

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
    // keep <html data-theme="..."> for CSS-only tweaks if needed
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((m) => (m === "light" ? "dark" : "light")),
    }),
    [mode]
  );

  return <ThemeModeCtx.Provider value={value}>{children}</ThemeModeCtx.Provider>;
};
