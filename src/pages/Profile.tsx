import * as React from "react";
import {
  Stack, Typography, TextField, Button, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar
} from "@mui/material";
import { usePasswordChange, useProfile } from "../hooks/useProfile";

export default function Profile() {
  const {
    values, onChange, canSubmit, save, saving, error, fieldErrors
  } = useProfile();

  const [snack, setSnack] = React.useState<string | null>(null);
  const [pwdOpen, setPwdOpen] = React.useState(false);

  const onSave = async () => {
    const res = await save();
    if (res.ok) setSnack("Profile updated");
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Profile</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2} maxWidth={480}>
        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name?.[0]}
        />
        <TextField
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email?.[0]}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={!canSubmit || saving} onClick={onSave}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button variant="outlined" onClick={() => setPwdOpen(true)}>
            Change password
          </Button>
        </Stack>
      </Stack>

      <PasswordDialog open={pwdOpen} onClose={() => setPwdOpen(false)} onDone={() => setSnack("Password updated")} />

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
      />
    </Stack>
  );
}

function PasswordDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void; }) {
  const { values, onChange, canSubmit, save, saving, error, fieldErrors, reset, minLen } = usePasswordChange();

  const handleSave = async () => {
    const res = await save();
    if (res.ok) {
      onDone();
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change password</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Current password"
            type="password"
            value={values.current_password}
            onChange={(e) => onChange("current_password", e.target.value)}
            error={!!fieldErrors.current_password}
            helperText={fieldErrors.current_password?.[0]}
            autoComplete="current-password"
          />
          <TextField
            label="New password"
            type="password"
            value={values.password}
            onChange={(e) => onChange("password", e.target.value)}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password?.[0] ?? `At least ${minLen} characters.`}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={values.password_confirmation}
            onChange={(e) => onChange("password_confirmation", e.target.value)}
            error={!!fieldErrors.password_confirmation}
            helperText={fieldErrors.password_confirmation?.[0]}
            autoComplete="new-password"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSubmit || saving}>
          {saving ? "Saving..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
