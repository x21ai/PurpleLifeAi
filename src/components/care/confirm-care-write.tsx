import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Caregiver "confirm to write", a single, calm confirmation step shared by
 * every caregiver-initiated write. Per project rules: any write by a caregiver
 * requires an explicit confirmation. The audit row is written server-side.
 */
export function ConfirmCareWriteButton({
  ownerName,
  summary,
  onConfirm,
  pending = false,
  disabled = false,
  children = "Save",
  variant = "default",
}: {
  ownerName: string;
  /** One short line describing what will be written, e.g. "Add a journal entry". */
  summary: ReactNode;
  onConfirm: () => void;
  pending?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  variant?: "default" | "destructive";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled || pending}
        variant={variant}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">
              Write to {ownerName}'s record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {summary}. They&rsquo;ll see this in their audit log, tagged as
              added by you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Yes, write it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
