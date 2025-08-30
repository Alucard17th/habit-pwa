// src/components/AtomicHabitDialog.tsx
import React, { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Typography, Chip } from "@mui/material";
import { useAtomicHabit } from "../hooks/useAtomicHabit";

type Plan = { starter_goal: string; cue: string; duration_min: number; location: string; metric: string };

export default function AtomicHabitDialog({
  triggerLabel = "Make this habit atomic",
  open: controlledOpen,
  onOpen,
  onClose,
}: {
  triggerLabel?: string;
  open?: boolean;            // optional controlled open
  onOpen?: () => void;       // optional
  onClose?: () => void;      // optional
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const [text, setText] = useState("");
  const [result, setResult] = useState<Plan | null>(null);
  const { generate, loading } = useAtomicHabit();

  const handleOpen = () => { onOpen?.(); if (controlledOpen === undefined) setUncontrolledOpen(true); };
  const handleClose = () => { onClose?.(); if (controlledOpen === undefined) setUncontrolledOpen(false); setResult(null); setText(""); };

  const onSubmit = async () => {
    if (!text.trim()) return;
    const out = await generate(text.trim());
    setResult(out);
  };

  return (
    <>
      {controlledOpen === undefined && (
        <Button variant="outlined" size="small" onClick={handleOpen}>{triggerLabel}</Button>
      )}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Turn your goal into a tiny daily habit</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Your goal (e.g., Read more books)"
              value={text}
              onChange={(e)=>setText(e.target.value)}
              disabled={loading}
              fullWidth
            />
            {result && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Suggested plan</Typography>
                <Chip label={`Starter goal: ${result.starter_goal}`} />
                <Chip label={`Cue: ${result.cue}`} />
                <Chip label={`Duration: ${result.duration_min} min`} />
                <Chip label={`Location: ${result.location}`} />
                <Chip label={`Metric: ${result.metric}`} />
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button onClick={onSubmit} disabled={loading || !text.trim()} variant="contained">
            {loading ? "Generating..." : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
