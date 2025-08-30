import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import { useCoachSuggestions } from "../hooks/useCoachSuggestions";

function typeIcon(type: string) {
  switch (type) {
    case "congratulate":
      return <EmojiEventsIcon fontSize="small" />;
    case "adjust":
      return <BuildCircleIcon fontSize="small" />;
    default:
      return <TipsAndUpdatesIcon fontSize="small" />;
  }
}

function typeColor(type: string) {
  switch (type) {
    case "congratulate":
      return "success.main";
    case "adjust":
      return "warning.main";
    default:
      return "info.main";
  }
}

export default function Coach() {
  const { data, grouped, loading, error, refetch, accept, dismiss } = useCoachSuggestions();

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Your Coach</Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={refetch} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {loading && (
        <Stack spacing={1.5}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width={180} />
                </Stack>
                <Skeleton variant="text" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {!loading && !!error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Couldn’t load suggestions. Try again.
        </Typography>
      )}

      {!loading && !error && data.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" gutterBottom>No new tips right now</Typography>
          <Typography color="text.secondary">
            Keep logging—your coach will bring fresh ideas as patterns emerge.
          </Typography>
        </Box>
      )}

      {!loading && !error && data.length > 0 && (
        <Stack spacing={3}>
          {(["congratulate", "adjust", "encourage"] as const).map((section) => {
            const items = grouped[section] || [];
            if (!items.length) return null;

            return (
              <Box key={section}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Chip
                    icon={typeIcon(section)}
                    label={section.charAt(0).toUpperCase() + section.slice(1)}
                    color={
                      section === "congratulate"
                        ? "success"
                        : section === "adjust"
                        ? "warning"
                        : "info"
                    }
                    variant="outlined"
                  />
                </Stack>

                <Stack spacing={1.25}>
                  {items.map((s) => (
                    <Card key={s.id} sx={{ position: "relative", overflow: "hidden" }}>
                      {/* left accent */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: 6,
                          height: "100%",
                          bgcolor: typeColor(s.type),
                        }}
                      />
                      <CardContent>
                        <Stack spacing={0.75}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {typeIcon(s.type)}
                            <Typography variant="subtitle1" fontWeight={700}>
                              {s.title}
                            </Typography>
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            {s.message}
                          </Typography>

                          {/* Optional: payload preview (e.g., suggest_target/time) */}
                          {s.payload && (s.payload.suggest_target || s.payload.suggest_time) && (
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              {s.payload.suggest_target && (
                                <Chip
                                  size="small"
                                  label={`Target → ${s.payload.suggest_target}`}
                                  variant="outlined"
                                />
                              )}
                              {s.payload.suggest_time && (
                                <Chip
                                  size="small"
                                  label={`Time → ${String(s.payload.suggest_time).toUpperCase()}`}
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          )}

                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckIcon />}
                              onClick={() => accept(s.id)}
                            >
                              Apply
                            </Button>
                            <Button
                              size="small"
                              color="inherit"
                              startIcon={<CloseIcon />}
                              onClick={() => dismiss(s.id)}
                            >
                              Dismiss
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
