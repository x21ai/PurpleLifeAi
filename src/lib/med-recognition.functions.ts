import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recognizeMedicationFromImage } from "./med-recognition.server";

export const scanMedicationFromPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { image_data_url: string }) =>
    z.object({
      image_data_url: z
        .string()
        .min(20)
        .max(15_000_000)
        .regex(/^data:image\//, "Expected a data URL"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    return recognizeMedicationFromImage(data.image_data_url);
  });