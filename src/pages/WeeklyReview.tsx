import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import InsightsIcon from "@mui/icons-material/Insights";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useWeeklyReview } from "../hooks/useWeeklyReview";

export default function WeeklyReview() {
  const { data, cached, loading, error, refetch } = useWeeklyReview();

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={700}>
          Weekly Review
        </Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={() => refetch(true)} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {loading && (
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {!loading && !!error && (
        <Typography color="error">
          Couldn’t load your review. Try again.
        </Typography>
      )}

      {!loading && !error && data && (
        <Stack spacing={2}>
          {cached && (
            <Chip
              size="small"
              color="default"
              label="Cached for this week"
              sx={{ alignSelf: "flex-start" }}
            />
          )}

          <Card>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <EmojiEventsIcon fontSize="small" />
                <Typography variant="h6">Wins</Typography>
              </Stack>
              {data?.wins?.length ? (
                <List dense>
                  {data.wins.map((w, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText primary={w} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No wins detected yet—keep logging!
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <ReportProblemIcon fontSize="small" />
                <Typography variant="h6">Stumbles</Typography>
              </Stack>
              {data?.stumbles?.length ? (
                <List dense>
                  {data.stumbles.map((s, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText primary={s} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Nothing major — great job.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <InsightsIcon fontSize="small" />
                <Typography variant="h6">Patterns</Typography>
              </Stack>
              {data?.patterns?.length ? (
                <List dense>
                  {data.patterns.map((p, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText primary={p} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Patterns will appear as you log more days.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <TaskAltIcon fontSize="small" />
                <Typography variant="h6">Next actions</Typography>
              </Stack>
              {data?.next_actions?.length ? (
                <List dense>
                  {data.next_actions.map((a, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText
                        primary={a.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {a.why}
                            </Typography>
                            {!!a.steps.length && (
                              <>
                                <Divider sx={{ my: 1 }} />
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                  {a.steps.map((s, idx) => (
                                    <li key={idx}>
                                      <Typography variant="body2">
                                        {s}
                                      </Typography>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </>
                        }
                      />
                      <Chip size="small" label={a.effort} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Actions will appear as your coach learns.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
