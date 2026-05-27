import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { proposeChange } from "@/lib/care.functions";

type ProposeType = "add_journal_comment" | "add_meds_note";

export function ProposeChangeDialog({
  relationshipId,
  type,
  targetId,
  targetLabel,
  trigger,
}: {
  relationshipId: string;
  type: ProposeType;
  targetId: string;
  targetLabel: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const fn = useServerFn(proposeChange);
  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          relationship_id: relationshipId,
          type,
          target_id: targetId,
          payload: { text },
        },
      }),
    onSuccess: () => {
      toast.success("Sent for approval");
      setText("");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't submit"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <MessageSquarePlus className="h-3 w-3 mr-1" /> Propose
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Suggest an edit</DialogTitle>
          <DialogDescription>
            {type === "add_journal_comment"
              ? "Your note will appear on this journal entry once they approve it."
              : "Your note will be added to this medication once they approve it."}{" "}
            <span className="text-foreground">{targetLabel}</span>
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note…"
          rows={5}
          maxLength={2000}
          className="mt-2"
        />
        <p className="text-[11px] text-muted-foreground">{text.length}/2000</p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={m.isPending}>
            Cancel
          </Button>
          <Button onClick={() => m.mutate()} disabled={!text.trim() || m.isPending}>
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send for approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}