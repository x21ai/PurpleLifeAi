import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  recognizeMedicationFromImage,
  recognizeMedicationFromText,
} from "./med-recognition.server";

export const scanMedicationFromPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { image_data_url: string }) =>
    z
      .object({
        image_data_url: z
          .string()
          .min(20)
          .max(15_000_000)
          .regex(/^data:image\//, "Expected a data URL"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    return recognizeMedicationFromImage(context.supabase, context.userId, data.image_data_url);
  });

export const scanMedicationFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string }) =>
    z.object({ text: z.string().trim().min(3).max(800) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    return recognizeMedicationFromText(context.supabase, context.userId, data.text);
  });
