import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  startPaddleSubscriptionCheckout,
  startPaddleProductCheckout,
} from "../lib/api";
import { openCheckout } from "../billing/openCheckout";

type Props = { open: boolean; onClose: () => void; reason?: string };

const PLANS = [
  { id: "price_basic_monthly", label: "Monthly", note: "Cancel anytime" },
  { id: "price_basic_yearly", label: "Yearly", note: "2 months free" },
];

export default function PaywallDialog({ open, onClose, reason }: Props) {
  const [plan, setPlan] = React.useState<string>(PLANS[0].id);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  const onSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const options = await startPaddleSubscriptionCheckout(plan);
      await openCheckout(options);
      // Webhook will flip is_premium; your success route can refresh user.
    } catch (e: any) {
      setError(e?.message || "Failed to start checkout.");
    } finally {
      setLoading(false);
    }
  };

  const onBuyLifetime = async () => {
    setLoading(true);
    setError(null);
    try {
      const options = await startPaddleProductCheckout();

      // Force overlay regardless of what backend sends
      options.settings = {
        ...(options.settings || {}),
        displayMode: "overlay",
      };

      // Close the dialog BEFORE opening the overlay so it isn't under the backdrop
      onClose();

      await openCheckout(options);
    } catch (e: any) {
      setError(e?.message || "Failed to start checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Go Pro</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {reason && <Alert severity="info">{reason}</Alert>}

          <Stack spacing={0.5}>
            <Typography fontWeight={700}>Choose your plan</Typography>
            <ToggleButtonGroup
              exclusive
              value={plan}
              onChange={(_, v) => v && setPlan(v)}
              size="small"
            >
              {PLANS.map((p) => (
                <ToggleButton key={p.id} value={p.id}>
                  <Stack>
                    <Typography fontWeight={700}>{p.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.note}
                    </Typography>
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Not now
        </Button>
        {/* <Button onClick={onSubscribe} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Continue"}
        </Button> */}
        {/* Optional lifetime purchase: */}
        <Button onClick={onBuyLifetime} disabled={loading}>
          Buy lifetime
        </Button>
      </DialogActions>
    </Dialog>
  );
}
