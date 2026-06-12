import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmCareWriteButton } from "@/components/care/confirm-care-write";
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
import { caregiverAddJournalEntry } from "@/lib/care.functions";
import { userMessage } from "@/lib/user-message";

export function AddJournalSheet({
  ownerId,
  ownerName,
}: {
  ownerId: string;
  ownerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const fn = useServerFn(caregiverAddJournalEntry);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          owner_id: ownerId,
          text,
        },
      }),
    onSuccess: () => {
      toast.success("Entry added");
      void qc.invalidateQueries({ queryKey: ["care", "journal", ownerId] });
      setOpen(false);
      setText("");
    },
    onError: (err: any) => toast.error(userMessage(err, "Couldn't add entry")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus className="h-4 w-4 mr-1" /> Add entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add a journal entry</DialogTitle>
          <DialogDescription>
            This will appear on {ownerName}'s timeline, tagged as added by you.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What just happened?"
          rows={6}
          maxLength={8000}
          autoFocus
        />
        <p className="text-[11px] text-muted-foreground">{text.length}/8000</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={m.isPending}>
            Cancel
          </Button>
          <ConfirmCareWriteButton
            ownerName={ownerName}
            summary="Add a journal entry to their timeline"
            onConfirm={() => m.mutate()}
            pending={m.isPending}
            disabled={!text.trim()}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}