import { openDB, DBSchema, IDBPDatabase } from "idb";

interface HabitDB extends DBSchema {
  habits: { key:number; value:any; indexes:{ byUpdated:string } };
  habit_logs: { key:string; value:any; indexes:{ byHabitDate:string; byUpdated:string } };
  meta: { key:string; value:any };
}

let _db: IDBPDatabase<HabitDB> | null = null;

export async function db() {
  if (_db) return _db;
  _db = await openDB<HabitDB>("habit-db", 1, {
    upgrade(d) {
      const h = d.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
      h.createIndex("byUpdated", "updatedAt");

      const l = d.createObjectStore("habit_logs", { keyPath: "id" }); // id = `${habitId}:${log_date}`
      l.createIndex("byHabitDate", "habitId");
      l.createIndex("byUpdated", "updatedAt");

      d.createObjectStore("meta");
    },
  });
  return _db!;
}

// tiny helpers
export async function putHabit(h:any){ const d = await db(); h.updatedAt = new Date().toISOString(); await d.put("habits", h); }
export async function getHabits(){ const d = await db(); return d.getAll("habits"); }
export async function putLog(l:any){ const d = await db(); l.updatedAt = new Date().toISOString(); await d.put("habit_logs", { ...l, id:`${l.habitId}:${l.log_date}`}); }
export async function getChangedSince(iso:string){
  const d = await db();
  const habits = await d.getAllFromIndex("habits","byUpdated", IDBKeyRange.lowerBound(iso));
  const logs = await d.getAllFromIndex("habit_logs","byUpdated", IDBKeyRange.lowerBound(iso));
  return { habits, logs };
}
export async function setMeta(key:string, val:any){ const d = await db(); await d.put("meta", val, key); }
export async function getMeta<T=any>(key:string){ const d = await db(); return d.get("meta", key) as Promise<T|undefined>; }
export async function getLogByHabitDate(habitId: number, date: string) {
  const d = await db();
  return d.get("habit_logs", `${habitId}:${date}`);
}

export async function putLogCount(habitId: number, date: string, count: number) {
  const d = await db();
  const rec = { id: `${habitId}:${date}`, habitId, log_date: date, count, updatedAt: new Date().toISOString() };
  await d.put("habit_logs", rec);
  return rec;
}
