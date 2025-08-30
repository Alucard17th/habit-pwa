import { getChangedSince, setMeta, getMeta, db } from "./db";
import { syncPush, syncPull } from "./api";

export async function runSync() {
  const last = (await getMeta<string>("lastSyncAt")) || "1970-01-01T00:00:00Z";
  // push local changes
  const { habits, logs } = await getChangedSince(last);
  if (habits.length || logs.length) {
    await syncPush({
      habits: habits.map(h => ({ id:h.id, name:h.name, frequency:h.frequency, target_per_day:h.target_per_day, is_archived:!!h.is_archived })),
      habit_logs: logs.map(l => ({ habit_id:l.habitId, log_date:l.log_date, count:l.count }))
    });
  }
  // pull server changes
  const res = await syncPull(last);
  const d = await db();
  const tx = d.transaction(["habits","habit_logs","meta"], "readwrite");
  for (const h of res.habits) await tx.objectStore("habits").put({ ...h, updatedAt: new Date().toISOString() });
  for (const l of res.habit_logs) await tx.objectStore("habit_logs").put({ ...l, id:`${l.habit_id || l.habitId}:${l.log_date}`, habitId:l.habit_id ?? l.habitId, updatedAt:new Date().toISOString() });
  await tx.done;
  await setMeta("lastSyncAt", res.serverTime || new Date().toISOString());
}

// call on app start + when back online
export function initSync() {
  runSync().catch(()=>{});
  window.addEventListener("online", () => runSync().catch(()=>{}));
}
