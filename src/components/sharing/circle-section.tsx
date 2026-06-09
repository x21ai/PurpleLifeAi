import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  inviteFriend,
  listMyCircle,
  removeFriend,
} from "@/lib/friendships.functions";

/**
 * Settings → Sharing card for the user's social Circle.
 * Friends in this list see NONE of the user's health data; they're just
 * people the user is socially connected to on Purple.
 */
export function CircleSection() {
  const qc = useQueryClient();
  const fetchCircle = useServerFn(listMyCircle);
  const circle = useQuery({
    queryKey: ["circle", "mine"],
    queryFn: () => fetchCircle(),
  });

  const remove = useServerFn(removeFriend);
  const removeMut = useMutation({
    mutationFn: (friendship_id: string) => remove({ data: { friendship_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["circle", "mine"] });
      toast.success("Removed from your circle");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't remove"),
  });

  const rows = circle.data?.friendships ?? [];

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-foreground">Your circle</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            Friends in your circle don't see any of your health data. They're
            just people you're connected to on Purple. You'll know who invited
            whom, and either side can leave at any time.
          </p>
        </div>
        <InviteFriendSheet
          onInvited={() => qc.invalidateQueries({ queryKey: ["circle", "mine"] })}
        />
      </div>

      {circle.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Loader2 className="inline h-3 w-3 animate-spin" /> Loading&hellip;
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No one in your circle yet. Invite a friend with the button above.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rows.map((f) => (
            <li
              key={f.id}
              className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">
                  {f.displayName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {f.iInvited ? "You invited" : "Invited you"}
                  {" · "}
                  <StatusPill status={f.status} />
                </p>
                {f.status === "pending" && f.iInvited && f.invite_token && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-muted px-2 py-1 text-[11px] text-foreground">
                      {typeof window !== "undefined" ? window.location.origin : ""}
                      /friend/accept?token={f.invite_token}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url =
                          (typeof window !== "undefined"
                            ? window.location.origin
                            : "") +
                          "/friend/accept?token=" +
                          f.invite_token;
                        navigator.clipboard?.writeText(url).then(
                          () => toast.success("Invite link copied"),
                          () => toast.error("Couldn't copy"),
                        );
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy link
                    </Button>
                  </div>
                )}
              </div>
              <RemoveFriendButton
                name={f.displayName}
                onConfirm={() => removeMut.mutate(f.id)}
                disabled={removeMut.isPending}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    blocked: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function RemoveFriendButton({
  name,
  onConfirm,
  disabled,
}: {
  name: string;
  onConfirm: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Remove from circle"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name} from your circle?</AlertDialogTitle>
          <AlertDialogDescription>
            They'll be removed from both your circles. Neither of you ever had
            access to each other's data, so nothing else changes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InviteFriendSheet({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const invite = useServerFn(inviteFriend);
  const m = useMutation({
    mutationFn: () =>
      invite({
        data: { email: email.trim().toLowerCase(), note: note.trim() || null },
      }),
    onSuccess: (res) => {
      onInvited();
      setOpen(false);
      setEmail("");
      setNote("");
      toast.success(
        res?.emailSent
          ? "Invite sent"
          : "Invite created. Copy the link from the list and send it your way.",
      );
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't send invite"),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0">
          <UserPlus className="h-3 w-3 mr-1" /> Invite friend
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite a friend to your circle</SheetTitle>
        </SheetHeader>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            m.mutate();
          }}
        >
          <div>
            <Label htmlFor="friend-email">Their email</Label>
            <Input
              id="friend-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // live-data-guard:allow
              placeholder="friend@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="friend-note">Nickname (just for you)</Label>
            <Input
              id="friend-note"
              maxLength={60}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. College friend"
              className="mt-1"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Only you can see this nickname. Optional.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
            They won't see your journal, reports, medications, or any other
            health data. Adding someone to your circle just connects you on
            Purple.
          </div>
          <Button type="submit" className="w-full" disabled={m.isPending || !email.trim()}>
            {m.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Sending&hellip;
              </>
            ) : (
              "Send invite"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}