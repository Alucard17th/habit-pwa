// src/pages/Today.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  listHabits,
  listLogs,
  upsertLog,
  toggleToday,
  archiveHabit,
  deleteHabit,
} from "../lib/api";
import { getHabits, putHabit, getLogByHabitDate, putLogCount } from "../lib/db";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HistoryIcon from "@mui/icons-material/History";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import EditIcon from "@mui/icons-material/Edit";
import ViewModuleIcon from "@mui/icons-material/ViewModule"; // grid
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda"; // list
import ProgressTimesDialog from "../components/ProgressTimesDialog";
import { useProGate } from "../hooks/useProGate";
import { usePaywall } from "../paywall/usePaywall";

// ---- helpers ----
const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ---- types ----
type Habit = {
  id: number;
  name: string;
  frequency: "daily" | "weekly";
  target_per_day: number;
  streak_current: number;
  streak_longest: number;
  is_archived: boolean;
};

type HabitWithCount = Habit & {
  todayCount: number;
  isLoading?: boolean;
  is_archived?: boolean; // (already on Habit, but left for safety)
};

export default function Today() {
  // data
  const [habits, setHabits] = useState<HabitWithCount[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // dialogs
  const [timesOpen, setTimesOpen] = useState(false);
  const [times, setTimes] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState<{ id: number; name: string } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<{
    id: number;
    name: string;
    nextArchived: boolean;
  } | null>(null);

  // view mode
  const [view, setView] = useState<"list" | "grid">(
    () => (localStorage.getItem("today_view") as "list" | "grid") || "list"
  );
  useEffect(() => {
    localStorage.setItem("today_view", view);
  }, [view]);

  const today = useMemo(() => todayStr(), []);
  const nav = useNavigate();
  const { guard } = useProGate();
  const { openPaywall } = usePaywall();

  // ---- load / refresh ----
  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      let base: Habit[] = [];
      try {
        const server = await listHabits();
        await Promise.all(server.map((h: any) => putHabit(h)));
        base = server;
      } catch {
        // offline fallback
        base = await getHabits();
      }

      const withCounts = await Promise.all(
        base.map(async (h) => {
          try {
            const logs = await listLogs(h.id, today, today);
            const cnt = logs?.[0]?.count ?? 0;
            return { ...h, todayCount: cnt };
          } catch {
            const local = await getLogByHabitDate(h.id, today);
            return { ...h, todayCount: local?.count ?? 0 };
          }
        })
      );

      setHabits(withCounts);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load habits.");
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- actions ----
  const onNew = () => {
    // free limit: 3 habits
    if (!guard(habits.length < 3, () => openPaywall("Unlimited habits"))) return;
    nav("/new");
  };

  const updateCount = async (h: HabitWithCount, next: number) => {
    const clamp = Math.max(0, Math.min(next, Math.max(1, h.target_per_day)));
    setBusy(h.id);
    try {
      await upsertLog(h.id, { log_date: today, count: clamp });
      await refresh();
    } catch {
      // offline
      await putLogCount(h.id, today, clamp);
      setHabits((arr) => arr.map((x) => (x.id === h.id ? { ...x, todayCount: clamp } : x)));
    } finally {
      setBusy(null);
    }
  };

  const onToggleSingle = async (h: HabitWithCount) => {
    setBusy(h.id);
    try {
      await toggleToday(h.id);
      await refresh();
    } catch {
      // offline toggle (0/1)
      const next = h.todayCount >= 1 ? 0 : 1;
      await putLogCount(h.id, today, next);
      setHabits((arr) => arr.map((x) => (x.id === h.id ? { ...x, todayCount: next } : x)));
    } finally {
      setBusy(null);
    }
  };

  async function openTimes(h: HabitWithCount) {
    try {
      const logs = await listLogs(h.id, today, today, "entries");
      setTimes(logs?.[0]?.entry_times || []);
    } catch {
      setTimes([]);
    }
    setTimesOpen(true);
  }

  function askArchive(h: HabitWithCount) {
    setConfirmArchive({ id: h.id, name: h.name, nextArchived: !h.is_archived });
  }

  async function onArchiveConfirmed() {
    if (!confirmArchive) return;
    const { id, nextArchived } = confirmArchive;
    setBusy(id);
    try {
      await archiveHabit(id, nextArchived);
      setConfirmArchive(null);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onDeleteConfirmed() {
    if (!confirmOpen) return;
    const id = confirmOpen.id;
    setBusy(id);
    try {
      await deleteHabit(id);
      setConfirmOpen(null);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  // ---- UI helpers ----
  const renderProgress = (h: HabitWithCount) => {
    const target = Math.max(1, h.target_per_day || 1);
    const pct = Math.min(100, Math.round((h.todayCount / target) * 100));

    if (target === 1) {
      const done = h.todayCount >= 1;
      return (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <LinearProgress
            variant="determinate"
            value={done ? 100 : 0}
            sx={{ flex: 1, height: 8, borderRadius: 1 }}
          />
          <Button
            startIcon={<CheckCircleIcon />}
            variant={done ? "outlined" : "contained"}
            color={done ? "success" : "primary"}
            onClick={() => onToggleSingle(h)}
            disabled={busy === h.id}
          >
            {done ? "Undo" : "Mark done"}
          </Button>
        </Stack>
      );
    }

    return (
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
        <Tooltip title="Decrease">
          <span>
            <IconButton
              size="small"
              onClick={() => updateCount(h, h.todayCount - 1)}
              disabled={busy === h.id || h.todayCount <= 0}
            >
              <RemoveIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Stack sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {h.todayCount} / {h.target_per_day}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
          />
        </Stack>

        <Tooltip title="Increase">
          <span>
            <IconButton
              size="small"
              onClick={() => updateCount(h, h.todayCount + 1)}
              disabled={busy === h.id || h.todayCount >= h.target_per_day}
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    );
  };

  const renderHabitCard = (h: HabitWithCount) => {
    const target = Math.max(1, h.target_per_day || 1);
    const isMulti = target > 1;

    return (
      <Card key={h.id} variant="outlined">
        <CardContent>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {h.name}
            </Typography>

            <Tooltip title="Day detail">
              <span>
                <IconButton
                  size="small"
                  color="info"
                  sx={{ boxShadow: 2 }}
                  onClick={() => nav(`/habit/${h.id}/day?date=${today}`)}
                >
                  <InfoIcon />
                </IconButton>
              </span>
            </Tooltip>

            {isMulti && h.todayCount > 0 && (
              <Tooltip title="View times">
                <span>
                  <IconButton size="small" sx={{ boxShadow: 2 }} onClick={() => openTimes(h)}>
                    <HistoryIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            <Tooltip title="Edit habit">
              <span>
                <IconButton size="small" sx={{ boxShadow: 2 }} onClick={() => nav(`/habit/${h.id}/edit`)}>
                  <EditIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={h.is_archived ? "Unarchive" : "Archive"}>
              <span>
                <IconButton
                  size="small"
                  color="warning"
                  sx={{ boxShadow: 2 }}
                  onClick={() => askArchive(h)}
                  disabled={busy === h.id}
                >
                  {h.is_archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  sx={{ boxShadow: 2 }}
                  onClick={() => setConfirmOpen({ id: h.id, name: h.name })}
                  disabled={busy === h.id}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Meta chips */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Chip size="small" label={h.frequency} />
            <Chip size="small" label={`Target ${target}/day`} />
          </Stack>

          {/* Progress / Controls */}
          <Stack sx={{ mt: 1.25 }}>{renderProgress(h)}</Stack>

          {/* Streak info */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Streak: <b>{h.streak_current}</b> (best {h.streak_longest})
          </Typography>
        </CardContent>

        <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {isMulti && (
              <Button
                startIcon={<CheckCircleIcon />}
                onClick={() => updateCount(h, target)}
                disabled={busy === h.id || h.todayCount >= target}
              >
                Mark all done
              </Button>
            )}
          </Stack>
          <span />
        </CardActions>
      </Card>
    );
  };

  // loading skeletons (match both layouts to avoid jumps)
  const renderLoading = () => {
    if (view === "list") {
      return (
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => (
            <Card key={i} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Skeleton variant="text" width={180} height={28} sx={{ flexGrow: 1 }} />
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="circular" width={28} height={28} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="rounded" width={120} height={24} />
                </Stack>
                <Skeleton variant="rounded" height={10} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Stack>
      );
    }
    return (
      <Grid container spacing={2}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Skeleton variant="text" width="60%" height={28} />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="rounded" width={120} height={24} />
                </Stack>
                <Skeleton variant="rounded" height={10} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // ---- render ----
  return (
    <Stack spacing={2}>
      {/* Header with view toggle + New */}
      <Stack direction="row" alignItems="center" sx={{ justifyContent: "space-between" }}>
        <Typography variant="h5">Today</Typography>

        <Stack direction="row" spacing={1}>
          <Tooltip title={view === "grid" ? "Switch to list view" : "Switch to grid view"}>
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => setView((v) => (v === "list" ? "grid" : "list"))}
                aria-label="Toggle view"
              >
                {view === "list" ? <ViewModuleIcon /> : <ViewAgendaIcon />}
              </IconButton>
            </span>
          </Tooltip>

          <Button variant="contained" onClick={onNew}>
            New Habit
          </Button>
        </Stack>
      </Stack>

      {/* Optional error surface */}
      {loadError && (
        <Stack alignItems="center" spacing={1} sx={{ py: 3 }}>
          <Typography color="error">{loadError}</Typography>
          <Button onClick={refresh} variant="outlined" size="small">
            Retry
          </Button>
        </Stack>
      )}

      {/* Loading -> skeletons; not empty state */}
      {loading ? (
        renderLoading()
      ) : habits.length === 0 ? (
        // Empty state only when not loading
        <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
          <Typography color="text.secondary" variant="body1">
            No habits yet.
          </Typography>
          <Button variant="contained" color="primary" size="small" onClick={() => nav("/new")}>
            Create one
          </Button>
        </Stack>
      ) : view === "list" ? (
        <Stack spacing={2}>{habits.map((h) => renderHabitCard(h))}</Stack>
      ) : (
        <Grid container spacing={2}>
          {habits.map((h) => (
            <Grid key={h.id} size={{ xs: 12, sm: 6, md: 4 }}>
              {renderHabitCard(h)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Times dialog */}
      <ProgressTimesDialog
        open={timesOpen}
        onClose={() => setTimesOpen(false)}
        timesISO={times}
        dateLabel="Today"
      />

      {/* Delete dialog */}
      <Dialog open={!!confirmOpen} onClose={() => setConfirmOpen(null)}>
        <DialogTitle>Delete habit</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete “{confirmOpen?.name}”?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will remove the habit and its logs. You cannot undo this from the app.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(null)}>Cancel</Button>
          <Button onClick={onDeleteConfirmed} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive dialog */}
      <Dialog open={!!confirmArchive} onClose={() => setConfirmArchive(null)}>
        <DialogTitle>
          {confirmArchive?.nextArchived ? "Archive habit" : "Unarchive habit"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmArchive?.nextArchived ? (
              <>
                Are you sure you want to <b>archive</b> “{confirmArchive?.name}”? It will be
                hidden from Today but can be restored.
              </>
            ) : (
              <>Restore “{confirmArchive?.name}” to your active habits?</>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmArchive(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmArchive?.nextArchived ? "warning" : "primary"}
            onClick={onArchiveConfirmed}
          >
            {confirmArchive?.nextArchived ? "Archive" : "Unarchive"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}