import * as React from "react";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn, formatLocaleTime, localDateKey, sanitizeDosageLabel } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { Bell, ChevronRight, Moon, MoreVertical, Pill } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ensureServiceWorker,
  notificationsSupported,
  rearmMedicationNotifications,
  requestPermission,
} from "@/lib/med-notifications";
import { DualTime } from "@/components/travel/dual-time";

const PERM_DISMISSED_KEY = "purple-perm-nudge-dismissed";

/**
 * QA #22: decrement (or restore) the pill stock when a dose flips to/from
 * "taken". Best-effort: clamps at 0 and no-ops when stock isn't tracked.
 */
async function decrementPillCount(medicationId: string, by: number) {
  const { data, error } = await supabase
    .from("medications")
    .select("pills_remaining")
    .eq("id", medicationId)
    .maybeSingle();
  if (error || !data || data.pills_remaining == null) return;
  const next = Math.max(0, (data.pills_remaining as number) - by);
  await supabase.from("medications").update({ pills_remaining: next }).eq("id", medicationId);
}

type Dose = {
  id: string;
  scheduled_at: string;
  status: string;
  amount: number | null;
  unit: string | null;
  medication: {
    id: string;
    name: string;
    dosage: string | null;
    kind: string;
    is_rescue: boolean;
  } | null;
};

function statusPillClass(status: string, overdue = false) {
  switch (status) {
    case "taken":
      return "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/30";
    case "missed":
      return "bg-destructive/15 text-destructive ring-1 ring-destructive/30";
    case "skipped":
      return "bg-muted text-muted-foreground ring-1 ring-border";
    default:
      // A 9am dose at 2pm should not look "on schedule".
      return overdue
        ? "bg-[color:var(--data-warn)]/15 text-[color:var(--data-warn)] ring-1 ring-[color:var(--data-warn)]/30"
        : "bg-primary/15 text-primary ring-1 ring-primary/30";
  }
}

/** Pending and more than 30 minutes past its scheduled time. */
function isOverdue(d: Dose): boolean {
  return d.status === "pending" && Date.now() - new Date(d.scheduled_at).getTime() > 30 * 60 * 1000;
}

function isScheduledMed(d: Dose): boolean {
  if (!d.medication) return false;
  return d.medication.kind !== "rescue" && !d.medication.is_rescue;
}

export function TodayDoses() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [doses, setDoses] = React.useState<Dose[] | null>(null);
  const [actioningId, setActioningId] = React.useState<string | null>(null);
  const [homeTz, setHomeTz] = React.useState<string | null>(null);
  const [wakeTime, setWakeTime] = React.useState<string>("07:00");
  const [sleepTime, setSleepTime] = React.useState<string>("23:00");
  const [traveling, setTraveling] = React.useState(false);
  const [permState, setPermState] = React.useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [permDismissed, setPermDismissed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!notificationsSupported()) {
      setPermState("unsupported");
      return;
    }
    setPermState(Notification.permission);
    setPermDismissed(!!localStorage.getItem(PERM_DISMISSED_KEY));
  }, []);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const { data, error } = await supabase
      .from("medication_doses")
      .select("id, scheduled_at, status, amount, unit, medication:medications(id, name, dosage, kind, is_rescue)")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    const rows = ((data as unknown as Dose[]) ?? []).filter(isScheduledMed);
    setDoses(rows);
  }, [userId]);

  React.useEffect(() => { void load(); }, [load]);

  // Roll over at local midnight and refresh when the tab comes back: a Today
  // page left open overnight kept showing yesterday's doses.
  React.useEffect(() => {
    let lastDay = localDateKey(new Date());
    const maybeReload = () => {
      const day = localDateKey(new Date());
      if (day !== lastDay) {
        lastDay = day;
        void load();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        maybeReload();
        void load();
      }
    };
    const tick = window.setInterval(maybeReload, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Load profile (home tz + wake/sleep) and active trip flag.
  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const [{ data: p }, { data: trips }] = await Promise.all([
        supabase
          .from("profiles")
          .select("timezone, wake_time, sleep_time")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("trips")
          .select("id")
          .lte("depart_at", new Date().toISOString())
          .gte("return_at", new Date().toISOString())
          .neq("status", "cancelled")
          .limit(1),
      ]);
      if (cancelled) return;
      const prof = p as { timezone: string | null; wake_time: string | null; sleep_time: string | null } | null;
      setHomeTz(prof?.timezone ?? null);
      if (prof?.wake_time) setWakeTime(prof.wake_time.slice(0, 5));
      if (prof?.sleep_time) setSleepTime(prof.sleep_time.slice(0, 5));
      let deviceTz: string | null = null;
      try { deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* noop */ }
      setTraveling(((trips ?? []).length > 0) || (!!prof?.timezone && !!deviceTz && prof.timezone !== deviceTz));
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Does this scheduled instant fall inside the user's local sleep window?
  const isAsleep = (iso: string): boolean => {
    try {
      const parts = new Intl.DateTimeFormat([], {
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).formatToParts(new Date(iso));
      const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
      const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
      const cur = `${hh}:${mm}`;
      // sleep window crosses midnight if sleepTime > wakeTime numerically
      if (sleepTime > wakeTime) {
        // awake from wake..sleep, asleep otherwise
        return cur >= sleepTime || cur < wakeTime;
      }
      // window crosses midnight (e.g. sleep 02:00, wake 09:00 → unusual)
      return cur >= sleepTime && cur < wakeTime;
    } catch {
      return false;
    }
  };

  const runAction = async (id: string, action: "taken" | "skip" | "snooze") => {
    // In-flight guard: a rapid double-tap on "Taken" used to double-decrement
    // pill stock and race the status updates.
    if (actioningId) return;
    setActioningId(id);
    const prev = doses;
    const dose = doses?.find((d) => d.id === id) ?? null;
    const now = new Date().toISOString();
    const snoozeUntilIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    setDoses((d) =>
      d?.map((x) => {
        if (x.id !== id) return x;
        if (action === "taken") return { ...x, status: "taken" };
        if (action === "skip") return { ...x, status: "skipped" };
        // snooze: move the time optimistically so the list reflects it now
        return { ...x, scheduled_at: snoozeUntilIso };
      }) ?? null,
    );
    let error: unknown = null;
    if (action === "taken") {
      const res = await supabase
        .from("medication_doses")
        .update({ status: "taken", taken_at: now })
        .eq("id", id);
      error = res.error;
      // QA #22: decrement pill stock when a scheduled dose is marked taken.
      if (!error && dose?.medication?.id && (prev?.find((d) => d.id === id)?.status !== "taken")) {
        await decrementPillCount(dose.medication.id, 1);
      }
    } else if (action === "skip") {
      const res = await supabase
        .from("medication_doses")
        .update({ status: "skipped" })
        .eq("id", id);
      error = res.error;
    } else {
      const res = await supabase
        .from("medication_doses")
        // notified_at/missed_notified_at reset so the push cron fires again
        // at the snoozed time; without it, snooze produced no second reminder.
        .update({
          scheduled_at: snoozeUntilIso,
          status: "pending",
          notified_at: null,
          missed_notified_at: null,
        })
        .eq("id", id);
      error = res.error;
    }
    setActioningId(null);
    if (error) {
      setDoses(prev);
      toast.error("That didn't save. Try the dose again in a moment.");
      return;
    }
    if (action === "snooze") {
      toast.success("Snoozed 10 min");
      void load();
      void rearmMedicationNotifications();
    }
  };

  // Retroactive edit: change a non-pending dose back to taken / skipped / pending.
  // takenAt lets a missed dose be logged at its scheduled time instead of now.
  const reclassify = async (
    id: string,
    next: "taken" | "skipped" | "pending",
    takenAt?: string,
  ) => {
    const prev = doses;
    const prevStatus = prev?.find((d) => d.id === id)?.status;
    const medId = prev?.find((d) => d.id === id)?.medication?.id ?? null;
    setDoses((d) => d?.map((x) => (x.id === id ? { ...x, status: next } : x)) ?? null);
    const update: { status: string; taken_at: string | null } = {
      status: next,
      taken_at: next === "taken" ? (takenAt ?? new Date().toISOString()) : null,
    };
    const { error } = await supabase
      .from("medication_doses")
      .update(update)
      .eq("id", id);
    if (error) {
      setDoses(prev);
      toast.error("Could not update dose");
      return;
    }
    // QA #22: keep pills_remaining in sync with retroactive edits.
    if (medId) {
      if (next === "taken" && prevStatus !== "taken") await decrementPillCount(medId, 1);
      else if (next !== "taken" && prevStatus === "taken") await decrementPillCount(medId, -1);
    }
    toast.success(
      next === "taken" ? "Marked as taken" : next === "skipped" ? "Marked as skipped" : "Reset to pending",
    );
  };

  const enableReminders = async () => {
    // Must run synchronously inside the click handler, no awaits before the
    // permission request, otherwise Safari/iOS drops the user gesture.
    void (async () => {
      const perm = await requestPermission();
      setPermState(perm);
      if (perm === "granted") {
        await ensureServiceWorker();
        await rearmMedicationNotifications();
        toast.success("Reminders enabled");
      } else if (perm === "denied") {
        toast.error("Reminders blocked. Enable in browser settings.");
      }
    })();
  };

  const dismissPerm = () => {
    localStorage.setItem(PERM_DISMISSED_KEY, "1");
    setPermDismissed(true);
  };

  if (!userId) return null;

  const showPermNudge =
    permState === "default" &&
    !permDismissed &&
    (doses?.some((d) => d.status === "pending") ?? false);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-foreground">Today</h2>
        <Link
          to="/meds"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-0.5"
        >
          Medications <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {showPermNudge && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3 flex items-start gap-3">
          <Bell className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              Enable reminders so Purple can alert you at dose time.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="rounded-full" onClick={enableReminders}>
                Enable
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={dismissPerm}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      {doses === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : doses.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-secondary/60 p-4">
          <Pill className="h-4 w-4 mt-0.5 text-secondary-foreground/70" />
          <p className="text-sm text-secondary-foreground">
            No medications scheduled for today.{" "}
            <Link to="/meds" className="underline underline-offset-2">Add one</Link>.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {doses.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                  statusPillClass(d.status, isOverdue(d)),
                )}
              >
                {isAsleep(d.scheduled_at) && (
                  <Moon className="h-3 w-3" aria-label="During your sleep window" />
                )}
                {traveling && homeTz ? (
                  <DualTime iso={d.scheduled_at} homeTz={homeTz} />
                ) : (
                  <span>{formatLocaleTime(d.scheduled_at)}</span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {d.medication?.name ?? "Medication"}
                  {isOverdue(d) && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-[color:var(--data-warn)]">
                      Overdue
                    </span>
                  )}
                </p>
                {(() => {
                  const perDose =
                    d.amount != null
                      ? `${d.amount}${d.unit ? ` ${d.unit}` : ""}`
                      : null;
                  const label = perDose ?? sanitizeDosageLabel(d.medication?.dosage) ?? null;
                  if (label) {
                    return <p className="text-xs text-muted-foreground truncate">{label}</p>;
                  }
                  if (d.medication?.id) {
                    return (
                      <Link
                        to="/meds/$medId"
                        params={{ medId: d.medication.id }}
                        className="text-xs text-primary/80 underline-offset-2 hover:underline"
                      >
                        Set dose
                      </Link>
                    );
                  }
                  return null;
                })()}
              </div>
              {d.status === "pending" ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    className="rounded-full min-h-[44px] min-w-[44px] px-4"
                    disabled={actioningId !== null}
                    aria-label={`Mark ${d.medication?.name ?? "medication"} as taken`}
                    onClick={() => runAction(d.id, "taken")}
                  >
                    Taken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full min-h-[44px] min-w-[44px] px-4"
                    disabled={actioningId !== null}
                    aria-label={`Snooze ${d.medication?.name ?? "medication"} reminder 10 minutes`}
                    onClick={() => runAction(d.id, "snooze")}
                  >
                    Snooze
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-muted-foreground min-h-[44px] min-w-[44px] px-4"
                    disabled={actioningId !== null}
                    aria-label={`Skip ${d.medication?.name ?? "medication"} dose`}
                    onClick={() => runAction(d.id, "skip")}
                  >
                    Skip
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground capitalize">{d.status}</span>
                  {d.status === "missed" && (
                    // Calm recovery, never punishment: a missed dose can
                    // always be logged after the fact.
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-7 text-xs"
                      onClick={() => reclassify(d.id, "taken")}
                    >
                      Log it anyway
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Edit dose status"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-secondary/70 text-muted-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {d.status !== "taken" && (
                        <DropdownMenuItem onClick={() => reclassify(d.id, "taken")}>
                          Mark as taken (now)
                        </DropdownMenuItem>
                      )}
                      {d.status !== "taken" && (
                        <DropdownMenuItem
                          onClick={() => reclassify(d.id, "taken", d.scheduled_at)}
                        >
                          Took it at the scheduled time
                        </DropdownMenuItem>
                      )}
                      {d.status !== "skipped" && (
                        <DropdownMenuItem onClick={() => reclassify(d.id, "skipped")}>
                          Mark as skipped
                        </DropdownMenuItem>
                      )}
                      {d.status !== "pending" && (
                        <DropdownMenuItem onClick={() => reclassify(d.id, "pending")}>
                          Reset to pending
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
