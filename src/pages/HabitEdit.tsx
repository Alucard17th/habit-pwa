// src/pages/HabitEdit.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Button, Container, Paper, Stack, TextField, Typography,
  MenuItem, IconButton, Tooltip, InputAdornment, Snackbar, Alert
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { getHabit, updateHabit, type HabitPayload } from "../lib/api";

type Habit = {
  id: number;
  name: string;
  frequency: "daily" | "weekly";
  target_per_day: number;
  reminder_time: string | null; // "HH:MM:SS" from backend or null
};

function normalizeTimeForInput(t?: string | null) {
  if (!t) return "";
  // accept "HH:MM:SS" or "HH:MM" -> return "HH:MM"
  const [hh, mm] = t.split(":");
  return `${hh?.padStart(2, "0") || "00"}:${mm?.padStart(2, "0") || "00"}`;
}

export default function HabitEdit() {
  const { id } = useParams<{ id: string }>();
  const habitId = Number(id);
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [form, setForm] = useState<HabitPayload>({
    name: "",
    frequency: "daily",
    target_per_day: 1,
    reminder_time: null,
  });

  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      try {
        const h: Habit = await getHabit(habitId);
        setForm({
          name: h.name,
          frequency: h.frequency,
          target_per_day: h.target_per_day,
          reminder_time: normalizeTimeForInput(h.reminder_time),
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load habit.");
      } finally {
        setLoading(false);
      }
    })();
  }, [habitId]);

  const onChange = <K extends keyof HabitPayload>(key: K, value: HabitPayload[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Send "HH:MM" or null (not empty string)
      const payload: HabitPayload = {
        ...form,
        reminder_time: form.reminder_time ? form.reminder_time : null,
        target_per_day: Math.max(1, Math.floor(Number(form.target_per_day) || 1)),
      };
      await updateHabit(habitId, payload);
      setOk(true);
      // small delay so user sees toast, then go back
      setTimeout(() => nav(-1), 600);
    } catch (e: any) {
      setError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Typography>Loading…</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Back">
          <span>
            <IconButton onClick={() => nav(-1)}>
              <ArrowBackIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="h5">Edit habit</Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Save">
          <span>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={saving}
            >
              Save
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            fullWidth
            autoFocus
          />

          <TextField
            label="Frequency"
            select
            value={form.frequency}
            onChange={(e) => onChange("frequency", e.target.value as "daily" | "weekly")}
            fullWidth
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
          </TextField>

          <TextField
            label="Target per day"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            value={form.target_per_day}
            onChange={(e) => onChange("target_per_day", Number(e.target.value))}
            fullWidth
            helperText={
              form.frequency === "daily"
                ? "How many times per day to consider it complete."
                : "Per-day target still applies (streak logic for weekly can be added later)."
            }
          />

          <TextField
            label="Reminder time"
            type="time"
            value={form.reminder_time || ""}
            onChange={(e) => onChange("reminder_time", e.target.value || null)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccessTimeIcon />
                </InputAdornment>
              ),
            }}
            helperText="Optional. Local device reminders can use this later."
          />
        </Stack>
      </Paper>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={ok} autoHideDuration={2000} onClose={() => setOk(false)}>
        <Alert severity="success" onClose={() => setOk(false)}>Habit updated</Alert>
      </Snackbar>
    </Container>
  );
}
