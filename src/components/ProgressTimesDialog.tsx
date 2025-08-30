import {
  Dialog, DialogTitle, DialogContent, Typography, Tooltip, Chip, Stack, Box
} from "@mui/material";
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent
} from "@mui/lab";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { format, formatDistanceToNow } from "date-fns";

export default function ProgressTimesDialog({
  open, onClose, timesISO, dateLabel
}: {
  open: boolean;
  onClose: () => void;
  timesISO: string[];
  dateLabel?: string;
}) {
  const localTimes = timesISO
    .map((iso) => new Date(iso))
    .sort((a,b) => a.getTime() - b.getTime());

  const total = localTimes.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display:"flex", alignItems:"center", gap:1 }}>
        <LocalDrinkIcon fontSize="small" />
        Progress timeline {dateLabel ? `• ${dateLabel}` : ""}
        <Box sx={{ flex: 1 }} />
        <Chip size="small" label={`${total} ${total === 1 ? "entry" : "entries"}`} />
      </DialogTitle>

      <DialogContent dividers sx={{ py: 1.5 }}>
        {localTimes.length === 0 ? (
          <Typography color="text.secondary">No entries yet.</Typography>
        ) : (
          <Timeline position="right" sx={{ m: 0, p: 0 }}>
            {localTimes.map((d, i) => {
              const isLast = i === localTimes.length - 1;
              const timeLabel = format(d, "p");          // e.g. 9:05 AM
              const dateLabelFull = format(d, "PP");     // e.g. Aug 26, 2025
              const rel = formatDistanceToNow(d, { addSuffix: true });

              return (
                <TimelineItem key={i}>
                  {/* Left column: time */}
                  <TimelineOppositeContent sx={{ pr: 1.5 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                      <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                      <Typography variant="caption" color="text.secondary">
                        {timeLabel}
                      </Typography>
                    </Stack>
                  </TimelineOppositeContent>

                  {/* Dot + connector */}
                  <TimelineSeparator>
                    <TimelineDot color={isLast ? "success" : "primary"} variant={isLast ? "filled" : "outlined"}>
                      {isLast ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <LocalDrinkIcon sx={{ fontSize: 16 }} />}
                    </TimelineDot>
                    {!isLast && <TimelineConnector />}
                  </TimelineSeparator>

                  {/* Right content: index + relative time + date */}
                  <TimelineContent sx={{ py: 0.75 }}>
                    <Stack spacing={0.25}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          color={isLast ? "success" : "default"}
                          label={`#${i + 1}`}
                          sx={{ height: 22 }}
                        />
                        <Tooltip title={dateLabelFull}>
                          <Typography variant="body2">
                            {rel}
                          </Typography>
                        </Tooltip>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {dateLabelFull}
                      </Typography>
                    </Stack>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </DialogContent>
    </Dialog>
  );
}