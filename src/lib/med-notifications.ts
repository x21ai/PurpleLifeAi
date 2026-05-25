// Service-worker-backed medication reminders.
// The SW stores upcoming doses in IndexedDB and checks every 60s.

import { supabase } from "@/integrations/supabase/client";

export type ScheduledDose = {
  doseId: string;
  medicationId: string;
  medName: string;
  dosage: string | null;
  scheduledAt: string;
};

type ScheduledMed = {
  id: string;
  name: string;
  dosage: string | null;
  times_of_day: string[];
  kind?: string;
  is_rescue?: boolean;
};

const DISMISSED_REMINDER_BANNER_KEY = "purple-med-reminder-banner-dismissed";

export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function shouldShowReminderBanner(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandalonePwa()) return false;
  return !localStorage.getItem(DISMISSED_REMINDER_BANNER_KEY);
}

export function dismissReminderBanner(): void {
  localStorage.setItem(DISMISSED_REMINDER_BANNER_KEY, "1");
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

function isRescueMed(m: ScheduledMed): boolean {
  return m.kind === "rescue" || m.is_rescue === true;
}

function formatDosageLabel(dosage: string | null): string | null {
  if (!dosage?.trim()) return null;
  return dosage.trim();
}

function nextOccurrences(timeOfDay: string, daysAhead = 3): Date[] {
  const [hStr, mStr] = timeOfDay.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const now = new Date();
  const results: Date[] = [];

  for (let day = 0; day <= daysAhead; day++) {
    const target = new Date(now);
    target.setDate(target.getDate() + day);
    target.setHours(h, m, 0, 0);
    if (target.getTime() > now.getTime()) {
      results.push(target);
    }
  }
  return results;
}

async function buildUpcomingDoses(meds: ScheduledMed[]): Promise<ScheduledDose[]> {
  const scheduled = meds.filter((m) => !isRescueMed(m) && (m.times_of_day?.length ?? 0) > 0);
  if (scheduled.length === 0) return [];

  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: pendingDoses } = await supabase
    .from("medication_doses")
    .select("id, medication_id, scheduled_at, status")
    .eq("status", "pending")
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", horizon.toISOString());

  function sameMinute(iso: string, when: Date): boolean {
    const d = new Date(iso);
    return (
      d.getFullYear() === when.getFullYear() &&
      d.getMonth() === when.getMonth() &&
      d.getDate() === when.getDate() &&
      d.getHours() === when.getHours() &&
      d.getMinutes() === when.getMinutes()
    );
  }

  const upcoming: ScheduledDose[] = [];
  const usedDoseIds = new Set<string>();

  for (const med of scheduled) {
    const dosage = formatDosageLabel(med.dosage);
    for (const time of med.times_of_day ?? []) {
      if (!/^\d{1,2}:\d{2}$/.test(time)) continue;
      for (const when of nextOccurrences(time, 3)) {
        const match = (pendingDoses ?? []).find(
          (d) => d.medication_id === med.id && sameMinute(d.scheduled_at, when),
        );
        if (!match || usedDoseIds.has(match.id)) continue;
        usedDoseIds.add(match.id);
        upcoming.push({
          doseId: match.id,
          medicationId: med.id,
          medName: med.name,
          dosage,
          scheduledAt: match.scheduled_at,
        });
      }
    }
  }

  for (const d of pendingDoses ?? []) {
    if (usedDoseIds.has(d.id)) continue;
    const med = scheduled.find((m) => m.id === d.medication_id);
    if (!med) continue;
    upcoming.push({
      doseId: d.id,
      medicationId: med.id,
      medName: med.name,
      dosage: formatDosageLabel(med.dosage),
      scheduledAt: d.scheduled_at,
    });
  }

  return upcoming.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
}

async function postScheduleToSw(doses: ScheduledDose[], authToken: string | null): Promise<void> {
  const reg = await ensureServiceWorker();
  if (!reg) return;

  const sw =
    reg.active ?? reg.waiting ?? reg.installing;
  if (!sw) return;

  const payload = {
    type: "SCHEDULE_DOSES",
    doses: doses.map((d) => ({ ...d, authToken })),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  };

  if (reg.active) {
    reg.active.postMessage(payload);
  } else {
    sw.addEventListener("statechange", () => {
      if (sw.state === "activated") sw.postMessage(payload);
    });
  }
}

export async function scheduleMedications(meds: ScheduledMed[]): Promise<void> {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;

  await ensureServiceWorker();

  const { data: sessionData } = await supabase.auth.getSession();
  const authToken = sessionData.session?.access_token ?? null;

  const doses = await buildUpcomingDoses(meds);
  await postScheduleToSw(doses, authToken);
}

export async function rearmMedicationNotifications(): Promise<void> {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;

  const { data, error } = await supabase
    .from("medications")
    .select("id, name, dosage, times_of_day, kind, is_rescue")
    .eq("active", true);

  if (error) {
    console.warn("[purple] could not load meds for reminders", error);
    return;
  }

  await scheduleMedications((data ?? []) as ScheduledMed[]);
}
