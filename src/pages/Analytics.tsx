import { useEffect, useMemo, useState, useCallback } from "react";
import { listHabits, listLogs } from "../lib/api";
import {
  Paper, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
  Button, ButtonGroup, Box, Chip, Skeleton, Alert
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import {
  format, startOfWeek, endOfWeek, addDays, eachDayOfInterval
} from "date-fns";
import { useProGate } from "../hooks/useProGate";
import { usePaywall } from "../paywall/usePaywall";
import { useNavigate } from "react-router-dom";

type Habit = {
  id: number;
  name: string;
  target_per_day: number;
  is_archived: boolean;
};

type DayPoint = { day: string; dateKey: string; count: number; completed: boolean };

function ymd(d: Date) { return format(d, "yyyy-MM-dd"); }

function getWeekFromOffset(offset: number, base = new Date()) {
  const weekStart = startOfWeek(base, { weekStartsOn: 1 }); // Monday
  const start = addDays(weekStart, offset * 7);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  const label = `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  const days = eachDayOfInterval({ start, end });
  return { start, end, label, days };
}

function normalizeLogs(logs: any[]) {
  const map: Record<string, number> = {};
  logs.forEach(l => {
    const key = ymd(new Date(l.log_date));
    map[key] = l.count ?? 0;
  });
  return map;
}

export default function Analytics() {
  const nav = useNavigate();

  // habits list & selection
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selected, setSelected] = useState<number | "">("");

  // loading / errors
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [habitsError, setHabitsError] = useState<string | null>(null);

  // selected-habit series
  const [barData, setBarData] = useState<DayPoint[]>([]);
  const [target, setTarget] = useState<number | undefined>(undefined);
  const [completionPct, setCompletionPct] = useState<number>(0);
  const [barLoading, setBarLoading] = useState(false);
  const [barError, setBarError] = useState<string | null>(null);

  // stacked overview (all habits)
  const [stackData, setStackData] = useState<any[]>([]);
  const [legendHabits, setLegendHabits] = useState<Habit[]>([]);
  const [stackLoading, setStackLoading] = useState(false);
  const [stackError, setStackError] = useState<string | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);

  const { start, end, label, days } = useMemo(
    () => getWeekFromOffset(weekOffset),
    [weekOffset]
  );

  // Pro gate
  const { isPro } = useProGate();
  const { openPaywall } = usePaywall();

  // ---- Load habits once (and when retried) ----
  const loadHabits = useCallback(async () => {
    setHabitsLoading(true);
    setHabitsError(null);
    try {
      const hs = (await listHabits()).filter((h: Habit) => !h.is_archived);
      setHabits(hs);
      // default selection if empty -> keep "", else first id
      setSelected(prev => (prev === "" && hs[0] ? hs[0].id : prev));
    } catch (e: any) {
      setHabitsError(e?.message || "Failed to load habits.");
      setHabits([]);
      setSelected("");
    } finally {
      setHabitsLoading(false);
    }
  }, []);

  useEffect(() => { loadHabits(); }, [loadHabits]);

  // ---- Load selected habit data for the current week ----
  useEffect(() => {
    (async () => {
      if (!selected) { setBarData([]); setCompletionPct(0); return; }
      setBarLoading(true);
      setBarError(null);
      try {
        const habit = habits.find(h => h.id === selected);
        setTarget(habit?.target_per_day);

        const logs = await listLogs(Number(selected), ymd(start), ymd(end));
        const byDate = normalizeLogs(logs);
        const t = Math.max(1, habit?.target_per_day || 1);

        const series: DayPoint[] = days.map(d => {
          const key = ymd(d);
          const c = byDate[key] || 0;
          return { day: format(d, "EEE"), dateKey: key, count: c, completed: c >= t };
        });

        setBarData(series);

        const done = series.filter(s => s.completed).length;
        setCompletionPct(series.length ? Math.round((done / series.length) * 100) : 0);
      } catch (e: any) {
        setBarError(e?.message || "Failed to load habit data.");
        setBarData([]);
        setCompletionPct(0);
      } finally {
        setBarLoading(false);
      }
    })();
  }, [selected, start, end, days, habits]);

  // ---- Load stacked overview for all habits (0/1 per day) ----
  useEffect(() => {
    (async () => {
      setStackLoading(true);
      setStackError(null);
      try {
        const actives = habits;
        if (!actives.length) { setStackData([]); setLegendHabits([]); return; }

        const resultRows = days.map(d => ({ day: format(d, "EEE"), dateKey: ymd(d) })) as any[];

        // (MVP) sequential; later batch
        for (const h of actives) {
          const logs = await listLogs(h.id, ymd(start), ymd(end));
          const byDate = normalizeLogs(logs);
          const t = Math.max(1, h.target_per_day || 1);
          for (const row of resultRows) {
            const c = byDate[row.dateKey] || 0;
            row[`h_${h.id}`] = c >= t ? 1 : 0;
          }
        }
        setStackData(resultRows);
        setLegendHabits(actives);
      } catch (e: any) {
        setStackError(e?.message || "Failed to load weekly overview.");
        setStackData([]);
        setLegendHabits([]);
      } finally {
        setStackLoading(false);
      }
    })();
  }, [habits, start, end, days]);

  // ---- Export CSV of the current week (all habits) ----
  const exportCsv = async () => {
    if (!isPro) return openPaywall("CSV export");

    let rows: string[] = [];
    rows.push(["date", "habit", "target", "count", "completed"].join(","));

    for (const h of habits) {
      const logs = await listLogs(h.id, ymd(start), ymd(end));
      const byDate = normalizeLogs(logs);
      const t = Math.max(1, h.target_per_day || 1);
      for (const d of days) {
        const key = ymd(d);
        const c = byDate[key] || 0;
        rows.push([
          key,
          `"${h.name.replace(/"/g, '""')}"`,
          String(t),
          String(c),
          c >= t ? "1" : "0",
        ].join(","));
      }
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-analytics_${ymd(start)}_${ymd(end)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---- UI ----
  const showEmpty = !habitsLoading && habits.length === 0;

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Analytics & Insights</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {habitsLoading ? (
            <Skeleton variant="text" width={200} />
          ) : (
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          )}

          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => setWeekOffset(x => x - 1)}>← Last</Button>
            <Button onClick={() => setWeekOffset(0)}>This week</Button>
            <Button onClick={() => setWeekOffset(x => x + 1)}>Next →</Button>
          </ButtonGroup>

          <Button onClick={exportCsv} size="small" variant="contained">Export CSV</Button>
        </Stack>
      </Stack>

      {/* Habits loading / error / empty */}
      {habitsError && (
        <Alert severity="error" action={<Button onClick={loadHabits}>Retry</Button>}>
          {habitsError}
        </Alert>
      )}

      {showEmpty && (
        <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
          <Typography color="text.secondary" variant="body1">
            You don’t have any active habits yet.
          </Typography>
          <Button variant="contained" color="primary" size="small" onClick={() => nav("/new")}>
            Create your first habit
          </Button>
        </Stack>
      )}

      {/* Habit selector + completion chip */}
      <Paper sx={{ p: 2 }}>
        {habitsLoading ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
            <Skeleton variant="rounded" width={360} height={40} />
            <Skeleton variant="rounded" width={140} height={28} sx={{ ml: { sm: "auto" } }} />
          </Stack>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
            <FormControl fullWidth sx={{ maxWidth: 360 }}>
              <InputLabel id="habit-label">Habit</InputLabel>
              <Select
                labelId="habit-label"
                label="Habit"
                value={selected}
                onChange={(e) => setSelected(e.target.value as number)}
              >
                {habits.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ ml: { sm: "auto" } }}>
              <Chip
                color={completionPct >= 80 ? "success" : completionPct >= 50 ? "warning" : "default"}
                label={`Completion: ${completionPct}%`}
                sx={{ height: 28 }}
              />
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Selected habit: counts per day with target line */}
      <Paper sx={{ p: 2, height: 320 }}>
        {barLoading ? (
          <Skeleton variant="rectangular" height="100%" />
        ) : barError ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1}>
            <Typography color="error">{barError}</Typography>
            <Button size="small" onClick={() => setWeekOffset(w => w)}>Retry</Button>
          </Stack>
        ) : (
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              {target ? <ReferenceLine y={target} strokeDasharray="4 4" /> : null}
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Stacked overview: all habits completion (0/1) per day */}
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>All Habits</Typography>
      <Paper sx={{ p: 2, height: 360 }}>
        {stackLoading ? (
          <Skeleton variant="rectangular" height="100%" />
        ) : stackError ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1}>
            <Typography color="error">{stackError}</Typography>
            <Button size="small" onClick={() => setWeekOffset(w => w)}>Retry</Button>
          </Stack>
        ) : stackData.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
            <Typography color="text.secondary">No data for this week.</Typography>
          </Stack>
        ) : (
          <ResponsiveContainer>
            <BarChart data={stackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {legendHabits.map((h) => (
                <Bar key={h.id} dataKey={`h_${h.id}`} stackId="completed" name={h.name} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Stack>
  );
}