import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Normalize errors: { message, status, fields }
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Network / no response
    if (!err.response) {
      return Promise.reject({
        message: "Network error. Check your connection.",
        status: 0,
      });
    }
    const { status, data } = err.response;
    const fields =
      (data && (data.errors || data.fieldErrors)) || // Laravel validation errors
      (data && data.error && data.error.details) ||
      undefined;

    const message =
      (data && (data.message || data.error || data.title)) ||
      (status === 401
        ? "Invalid credentials."
        : status === 422
        ? "Please fix the highlighted fields."
        : "Something went wrong.");

    return Promise.reject({ message, status, fields });
  }
);

// ---- Auth
export const register = (payload: {
  name: string;
  email: string;
  password: string;
}) => api.post("/auth/register", payload).then((r) => r.data);

export const login = (payload: { email: string; password: string }) =>
  api.post("/auth/login", payload).then((r) => r.data);

export const me = () => api.get("/me").then((r) => r.data);

// ---- Profile
export const updateProfile = (payload: { name: string; email: string }) =>
  api.put("/me", payload).then((r) => r.data);

export const updatePassword = (payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => api.put("/me/password", payload).then((r) => r.data);

// ---- Habits
export type HabitPayload = {
  name: string;
  frequency: "daily" | "weekly";
  target_per_day: number;
  reminder_time?: string | null; // "HH:MM" (24h) or null
};

export const getHabit = async (id: number) => {
  // If you DO NOT have GET /habits/:id, this falls back to list & find
  try {
    const { data } = await api.get(`/habits/${id}`);
    return data;
  } catch {
    const all = await listHabits();
    const h = all.find((x: any) => x.id === id);
    if (!h) throw new Error("Habit not found");
    return h;
  }
};
export const listHabits = () => api.get("/habits").then((r) => r.data);
export const createHabit = (h: {
  name: string;
  frequency: "daily" | "weekly";
  target_per_day?: number;
  reminder_time?: string;
}) => api.post("/habits", h).then((r) => r.data);
export const updateHabit = (id: number, h: Partial<any>) =>
  api.put(`/habits/${id}`, h).then((r) => r.data);
export const deleteHabit = (id: number) =>
  api.delete(`/habits/${id}`).then((r) => r.data);
export const archiveHabit = (id: number, archived: boolean) =>
  api.patch(`/habits/${id}/archive`, { archived }).then((r) => r.data);

// ---- Logs
export const listLogs = (
  habitId: number,
  from?: string,
  to?: string,
  include?: "entries"
) =>
  api
    .get(`/habits/${habitId}/logs`, { params: { from, to, include } })
    .then((r) => r.data);

export const upsertLog = (
  habitId: number,
  body: { log_date: string; count: number }
) => api.post(`/habits/${habitId}/logs/upsert`, body).then((r) => r.data);
export const toggleToday = (habitId: number) =>
  api.post(`/habits/${habitId}/logs/toggle-today`).then((r) => r.data);

// ---- Sync
export const syncPush = (payload: { habits: any[]; habit_logs: any[] }) =>
  api.post("/sync/push", payload).then((r) => r.data);
export const syncPull = (lastSyncAt?: string) =>
  api.get("/sync/pull", { params: { lastSyncAt } }).then((r) => r.data);

// ---- Purchases (MVP)
export const confirmPurchase = (payload: any) =>
  api.post("/purchases/confirm", payload).then((r) => r.data);

// ---- Billing (Paddle via Cashier)
export const startPaddleSubscriptionCheckout = (price_id: string) =>
  api
    .post("/billing/paddle/checkout/subscription", { price_id })
    .then((r) => r.data);

export const startPaddleProductCheckout = () =>
  api.post("/billing/paddle/checkout/product").then((r) => r.data);

// --- Coach API ---
export type CoachSuggestion = {
  id: number;
  user_id: number;
  habit_id?: number | null;
  type: "encourage" | "adjust" | "congratulate";
  code: string;
  title: string;
  message: string;
  payload?: Record<string, any> | null;
  status: "pending" | "accepted" | "dismissed";
  created_at?: string;
  valid_until?: string | null;
};
export const getCoachSuggestions = () =>
  api.get("/coach/suggestions").then((r) => r.data);
export const acceptCoachSuggestion = (id: number) =>
  api.post(`/coach/suggestions/${id}/accept`).then((r) => r.data);
export const dismissCoachSuggestion = (id: number) =>
  api.post(`/coach/suggestions/${id}/dismiss`).then((r) => r.data);

// --- AI Coach: Weekly Review + Atomic Habit + NL Parse ---
export type WeeklyReview = {
  wins: string[];
  stumbles: string[];
  patterns: string[];
  next_actions: {
    title: string;
    why: string;
    steps: string[];
    effort: "low" | "medium" | "high";
  }[];
};
export async function getWeeklyReview(
  refresh?: boolean
): Promise<{ data: WeeklyReview; cached: boolean }> {
  const r = await api.get("/coach/ai/weekly", {
    params: refresh ? { refresh: 1 } : {},
  });
  return r.data; // { data, cached }
}
export async function atomicHabit(text: string): Promise<{
  data: {
    starter_goal: string;
    cue: string;
    duration_min: number;
    location: string;
    metric: string;
  };
}> {
  const r = await api.post("/coach/ai/atomic", { text });
  return r.data;
}
export async function parseHabitLog(message: string): Promise<{
  data: {
    habit_id: number | null;
    fallback_name: string | null;
    count: number;
    when: string;
  };
}> {
  const r = await api.post("/coach/ai/parse-log", { message });
  return r.data;
}
// lib/api.ts
export const createHabitFromAtomic = (goal: string, plan: {
  starter_goal: string;
  cue: string;
  duration_min: number;
  location: string;
  metric: string;
}) => {
  // Minimal, safe mapping:
  // - name: prefer the *starter_goal* to keep it atomic
  // - frequency: daily
  // - target_per_day: 1 (atomic habit)
  // - (optional) you can try to extract a reminder time from plan.cue later
  return createHabit({
    name: plan.starter_goal || goal,
    frequency: "daily",
    target_per_day: 1,
  });
};

