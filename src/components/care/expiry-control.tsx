import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { setExpiry } from "@/lib/care.functions";
import { userMessage } from "@/lib/user-message";

function fmtCountdown(iso: string | null): string {
  if (!iso) return "Never expires";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / 86400_000);
  if (days >= 1) return `Expires in ${days} day${days === 1 ? "" : "s"}`;
  const hrs = Math.max(1, Math.floor(ms / 3600_000));
  return `Expires in ${hrs}h`;
}

export function ExpiryControl({
  relationshipId,
  expiresAt,
}: {
  relationshipId: string;
  expiresAt: string | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const fn = useServerFn(setExpiry);
  const m = useMutation({
    mutationFn: (value: string | null) =>
      fn({ data: { relationship_id: relationshipId, expires_at: value } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "mine"] });
      toast.success("Access window updated");
      setOpen(false);
    },
    onError: (e: any) => toast.error(userMessage(e, "That change didn't save. Try again in a moment.")),
  });

  function quick(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    m.mutate(d.toISOString());
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="h-3 w-3" />
          {fmtCountdown(expiresAt)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="end">
        <p className="font-serif text-base text-foreground">Access window</p>
        <p className="mt-1 text-xs text-muted-foreground">
          When this expires, their access turns off automatically.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => quick(1)} disabled={m.isPending}>
            24 hours
          </Button>
          <Button size="sm" variant="outline" onClick={() => quick(7)} disabled={m.isPending}>
            7 days
          </Button>
          <Button size="sm" variant="outline" onClick={() => quick(30)} disabled={m.isPending}>
            30 days
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => m.mutate(null)}
            disabled={m.isPending}
          >
            Never
          </Button>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Custom date</p>
          <Calendar
            mode="single"
            selected={expiresAt ? new Date(expiresAt) : undefined}
            onSelect={(d) => d && m.mutate(d.toISOString())}
            disabled={(d) => d < new Date()}
            className="rounded-md"
          />
        </div>
        {m.isPending && (
          <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}