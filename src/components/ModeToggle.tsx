import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useThemeMode } from "../context/ThemeModeContext";

export default function ModeToggle() {
  const { mode, toggleMode } = useThemeMode();

  const next = mode === "light" ? "dark" : "light";
  const aria = `Switch to ${next} mode`;

  return (
    <Tooltip title={aria}>
      <IconButton
        onClick={toggleMode}
        size="small"
        color="inherit"
        aria-label={aria}
        sx={{
          borderRadius: 2,
          ml: 0.5,
          // subtle hover bg using current color
          "&:hover": (t) => ({ backgroundColor: t.palette.action.hover }),
        }}
      >
        {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
