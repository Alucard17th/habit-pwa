import React from "react";
import { Fab, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"; // or AutoFixHigh
import AtomicHabitDialog from "./AtomicHabitDialog";
import { useLocation } from "react-router-dom";

export default function GlobalAtomicHabitLauncher() {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { pathname } = useLocation();

  // Hide on auth screen(s); tweak as you wish
  const hidden = pathname.startsWith("/login");

  if (hidden) return null;

  return (
    <>
      <Tooltip title="Make this habit atomic" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          // Responsive, safe-area aware, always-on-top
          sx={{
            position: "fixed",
            zIndex: (t) => t.zIndex.drawer + 2,
            right: {
              xs: `calc(env(safe-area-inset-right, 0px) + ${theme.spacing(2)})`,
              sm: `calc(env(safe-area-inset-right, 0px) + ${theme.spacing(3)})`,
              md: `calc(env(safe-area-inset-right, 0px) + ${theme.spacing(4)})`,
            },
            bottom: {
              xs: `calc(env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
              sm: `calc(env(safe-area-inset-bottom, 0px) + ${theme.spacing(3)})`,
              md: `calc(env(safe-area-inset-bottom, 0px) + ${theme.spacing(4)})`,
            },
            boxShadow: 4,
          }}
          size={isMdUp ? "large" : "medium"}
          aria-label="Atomic habit"
        >
          <AutoAwesomeIcon />
        </Fab>
      </Tooltip>

      {/* Reuse your existing dialog */}
      <AtomicHabitDialog
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        triggerLabel="Make this habit atomic"
      />
      {/* We need to control the dialog open/close: small tweak below */}
    </>
  );
}
