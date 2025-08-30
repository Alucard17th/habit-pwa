// src/lib/reminderScheduler.ts
import { ensureNotificationPermission } from "./notifications";
import { listHabits } from "./api";

type FiredMap = Record<number, string>;
const KEY = "habit_last_fired";

const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function loadFired(): FiredMap { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } }
function saveFired(map: FiredMap) { localStorage.setItem(KEY, JSON.stringify(map)); }

async function showLocalNotification(title: string, body: string) {
  try {
    if (!("Notification" in window)) return;

    // If there is a SW registration, use it (so actions work).
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/badge-72.png",
          tag: `habit-${title}`,
          renotify: false,
          // NOTE: actions only supported via SW notifications
          actions: [{ action: "open", title: "Open" }],
        } as NotificationOptions);
        console.log("[reminders] notification via SW");
        return;
      }
    }

    // Fallback for dev (no SW): page-level notification
    // (Chrome ignores actions here, so we omit them)
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: `habit-${title}`,
    });
    console.log("[reminders] notification via window.Notification (dev)");
  } catch (e) {
    console.warn("[reminders] showNotification failed:", e);
  }
}

function parseHM(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

// function isTimeReachedToday(hm: string) {
//   const { h, m } = parseHM(hm);
//   const now = new Date();
//   const target = new Date();
//   target.setHours(h, m, 0, 0);
//   return now.getTime() >= target.getTime();
// }

function isTimeReachedToday(hm: string) {
  const { h, m } = parseHM(hm);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const reached = now.getTime() >= target.getTime();
  // console.log("[reminders] now", now.toLocaleTimeString(), "hm", hm, "target", target.toLocaleTimeString(), "reached?", reached);
  return reached;
}


let intervalId: number | null = null;

export async function startLocalReminderLoop() {
  // Ask once here; for production, trigger from a user gesture as well
  const perm = await ensureNotificationPermission();
  if (perm !== "granted") {
    console.log("[reminders] permission not granted:", perm);
    return;
  }

  if (intervalId) return; // already running

  const tick = async () => {
    // console.log("[reminders] tick", new Date().toLocaleTimeString()); // ⬅️ inside the tick
    try {
      const habits = await listHabits();
      const fired = loadFired();
      const today = ymd();

      for (const h of habits) {
        if (!h.reminder_time || h.is_archived) continue;
        if (fired[h.id] && fired[h.id] !== today) delete fired[h.id]; // day rollover

        if (isTimeReachedToday(h.reminder_time) && fired[h.id] !== today) {
          await showLocalNotification("Reminder", `Don’t forget: ${h.name}`);
          fired[h.id] = today;
        }
      }
      saveFired(fired);
    } catch (e) {
      console.log("[reminders] tick error (ok offline):", e);
    }
  };

  // run immediately + every 5s while testing (restore to 60_000 later)
  await tick();
  intervalId = window.setInterval(tick, 5000);

  // Fire a tick when the tab becomes visible (handy for laptops waking up)
  const onVis = () => { if (document.visibilityState === "visible") tick(); };
  document.addEventListener("visibilitychange", onVis);
}
