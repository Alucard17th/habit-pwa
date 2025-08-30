import React from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Chip,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import BoltIcon from "@mui/icons-material/Bolt";
import { useParseHabitLog } from "../hooks/useParseHabitLog";
import { listHabits, upsertLog } from "../lib/api";
import { todayYmd } from "../lib/today";

type Habit = { id: number; name: string };

export default function QuickLog({ tz }: { tz?: string }) {
  const [text, setText] = React.useState("");
  const [openResolve, setOpenResolve] = React.useState(false);
  const [resolveState, setResolveState] = React.useState<{
    fallback_name: string | null;
    when: "morning" | "afternoon" | "evening" | "night";
    count: number;
  } | null>(null);

  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = React.useState<number | "">("");
  const [snack, setSnack] = React.useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const { parse, loading: parsing, error } = useParseHabitLog();
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    // Preload habits for instant resolver UX
    listHabits()
      .then((rows: any[]) => {
        setHabits(rows.map((r) => ({ id: r.id, name: r.name })));
      })
      .catch(() => {});
  }, []);

  const doSave = async (habitId: number, count: number) => {
    setSaving(true);
    try {
      await upsertLog(habitId, { log_date: todayYmd(tz), count });
      setSnack({ type: "success", msg: "Logged!" });
      setText("");
    } catch (e: any) {
      setSnack({ type: "error", msg: e?.message || "Failed to save log" });
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    const msg = text.trim();
    if (!msg || parsing || saving) return;
    try {
      const res = await parse(msg);
      const { habit_id, fallback_name, count, when } = res; // { habit_id|null, fallback_name|null, count, when }

      // If the API mapped a valid habit, save right away (optimistic UX)
      if (habit_id) {
        await doSave(habit_id, count);
      } else {
        // Need the user to pick which habit (or create a new one later)
        setResolveState({
          fallback_name,
          when: (["morning", "afternoon", "evening", "night"].includes(when)
            ? when
            : "evening") as any,
          count,
        });
        setSelectedHabitId("");
        setOpenResolve(true);
      }
    } catch (e: any) {
      setSnack({
        type: "error",
        msg: e?.message || "Couldn’t parse your message",
      });
    }
  };

  // Enter submits
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          p: 1.5,
          zIndex: (t) => t.zIndex.appBar,
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          placeholder='Quick log (e.g., "drank 2 glasses of water after dinner")'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={parsing || saving}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BoltIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={submit}
                  disabled={!text.trim() || parsing || saving}
                  edge="end"
                  aria-label="log"
                >
                  {parsing || saving ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SendIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {!!error && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Alert severity="error" sx={{ width: "100%" }}>
              Couldn’t parse your message. Try rephrasing (e.g., “did 10 pushups
              after lunch”).
            </Alert>
          </Stack>
        )}
        {/* Optional: quick filters for "when" chips (for power users).
           If you want to influence parsing before send, you can append words like "morning" in the text. */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {["morning", "afternoon", "evening", "night"].map((w) => (
            <Chip
              key={w}
              label={w}
              size="small"
              onClick={() =>
                setText((t) => (t.includes(w) ? t : `${t} ${w}`).trim())
              }
            />
          ))}
        </Stack>
      </Box>

      {/* Resolver dialog if habit_id was not resolved */}
      <Dialog
        open={openResolve}
        onClose={() => setOpenResolve(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Select habit to log</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {resolveState?.fallback_name && (
              <Alert severity="info">
                Matched goal: <b>{resolveState.fallback_name}</b>. Choose which
                habit this belongs to.
              </Alert>
            )}
            <TextField
              select
              label="Habit"
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(Number(e.target.value))}
              fullWidth
            >
              {habits.map((h) => (
                <MenuItem key={h.id} value={h.id}>
                  {h.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              label="Count"
              inputProps={{ min: 1 }}
              value={resolveState?.count ?? 1}
              onChange={(e) =>
                setResolveState((s) =>
                  s
                    ? { ...s, count: Math.max(1, Number(e.target.value) || 1) }
                    : s
                )
              }
              fullWidth
            />
            <TextField
              select
              label="When"
              value={resolveState?.when ?? "evening"}
              onChange={(e) =>
                setResolveState((s) =>
                  s ? { ...s, when: e.target.value as any } : s
                )
              }
              fullWidth
            >
              {["morning", "afternoon", "evening", "night"].map((w) => (
                <MenuItem key={w} value={w}>
                  {w}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResolve(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={saving || !selectedHabitId}
            onClick={async () => {
              if (!resolveState || !selectedHabitId) return;
              await doSave(Number(selectedHabitId), resolveState.count);
              setOpenResolve(false);
            }}
          >
            {saving ? "Saving…" : "Save log"}
          </Button>
        </DialogActions>
      </Dialog>

      {snack && (
        <Snackbar
          open
          autoHideDuration={2500}
          onClose={() => setSnack(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snack.type} onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}
