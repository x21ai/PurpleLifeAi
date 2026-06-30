import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Check, HeartHandshake, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  declineIncomingCareInvite,
  listIncomingCareInvites,
} from "@/lib/care.functions";
import { useAuth } from "@/integrations/supabase/auth-context";
import { userMessage } from "@/lib/user-message";

/**
 * Surfaces pending care invites sent to the current user's email. Renders
 * nothing while loading or when there are no invites, so it's safe to drop
 * into any screen header. Accept routes through the existing
 * `/care/accept?token=...` flow so the email path and the in-app path stay
 * in sync.
 */
export function IncomingCareInvitesCard() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchInvites = useServerFn(listIncomingCareInvites);
  const decline = useServerFn(declineIncomingCareInvite);

  const q = useQuery({
    queryKey: ["care", "incoming-invites"],
    queryFn: () => fetchInvites(),
    enabled: !!session,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const declineMut = useMutation({
    mutationFn: (relationship_id: string) =>
      decline({ data: { relationship_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "incoming-invites"] });
      toast.success("Invite declined");
    },
    onError: (e: unknown) =>
      toast.error(userMessage(e, "Couldn't decline this invite")),
  });

  const invites = q.data?.invites ?? [];
  if (!session || invites.length === 0) return null;

  return (
    <section
      aria-label="Care invitations"
      className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium text-foreground">
          {invites.length === 1
            ? "You have a care invitation"
            : `${invites.length} care invitations`}
        </h2>
      </div>
      <ul className="mt-3 space-y-3">
        {invites.map((inv) => (
          <li
            key={inv.id}
            className="rounded-xl border border-border bg-card p-3 sm:p-4"
          >
            <p className="text-sm text-foreground">
              <span className="font-medium">{inv.owner_name}</span>
              <span className="text-muted-foreground">
                {" "}
                invited you as their {inv.role_label.toLowerCase()}.
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Accept to see what they've chosen to share with you.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!inv.invite_token) {
                    toast.error("Invite link is missing.");
                    return;
                  }
                  navigate({
                    to: "/care/accept",
                    search: { token: inv.invite_token },
                  });
                }}
              >
                <Check className="mr-1 h-3 w-3" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={declineMut.isPending}
                onClick={() => declineMut.mutate(inv.id)}
              >
                {declineMut.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <X className="mr-1 h-3 w-3" />
                )}
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}