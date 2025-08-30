import React, { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Typography, Chip } from "@mui/material";
import { useAtomicHabit } from "../hooks/useAtomicHabit";

export default function AtomicHabitDialog({ triggerLabel = "Make this habit atomic" }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<null | { starter_goal: string; cue: string; duration_min: number; location: string; metric: string }>(null);
  const { generate, loading } = useAtomicHabit();

  const onSubmit = async () => {
    if (!text.trim()) return;
    const out = await generate(text.trim());
    setResult(out);
  };

  return (
    <>
      <Button variant="outlined" size="small" onClick={()=>setOpen(true)}>{triggerLabel}</Button>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
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
          <Button onClick={()=>setOpen(false)}>Close</Button>
          <Button onClick={onSubmit} disabled={loading || !text.trim()} variant="contained">
            {loading ? "Generating..." : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}