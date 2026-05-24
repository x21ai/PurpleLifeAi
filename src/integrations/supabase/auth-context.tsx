import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

type AuthState = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Listener FIRST, then fetch the existing session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      // eslint-disable-next-line no-console
      console.log("[auth]", event, "hasSession=", !!next, "user=", next?.user?.id ?? null);
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      // eslint-disable-next-line no-console
      console.log("[auth] getSession on mount, hasSession=", !!data.session);
      setSession(data.session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      session,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}