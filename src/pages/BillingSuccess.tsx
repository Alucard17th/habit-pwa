import * as React from "react";
import { Stack, Typography, CircularProgress, Button } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function BillingSuccess() {
  const { refreshUser } = useAuth();
  const nav = useNavigate();
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      await refreshUser();            // pulls /me; webhook sets is_premium=true
      setDone(true);
    })();
  }, [refreshUser]);

  return (
    <Stack minHeight="60vh" alignItems="center" justifyContent="center" spacing={2}>
      {!done ? (
        <>
          <CircularProgress />
          <Typography color="text.secondary">Finalizing your purchase…</Typography>
        </>
      ) : (
        <>
          <Typography variant="h5">You’re Pro now 🎉</Typography>
          <Button variant="contained" onClick={() => nav("/")}>Go to Today</Button>
        </>
      )}
    </Stack>
  );
}
