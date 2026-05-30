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

type CriticalDose = {
  id: string;
  scheduled_at: string;
  medication: { id: string; name: string; dosage: string | null } | null;
};

// Lightweight web-audio beep loop — no asset needed.
function useBeeper(active: boolean) {
  const ctxRef = React.useRef<AudioContext | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (!active) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      try { ctxRef.current?.close(); } catch { /* noop */ }
      ctxRef.current = null;
      return;
    }
    try {
      const AC = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (!AC) return;
      const ctx = new AC();
      ctxRef.current = ctx;
      const beep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      };
      beep();
      timerRef.current = setInterval(beep, 1500);
    } catch { /* noop */ }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      try { ctxRef.current?.close(); } catch { /* noop */ }
      ctxRef.current = null;
    };
  }, [active]);
}

export function ReminderAlarmSheet() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [dose, setDose] = React.useState<CriticalDose | null>(null);
  const [snoozeMinutes, setSnoozeMinutes] = React.useState(10);
  const [busy, setBusy] = React.useState(false);
  const dismissedRef = React.useRef<Set<string>>(new Set());

  // Load user's snooze preference once.
  React.useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("snooze_minutes")
        .eq("id", userId)
        .maybeSingle();
      const m = (data as { snooze_minutes: number | null } | null)?.snooze_minutes;
      if (m && m > 0) setSnoozeMinutes(m);
    })();
  }, [userId]);

  const poll = React.useCallback(async () => {
    if (!userId) return;
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("medication_doses")
      .select(
        "id, scheduled_at, medication:medications!inner(id, name, dosage, reminder_style)",
      )
      .eq("user_id", userId)
      .eq("status", "pending")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(5);
    const rows = (data as unknown as Array<
      CriticalDose & { medication: { reminder_style: string } | null }
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

  useBeeper(!!dose);

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
            scheduled {format(new Date(dose.scheduled_at), "h:mm a")}
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