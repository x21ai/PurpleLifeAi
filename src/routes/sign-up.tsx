import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sign-up")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/today" });
    // Send to the unified auth page; sign-in.tsx will switch tabs based on this hash.
    throw redirect({ to: "/sign-in", hash: "register" });
  },
});
