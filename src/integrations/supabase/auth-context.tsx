import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";
import { seedLocaleFromProfile } from "@/i18n";

type AuthState = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const initialSessionApplied = React.useRef(false);

  React.useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        // eslint-disable-next-line no-console
        console.warn("[auth] SIGNED_OUT", "user=", next?.user?.id ?? null);
        initialSessionApplied.current = true;
        setSession(null);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        if (next) setSession(next);
        return;
      }

      initialSessionApplied.current = true;
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: stored } }) => {
      if (!mounted) return;
      setSession((prev) => {
        // Avoid a stale null from getSession() wiping a session the listener already set.
        if (stored) return stored;
        return prev;
      });
      if (!initialSessionApplied.current) {
        initialSessionApplied.current = true;
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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

  // Seed the saved language from the user's profile so it wins over
  // navigator on a fresh device / cleared localStorage.
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    const uid = session?.user?.id;
    if (!uid || seededFor.current === uid) return;
    seededFor.current = uid;
    void supabase
      .from("profiles")
      .select("locale")
      .eq("id", uid)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.locale) seedLocaleFromProfile(data.locale);
      });
  }, [session?.user?.id]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
