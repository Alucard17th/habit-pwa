import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink as RRNavLink,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Today from "./pages/Today";
import Login from "./pages/Login";
import HabitForm from "./pages/HabitForm";
import Analytics from "./pages/Analytics";
import DayDetail from "./pages/DayDetail";
import HabitEdit from "./pages/HabitEdit";
import WeeklyReview from "./pages/WeeklyReview";
import Coach from "./pages/Coach";
import Profile from "./pages/Profile";
import BillingSuccess from "./pages/BillingSuccess";
import { initSync } from "./lib/sync";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme";
import CssBaseline from "@mui/material/CssBaseline";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Stack,
  IconButton,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
  Avatar,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import MenuIcon from "@mui/icons-material/Menu";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import { startLocalReminderLoop } from "./lib/reminderScheduler";
import { RequireHabitLimit } from "./routes/RequireHabitLimit";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeModeContext";
import ModeToggle from "./components/ModeToggle";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { PaywallProvider } from "./paywall/usePaywall";
import GlobalAtomicHabitLauncher from "./components/GlobalAtomicHabitLauncher";
import QuickLog from "./components/QuickLog";

function useActivePath() {
  const { pathname } = useLocation();
  return (to: string) => {
    // consider / as "Today", startsWith for nested routes (e.g., /habit/:id/day)
    if (to === "/") return pathname === "/" || pathname.startsWith("/habit/");
    return pathname === to;
  };
}

function DesktopNav() {
  const isActive = useActivePath();
  const navItems = useMemo(
    () => [
      { to: "/", label: "Today" },
      // { to: "/new", label: "New Habit" },
      { to: "/analytics", label: "Analytics" },
      { to: "/coach", label: "Coach" },
      { to: "/weekly", label: "Weekly Review" },
    ],
    []
  );

  return (
    <Stack direction="row" spacing={1}>
      {navItems.map((item) => (
        <Button
          key={item.to}
          component={RRNavLink}
          to={item.to}
          // Filled pill when active, text when not
          variant={isActive(item.to) ? "contained" : "text"}
          color={isActive(item.to) ? "primary" : "inherit"}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            px: 1.75,
          }}
        >
          {item.label}
        </Button>
      ))}
    </Stack>
  );
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const isActive = useActivePath();
  const navItems = useMemo(
    () => [
      { to: "/", label: "Today" },
      // { to: "/new", label: "New Habit" },
      { to: "/analytics", label: "Analytics" },
      { to: "/coach", label: "Coach" },
      { to: "/weekly", label: "Weekly Review" },
    ],
    []
  );

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 260, pt: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.2}
          sx={{ px: 2, py: 1 }}
        >
          <WaterDropOutlinedIcon />
          <Typography variant="h6">HabitPWA</Typography>
        </Stack>
        <Divider />
        <List sx={{ py: 0 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={RRNavLink}
              to={item.to}
              onClick={onClose}
              selected={isActive(item.to)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

function Shell() {
  const { user, token, logout, loading } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    initSync();
    startLocalReminderLoop();
  }, [user]);
  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ height: "100vh", width: "100%" }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading your data...
        </Typography>
      </Stack>
    );
  }
  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%", gap: 1 }}>
          {/* Mobile menu button */}
          <Box sx={{ display: { xs: "inline-flex", md: "none" } }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Brand */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
            <WaterDropOutlinedIcon color="primary" />
            <Typography
              variant="h6"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              HabitPWA
            </Typography>
          </Stack>

          {/* Desktop nav */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }}>
            <DesktopNav />
          </Box>

          {/* User section */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Dark / light toggle */}
            <ModeToggle />

            {/* Install PWA button */}
            {canInstall && (
              <Tooltip title="Install HabitPWA">
                <Button
                  size="small"
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={promptInstall}
                  sx={{ textTransform: "none" }}
                >
                  Install
                </Button>
              </Tooltip>
            )}

            {/* User info */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                component={RouterLink}
                to="/profile"
                startIcon={
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: 14,
                      bgcolor: "primary.main",
                    }}
                  >
                    {user?.name.charAt(0).toUpperCase()}
                  </Avatar>
                }
                sx={{ textTransform: "none" }}
              >
                {user?.name}
              </Button>
              {user?.is_premium && (
                <Chip
                  size="small"
                  color="success"
                  label="Pro"
                  sx={{ height: 22 }}
                />
              )}
            </Stack>

            {/* Logout */}
            <Button
              variant="outlined"
              size="small"
              onClick={logout}
              sx={{ textTransform: "none" }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route
            path="/new"
            element={
              <RequireHabitLimit>
                <HabitForm />
              </RequireHabitLimit>
            }
          />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/weekly" element={<WeeklyReview />} />
          <Route path="/habit/:id/day" element={<DayDetail />} />
          <Route path="/habit/:id/edit" element={<HabitEdit />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/billing/success" element={<BillingSuccess />} />
        </Routes>
      </Container>
      <QuickLog />
      <GlobalAtomicHabitLauncher />
    </>
  );
}
function ThemedApp() {
  const { mode } = useThemeMode(); // ✅ safe: provider is already mounted
  const theme = React.useMemo(() => createAppTheme({ mode }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PaywallProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<Shell />} />
            </Routes>
          </BrowserRouter>
        </PaywallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}