import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Cross-tenant RLS regression: user A must not read user B's private rows.
 * Requires two test accounts and Supabase env vars in CI/staging.
 */
const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const emailA = process.env.TEST_USER_EMAIL;
const passwordA = process.env.TEST_USER_PASSWORD;
const emailB = process.env.TEST_USER_B_EMAIL;
const passwordB = process.env.TEST_USER_B_PASSWORD;

const hasRlsFixtures = !!(url && anonKey && emailA && passwordA && emailB && passwordB);

async function signInClient(email: string, password: string) {
  const client = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? "sign-in failed");
  return { client, userId: data.session.user.id };
}

test.describe("RLS cross-user isolation", () => {
  test.skip(!hasRlsFixtures, "Set SUPABASE_* and TEST_USER_* / TEST_USER_B_* env vars");

  test("user B cannot read user A meds, journal, doses, or reports", async () => {
    const userA = await signInClient(emailA!, passwordA!);
    const userB = await signInClient(emailB!, passwordB!);

    const tables = ["medications", "journal_entries", "medication_doses", "reports"] as const;

    for (const table of tables) {
      const { data: aRows } = await userA.client.from(table).select("id").limit(5);
      expect((aRows ?? []).length).toBeGreaterThanOrEqual(0);

      if (!aRows?.length) continue;

      const foreignId = aRows[0]!.id as string;
      const { data: leak, error } = await userB.client
        .from(table)
        .select("id")
        .eq("id", foreignId)
        .maybeSingle();

      expect(leak).toBeNull();
      if (error) {
        expect(error.code).not.toBe("PGRST116");
      }
    }

    const { data: crossMeds } = await userB.client
      .from("medications")
      .select("id")
      .eq("user_id", userA.userId)
      .limit(1);
    expect(crossMeds ?? []).toHaveLength(0);
  });
});
