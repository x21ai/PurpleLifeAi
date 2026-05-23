// Browser notification scheduler for medication reminders.
// Daily times are stored as "HH:MM" strings; we schedule the next occurrence
// for each time and re-schedule after each fires.

type ScheduledMed = {
  id: string;
  name: string;
  dosage: string | null;
  times_of_day: string[];
};

const timers = new Map<string, number>();

export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!notificationsSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.warn("[purple] sw register failed", e);
    return null;
  }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

function nextOccurrence(timeOfDay: string): Date {
  const [hStr, mStr] = timeOfDay.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target;
}

function clearAll() {
  for (const id of timers.values()) window.clearTimeout(id);
  timers.clear();
}

async function fire(med: ScheduledMed, time: string) {
  const reg = await ensureServiceWorker();
  if (!reg) return;
  const dosage = med.dosage ? `${med.dosage}. ` : "";
  reg.active?.postMessage({
    type: "show-med-notification",
    title: `Time for ${med.name}`,
    body: `${dosage}Tap when you have taken it.`,
    tag: `med-${med.id}-${time}`,
  });
}

function scheduleOne(med: ScheduledMed, time: string) {
  const key = `${med.id}::${time}`;
  const existing = timers.get(key);
  if (existing) window.clearTimeout(existing);
  const when = nextOccurrence(time);
  const delay = Math.max(1000, when.getTime() - Date.now());
  // setTimeout max ~24.8 days, our delays are <= 24h.
  const handle = window.setTimeout(async () => {
    await fire(med, time);
    // Re-schedule for tomorrow.
    scheduleOne(med, time);
  }, delay);
  timers.set(key, handle);
}

export async function scheduleMedications(meds: ScheduledMed[]) {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  await ensureServiceWorker();
  clearAll();
  for (const m of meds) {
    for (const t of m.times_of_day ?? []) {
      if (/^\d{1,2}:\d{2}$/.test(t)) scheduleOne(m, t);
    }
  }
}