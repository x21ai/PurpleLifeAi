import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

export function useIsAdmin() {
  const { session } = useAuth();
  const [state, setState] = React.useState<{
    loading: boolean;
    isAdmin: boolean;
    isSuper: boolean;
  }>({
    loading: true,
    isAdmin: false,
    isSuper: false,
  });

  React.useEffect(() => {
    if (!session?.user.id) {
      setState({ loading: false, isAdmin: false, isSuper: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (cancelled) return;
      const roles = (data ?? []).map((r) => r.role as string);
      setState({
        loading: false,
        isSuper: roles.includes("super_admin"),
        isAdmin: roles.includes("admin") || roles.includes("super_admin"),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  return state;
}
