import React, { useState } from "react";
import { createHabit } from "../lib/api";
import { useNavigate } from "react-router-dom";
import {
  Paper, Stack, Typography, TextField, MenuItem, Button
} from "@mui/material";

export default function HabitForm(){
  const nav = useNavigate();
  const [name,setName] = useState("");
  const [frequency,setFrequency] = useState<"daily"|"weekly">("daily");
  const [target,setTarget] = useState(1);
  const [loading,setLoading] = useState(false);

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createHabit({ name, frequency, target_per_day: target });
      nav("/");
    } finally { setLoading(false); }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 520 }}>
      <Typography variant="h6" gutterBottom>New Habit</Typography>
      <Stack component="form" spacing={2} onSubmit={onSubmit}>
        <TextField label="Name" value={name} onChange={e=>setName(e.target.value)} required />
        <TextField select label="Frequency" value={frequency} onChange={e=>setFrequency(e.target.value as any)}>
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
        </TextField>
        <TextField
          label="Target per day"
          type="number"
          inputProps={{ min: 1 }}
          value={target}
          onChange={e=>setTarget(parseInt(e.target.value || "1"))}
        />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="text" onClick={() => nav(-1)}>Cancel</Button>
          <Button variant="contained" type="submit" disabled={loading}>Create</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}