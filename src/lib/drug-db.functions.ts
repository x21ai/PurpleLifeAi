import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lookupDrugDefaults, type DrugDefaults } from "./drug-db.server";

export type { DrugDefaults } from "./drug-db.server";

export const getDrugDefaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string }) =>
    z.object({ name: z.string().trim().min(2).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<DrugDefaults> => {
    return lookupDrugDefaults(data.name);
  });
