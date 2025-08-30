import "@mui/material/styles";
import "@mui/material/Typography";

// ---- Extend the theme typings ----
declare module "@mui/material/styles" {
  interface Palette {
    neutral: Palette["grey"];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions["grey"];
  }

  // Add custom typography variant
  interface TypographyVariants {
    subtitle3: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    subtitle3?: React.CSSProperties;
  }
}

// Allow using the new variant on <Typography variant="subtitle3" />
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    subtitle3: true;
  }
}
