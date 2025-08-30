// src/theme.ts
import { createTheme, alpha, darken, lighten } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";
import type { CSSProperties } from "react";

// ---- Module augmentation (kept in this file so TS picks it up) ----
declare module "@mui/material/styles" {
  // neutral = same shape as MUI grey scale
  interface Palette {
    neutral: Palette["grey"];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions["grey"];
  }

  // custom typography variant
  interface TypographyVariants {
    subtitle3: CSSProperties;
  }
  interface TypographyVariantsOptions {
    subtitle3?: CSSProperties;
  }
}
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    subtitle3: true;
  }
}

// ---- Base typography & design tokens ----
const baseFont = [
  "Inter",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "Noto Sans",
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji",
  "sans-serif",
].join(",");

const common = {
  shape: { borderRadius: 12 },
  spacing: 8,
  typography: {
    fontFamily: baseFont,
    h1: { fontWeight: 700, fontSize: "3rem", lineHeight: 1.15, letterSpacing: -0.5 },
    h2: { fontWeight: 700, fontSize: "2.25rem", lineHeight: 1.2, letterSpacing: -0.2 },
    h3: { fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.25 },
    h4: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.3 },
    h5: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.35 },
    h6: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, opacity: 0.9 },
    // custom small subtitle for meta/labels
    subtitle3: {
      fontSize: ".825rem",
      fontWeight: 600,
      textTransform: "uppercase" as const, // 👈 literal so TS matches TextTransform
      letterSpacing: 0.6,
    },
    body1: { fontSize: "1rem", lineHeight: 1.65 },
    body2: { fontSize: ".925rem", lineHeight: 1.6 },
    button: { textTransform: "none" as const, fontWeight: 600, letterSpacing: 0.2 },
    overline: { textTransform: "uppercase" as const, letterSpacing: 1, fontWeight: 700 },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  zIndex: {
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
  transitions: {
    duration: { shortest: 120, shorter: 180, short: 220, standard: 260 },
    easing: { easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)" },
  },
} as const;

// ---- Palettes ----
const lightPalette = {
  mode: "light" as PaletteMode,
  primary: { main: "#2563eb", light: "#4f83ff", dark: "#1e3fae", contrastText: "#fff" },
  secondary: { main: "#7c3aed", light: "#a78bfa", dark: "#5b21b6", contrastText: "#fff" },
  success: { main: "#16a34a", light: "#22c55e", dark: "#15803d", contrastText: "#fff" },
  warning: { main: "#f59e0b", light: "#fbbf24", dark: "#b45309", contrastText: "#111" },
  error: { main: "#ef4444", light: "#f87171", dark: "#b91c1c", contrastText: "#fff" },
  info: { main: "#06b6d4", light: "#67e8f9", dark: "#0e7490", contrastText: "#062" },
  grey: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1f2937",
    900: "#0f172a",
  },
  background: {
    default: "#f7f7fb",
    paper: "#ffffff",
  },
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    disabled: alpha("#0f172a", 0.4),
  },
  neutral: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
  },
};

const darkPalette = {
  mode: "dark" as PaletteMode,
  primary: { main: "#60a5fa", light: "#93c5fd", dark: "#1d4ed8", contrastText: "#0b1020" },
  secondary: { main: "#a78bfa", light: "#c4b5fd", dark: "#6d28d9", contrastText: "#0b1020" },
  success: { main: "#22c55e", light: "#4ade80", dark: "#16a34a", contrastText: "#0b1020" },
  warning: { main: "#fbbf24", light: "#fcd34d", dark: "#d97706", contrastText: "#0b1020" },
  error: { main: "#f87171", light: "#fca5a5", dark: "#ef4444", contrastText: "#0b1020" },
  info: { main: "#67e8f9", light: "#a5f3fc", dark: "#06b6d4", contrastText: "#0b1020" },
  grey: lightPalette.grey,
  background: {
    default: "#0b1020",
    paper: "#0f152a",
  },
  text: {
    primary: "#e5e7eb",
    secondary: "#a1a1aa",
    disabled: alpha("#e5e7eb", 0.4),
  },
  neutral: lightPalette.neutral,
};

// ---- Theme factory ----
export const createAppTheme = ({ mode = "light" as PaletteMode } = {}) => {
  const palette = mode === "light" ? lightPalette : darkPalette;

  return createTheme({
    ...common,
    palette,
    typography: {
      ...common.typography,
      // responsive tweak
      h1: {
        ...common.typography.h1,
        fontSize: mode === "light" ? "2.75rem" : "2.65rem",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "*, *::before, *::after": { boxSizing: "border-box" },
          html: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            scrollBehavior: "smooth",
          },
          "::selection": {
            background: alpha(palette.primary.main, 0.18),
          },
          "*::-webkit-scrollbar": { width: 10, height: 10 },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(palette.text.primary, 0.2),
            borderRadius: 8,
            border: `2px solid ${palette.background.default}`,
          },
          "*::-webkit-scrollbar-thumb:hover": {
            backgroundColor: alpha(palette.text.primary, 0.35),
          },
          a: { color: palette.primary.main, textDecoration: "none" },
          "a:hover": { textDecoration: "underline" },
          ":focus-visible": {
            outline: `2px solid ${alpha(palette.primary.main, 0.6)}`,
            outlineOffset: 2,
          },
        },
      },

      MuiButton: {
        defaultProps: { disableRipple: false },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 12,
            paddingInline: 16,
          },
          contained: {
            boxShadow: "none",
            ":hover": { boxShadow: "none" },
          },
          outlined: {
            borderColor: alpha(palette.primary.main, 0.4),
            ":hover": { borderColor: palette.primary.main, backgroundColor: alpha(palette.primary.main, 0.06) },
          },
          sizeSmall: { paddingInline: 12, height: 34 },
          sizeMedium: { height: 40 },
          sizeLarge: { height: 48, borderRadius: 14 },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            "&:hover": { backgroundColor: alpha(palette.primary.main, 0.08) },
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            background: mode === "light" ? "rgba(255,255,255,.8)" : alpha(palette.background.paper, 0.8),
            backdropFilter: "saturate(180%) blur(8px)",
            boxShadow: `0 1px 0 ${alpha(palette.text.primary, 0.06)}`,
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 16, backgroundImage: "none" },
          elevation1: {
            boxShadow: mode === "light"
              ? "0 4px 16px rgba(17, 24, 39, 0.08)"
              : "0 8px 20px rgba(0,0,0,.35)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${alpha(palette.text.primary, 0.06)}`,
          },
        },
      },

      MuiTextField: {
        defaultProps: { size: "small", variant: "outlined" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: mode === "light" ? "#fff" : alpha("#fff", 0.02),
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(palette.text.primary, 0.15),
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(palette.primary.main, 0.5),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
              borderWidth: 1.5,
            },
          },
          input: { paddingTop: 12, paddingBottom: 12 },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontWeight: 600, opacity: 0.9 } },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 600 },
          filled: { backgroundColor: alpha(palette.primary.main, 0.1) },
        },
      },

      MuiTabs: {
        styleOverrides: {
          indicator: { height: 3, borderRadius: 3, backgroundColor: palette.primary.main },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            minHeight: 44,
            "&.Mui-selected": { color: palette.primary.main },
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${alpha(palette.text.primary, 0.08)}`,
            boxShadow: mode === "light"
              ? "0 12px 32px rgba(17,24,39,.12)"
              : "0 12px 32px rgba(0,0,0,.5)",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            "&.Mui-selected": {
              backgroundColor: alpha(palette.primary.main, 0.12),
              "&:hover": { backgroundColor: alpha(palette.primary.main, 0.18) },
            },
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${alpha(palette.text.primary, 0.06)}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            borderRight: `1px solid ${alpha(palette.text.primary, 0.06)}`,
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-head": {
              fontWeight: 700,
              letterSpacing: 0.3,
              backgroundColor:
                mode === "light"
                  ? lighten(palette.background.default, 0.02)
                  : darken(palette.background.paper, 0.04),
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${alpha(palette.text.primary, 0.06)}` },
        },
      },

      MuiTooltip: {
        styleOverrides: { tooltip: { borderRadius: 10, fontWeight: 600 } },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12, fontWeight: 600 },
          standardInfo: { backgroundColor: alpha(palette.info.main, 0.08) },
        },
      },

      MuiAvatar: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 700, border: `2px solid ${palette.background.paper}` },
        },
      },
    },
  });
};
