import * as React from "react";
import { format } from "date-fns";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { startAlarmLoop, type AlarmSoundId, DEFAULT_ALARM_SOUND } from "@/lib/alarm-sounds";
import { formatLocaleTime } from "@/lib/utils";

type CriticalDose = {
  id: string;
  scheduled_at: string;
  medication: { id: string; name: string; dosage: string | null; alarm_sound?: string | null } | null;
};

// Uses startAlarmLoop from @/lib/alarm-sounds to play the user's chosen preset.
function useAlarmLoop(active: boolean, sound: AlarmSoundId) {
  React.useEffect(() => {
    if (!active) return;
    const stop = startAlarmLoop(sound);
    return () => stop();
  }, [active, sound]);
}

export function ReminderAlarmSheet() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [dose, setDose] = React.useState<CriticalDose | null>(null);
  const [snoozeMinutes, setSnoozeMinutes] = React.useState(10);
  const [defaultSound, setDefaultSound] = React.useState<AlarmSoundId>(DEFAULT_ALARM_SOUND);
  const [busy, setBusy] = React.useState(false);
  const dismissedRef = React.useRef<Set<string>>(new Set());

  // Load user's snooze preference once.
  React.useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("snooze_minutes, default_alarm_sound")
        .eq("id", userId)
        .maybeSingle();
      const row = data as { snooze_minutes: number | null; default_alarm_sound: string | null } | null;
      if (row?.snooze_minutes && row.snooze_minutes > 0) setSnoozeMinutes(row.snooze_minutes);
      if (row?.default_alarm_sound) setDefaultSound(row.default_alarm_sound as AlarmSoundId);
    })();
  }, [userId]);

  const poll = React.useCallback(async () => {
    if (!userId) return;
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("medication_doses")
      .select(
        "id, scheduled_at, medication:medications!inner(id, name, dosage, reminder_style, alarm_sound)",
      )
      .eq("user_id", userId)
      .eq("status", "pending")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(5);
    const rows = (data as unknown as Array<
      CriticalDose & { medication: { reminder_style: string; alarm_sound: string | null } | null }
    > | null) ?? [];
    const critical = rows.find(
      (r) => r.medication?.reminder_style === "critical" && !dismissedRef.current.has(r.id),
    );
    setDose(critical ?? null);
  }, [userId]);

  React.useEffect(() => {
    if (!userId) return;
    void poll();
    const t = setInterval(() => { void poll(); }, 30_000);
    return () => clearInterval(t);
  }, [userId, poll]);

  const activeSound = (dose?.medication?.alarm_sound as AlarmSoundId | undefined) ?? defaultSound;
  useAlarmLoop(!!dose, activeSound);

  if (!dose) return null;

  const handle = async (action: "taken" | "snooze") => {
    if (busy) return;
    setBusy(true);
    try {
      if (action === "taken") {
        await supabase
          .from("medication_doses")
          .update({ status: "taken", taken_at: new Date().toISOString() })
          .eq("id", dose.id);
        // QA #22: decrement pill stock alongside the dose status change.
        const medId = dose?.medication?.id ?? null;
        if (medId) {
          const { data: m } = await supabase
            .from("medications").select("pills_remaining").eq("id", medId).maybeSingle();
          if (m && m.pills_remaining != null) {
            await supabase.from("medications")
              .update({ pills_remaining: Math.max(0, (m.pills_remaining as number) - 1) })
              .eq("id", medId);
          }
        }
        toast.success("Marked taken");
      } else {
        const next = new Date(Date.now() + snoozeMinutes * 60_000).toISOString();
        await supabase
          .from("medication_doses")
          .update({ scheduled_at: next })
          .eq("id", dose.id);
        toast.success(`Snoozed ${snoozeMinutes} min`);
      }
      dismissedRef.current.add(dose.id);
      setDose(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) handle("snooze"); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 text-destructive grid place-items-center mb-2">
            <BellRing className="h-6 w-6 animate-pulse" />
          </div>
          <DialogTitle className="text-center font-serif">
            Time for {dose.medication?.name ?? "your dose"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {dose.medication?.dosage ? `${dose.medication.dosage} · ` : ""}
            scheduled {formatLocaleTime(dose.scheduled_at)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={() => handle("taken")} disabled={busy} className="rounded-full">
            I took it
          </Button>
          <Button
            onClick={() => handle("snooze")}
            disabled={busy}
            variant="outline"
            className="rounded-full"
          >
            Snooze {snoozeMinutes} min
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}