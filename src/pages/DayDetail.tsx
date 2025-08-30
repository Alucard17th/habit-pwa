import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useParams, Link as RouterLink } from "react-router-dom";
import {
  Container, Stack, Typography, Paper, IconButton, Button, TextField, Chip, Tooltip
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent
} from "@mui/lab";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { listHabits, listLogs, upsertLog } from "../lib/api";
import { format, addDays, parseISO } from "date-fns";

type Habit = {
  id: number;
  name: string;
  frequency: "daily" | "weekly";
  target_per_day: number;
  streak_current: number;
  streak_longest: number;
};

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DayDetail() {
  const { id } = useParams<{ id: string }>();
  const habitId = Number(id);
  const [sp, setSp] = useSearchParams();
  const initialDateStr = sp.get("date") || ymd(new Date());
  const [dateStr, setDateStr] = useState(initialDateStr);

  const [habit, setHabit] = useState<Habit | null>(null);
  const [count, setCount] = useState<number>(0);
  const [times, setTimes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // one-time guard to avoid StrictMode double-load in dev
  const didInit = useRef(false);

  const load = async (hid: number, day: string) => {
    // fetch habit meta
    const all = await listHabits();
    const h = all.find((x: Habit) => x.id === hid) || null;
    setHabit(h || null);

    // fetch logs with entries
    const logs = await listLogs(hid, day, day, "entries");
    const todayLog = logs?.[0] || null;
    setCount(todayLog?.count ?? 0);
    setTimes(todayLog?.entry_times || []);
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    load(habitId, dateStr).catch(() => {});
  }, [habitId, dateStr]);

  const onDateChange = (val: string) => {
    setDateStr(val);
    setSp({ date: val });
    // reload
    load(habitId, val).catch(() => {});
  };

  const stepDay = (delta: number) => {
    const next = ymd(addDays(parseISO(`${dateStr}T00:00:00`), delta));
    onDateChange(next);
  };

  const updateCount = async (next: number) => {
    if (!habit) return;
    const clamped = Math.max(0, Math.min(next, Math.max(1, habit.target_per_day)));
    setBusy(true);
    try {
      await upsertLog(habit.id, { log_date: dateStr, count: clamped });
      await load(habit.id, dateStr);
    } finally {
      setBusy(false);
    }
  };

  const target = Math.max(1, habit?.target_per_day || 1);
  const sortedDates = times.map(t => new Date(t)).sort((a,b) => a.getTime() - b.getTime());
  const total = sortedDates.length;

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
          Today
        </Button>
        <Typography variant="h6" sx={{ ml: 1 }}>
          {habit?.name || "Habit"}
        </Typography>
        <Chip size="small" sx={{ ml: 1 }} label={`Target ${target}/day`} />
        <Stack direction="row" spacing={1} sx={{ ml: "auto" }} alignItems="center">
          <IconButton onClick={() => stepDay(-1)} aria-label="Previous day">
            <ChevronLeftIcon />
          </IconButton>
          <TextField
            size="small"
            type="date"
            value={dateStr}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <IconButton onClick={() => stepDay(1)} aria-label="Next day">
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack>
            <Typography variant="h5">
              {count} / {target}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(parseISO(`${dateStr}T00:00:00`), "PPPP")}
            </Typography>
          </Stack>
          {target > 1 ? (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Decrease">
                <span>
                  <IconButton disabled={busy || count <= 0} onClick={() => updateCount(count - 1)}>
                    <RemoveIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Increase">
                <span>
                  <IconButton disabled={busy || count >= target} onClick={() => updateCount(count + 1)}>
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ) : (
            <Button
              variant={count >= 1 ? "outlined" : "contained"}
              color={count >= 1 ? "success" : "primary"}
              onClick={() => updateCount(count >= 1 ? 0 : 1)}
              startIcon={<CheckCircleIcon />}
              disabled={busy}
            >
              {count >= 1 ? "Undo" : "Mark done"}
            </Button>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <LocalDrinkIcon fontSize="small" />
          <Typography variant="subtitle1">Timeline</Typography>
          <Chip size="small" label={`${total} ${total === 1 ? "entry" : "entries"}`} sx={{ ml: "auto" }} />
        </Stack>

        {sortedDates.length === 0 ? (
          <Typography color="text.secondary">No entries yet for this day.</Typography>
        ) : (
          <Timeline position="right" sx={{ m: 0, p: 0 }}>
            {sortedDates.map((d, i) => {
              const isLast = i === sortedDates.length - 1;
              const timeLabel = format(d, "p");
              const dateLabel = format(d, "PP");
              return (
                <TimelineItem key={i}>
                  <TimelineOppositeContent sx={{ pr: 1.5 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                      <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                      <Typography variant="caption" color="text.secondary">
                        {timeLabel}
                      </Typography>
                    </Stack>
                  </TimelineOppositeContent>

                  <TimelineSeparator>
                    <TimelineDot color={isLast ? "success" : "primary"} variant={isLast ? "filled" : "outlined"}>
                      {isLast ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <LocalDrinkIcon sx={{ fontSize: 16 }} />}
                    </TimelineDot>
                    {!isLast && <TimelineConnector />}
                  </TimelineSeparator>

                  <TimelineContent sx={{ py: 0.75 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={`#${i + 1}`} sx={{ height: 22 }} />
                      <Typography variant="body2">{dateLabel}</Typography>
                    </Stack>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </Paper>
    </Container>
  );
}
