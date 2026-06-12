import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCareThreads } from "@/lib/care-chat.functions";
import { useAuth } from "@/integrations/supabase/auth-context";

/**
 * Tiny unread-count badge for the sidebar "Messages" link.
 * Polls the care-chat threads endpoint and shows the sum of unread messages
 * across all threads the user participates in.
 */
export function ChatUnreadBadge() {
  const { session } = useAuth();
  const fetchThreads = useServerFn(listCareThreads);
  const q = useQuery({
    queryKey: ["care-chat", "threads"],
    queryFn: () => fetchThreads(),
    enabled: !!session,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const total = (q.data?.threads ?? []).reduce(
    (acc: number, t: { unread?: number }) => acc + (t.unread ?? 0),
    0,
  );
  if (!total) return null;
  return (
    <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
      {total > 99 ? "99+" : total}
    </span>
  );
}
