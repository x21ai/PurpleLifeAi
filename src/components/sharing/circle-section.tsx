import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Eye, Loader2, Mail, MessageCircle, Share2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
function inviteText(url: string, code: string) {
  return `Hey — I'm using Purple, a private health journal. Want to be in my circle? ${url}  (or use code ${code} at purplelife.org/friend/join)`;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "@tanstack/react-router";
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
  setFriendShareBasics,
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

  const setBasics = useServerFn(setFriendShareBasics);
  const basicsMut = useMutation({
    mutationFn: (args: { friendship_id: string; enabled: boolean }) =>
      setBasics({ data: args }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["circle", "mine"] });
      toast.success(res.enabled ? "Sharing your basics" : "Stopped sharing basics");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't update"),
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
                  <PendingInviteShare
                    inviteToken={f.invite_token}
                    referCode={f.refer_code}
                  />
                )}
                {f.status === "active" && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={f.shareBasics}
                        disabled={basicsMut.isPending}
                        onCheckedChange={(v) =>
                          basicsMut.mutate({ friendship_id: f.id, enabled: v })
                        }
                        aria-label="Share basics"
                      />
                      <span>Share basics</span>
                    </label>
                    {f.shareBasics && (
                      <Link
                        to="/friends/$friendshipId"
                        params={{ friendshipId: f.id }}
                        className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
                      >
                        <Eye className="h-3 w-3" /> View what they see
                      </Link>
                    )}
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
  const [created, setCreated] = useState<{
    acceptUrl: string;
    refer_code: string;
  } | null>(null);
  const invite = useServerFn(inviteFriend);
  const m = useMutation({
    mutationFn: () =>
      invite({
        data: {
          email: email.trim() ? email.trim().toLowerCase() : null,
          note: note.trim() || null,
        },
      }),
    onSuccess: (res) => {
      onInvited();
      setCreated({ acceptUrl: res.acceptUrl, refer_code: res.refer_code });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't create invite"),
  });

  function reset() {
    setOpen(false);
    setEmail("");
    setNote("");
    setCreated(null);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        else setOpen(true);
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0">
          <UserPlus className="h-3 w-3 mr-1" /> Invite friend
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {created ? "Send it your way" : "Invite a friend to your circle"}
          </SheetTitle>
        </SheetHeader>

        {!created ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              m.mutate();
            }}
          >
            <div>
              <Label htmlFor="friend-email">Their email (optional)</Label>
              <Input
                id="friend-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="just so you remember who you invited"
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Purple won't email them. You'll send the invite from your own
                phone (iMessage, WhatsApp, etc.) on the next step.
              </p>
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
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
              They won't see your journal, reports, medications, or any other
              health data. Adding someone to your circle just connects you on
              Purple.
            </div>
            <Button type="submit" className="w-full" disabled={m.isPending}>
              {m.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Creating&hellip;
                </>
              ) : (
                "Create invite"
              )}
            </Button>
          </form>
        ) : (
          <ShareInvitePanel
            acceptUrl={created.acceptUrl}
            referCode={created.refer_code}
            onDone={reset}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ShareInvitePanel({
  acceptUrl,
  referCode,
  onDone,
}: {
  acceptUrl: string;
  referCode: string;
  onDone: () => void;
}) {
  const [message, setMessage] = useState(inviteText(acceptUrl, referCode));
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function nativeShare() {
    try {
      await navigator.share({
        title: "Join my circle on Purple",
        text: message,
        url: acceptUrl,
      });
    } catch {
      // user cancelled — no-op
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Couldn't copy"),
    );
  }

  const encoded = encodeURIComponent(message);
  // iOS uses &; Android uses ?. Use & with leading & for safest behavior.
  const smsHref = isIOS() ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
  const waHref = `https://wa.me/?text=${encoded}`;
  const mailHref = `mailto:?subject=${encodeURIComponent("Join my circle on Purple")}&body=${encoded}`;

  return (
    <div className="mt-6 space-y-5">
      <div>
        <Label htmlFor="invite-msg">Message</Label>
        <textarea
          id="invite-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {canNativeShare && (
        <Button onClick={nativeShare} className="w-full">
          <Share2 className="h-4 w-4 mr-2" /> Share&hellip;
        </Button>
      )}

      <div className="grid grid-cols-3 gap-2">
        <a href={smsHref} className="contents">
          <Button variant="outline" className="w-full" type="button">
            <MessageCircle className="h-4 w-4 mr-1" /> iMessage
          </Button>
        </a>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="contents">
          <Button variant="outline" className="w-full" type="button">
            WhatsApp
          </Button>
        </a>
        <a href={mailHref} className="contents">
          <Button variant="outline" className="w-full" type="button">
            <Mail className="h-4 w-4 mr-1" /> Mail
          </Button>
        </a>
      </div>

      <div className="space-y-2">
        <Label>Or share the link</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md bg-muted px-2 py-1 text-[11px] text-foreground">
            {acceptUrl}
          </code>
          <Button size="sm" variant="outline" onClick={() => copy(acceptUrl, "Link")}>
            <Copy className="h-3 w-3 mr-1" /> Copy
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Or share a short code</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 text-center text-lg tracking-widest text-foreground">
            {referCode}
          </code>
          <Button size="sm" variant="outline" onClick={() => copy(referCode, "Code")}>
            <Copy className="h-3 w-3 mr-1" /> Copy
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          They can enter this at purplelife.org/friend/join after signing up.
        </p>
      </div>

      <Button variant="ghost" className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

function PendingInviteShare({
  inviteToken,
  referCode,
}: {
  inviteToken: string;
  referCode: string | null;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const acceptUrl = `${origin}/friend/accept?token=${inviteToken}`;
  const code = referCode ?? "";
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Couldn't copy"),
    );
  }

  async function share() {
    const text = inviteText(acceptUrl, code || "(no code)");
    if (canNativeShare) {
      try {
        await navigator.share({
          title: "Join my circle on Purple",
          text,
          url: acceptUrl,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    copy(acceptUrl, "Link");
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={share}>
        <Share2 className="h-3 w-3 mr-1" /> Share
      </Button>
      <Button size="sm" variant="outline" onClick={() => copy(acceptUrl, "Link")}>
        <Copy className="h-3 w-3 mr-1" /> Copy link
      </Button>
      {code && (
        <Button size="sm" variant="outline" onClick={() => copy(code, "Code")}>
          <Copy className="h-3 w-3 mr-1" /> Code: {code}
        </Button>
      )}
    </div>
  );
}