import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recognizeFromImageBase64, recognizeFromText } from "./food.server";

const sourceEnum = z.enum(["manual", "photo", "voice"]);

export const listFoodForRange = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id?: string; from: string; to: string }) =>
    z
      .object({
        user_id: z.string().uuid().optional(),
        from: z.string().datetime(),
        to: z.string().datetime(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.user_id ?? userId;
    const { data: rows, error } = await supabase
      .from("food_entries")
      .select(
        "id, consumed_at, name, portion, calories_kcal, protein_g, carbs_g, fat_g, photo_path, source, ai_confidence, note",
      )
      .eq("user_id", target)
      .gte("consumed_at", data.from)
      .lt("consumed_at", data.to)
      .order("consumed_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createFoodEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      user_id?: string;
      consumed_at: string;
      name: string;
      portion?: string | null;
      calories_kcal?: number | null;
      protein_g?: number | null;
      carbs_g?: number | null;
      fat_g?: number | null;
      photo_path?: string | null;
      source: "manual" | "photo" | "voice";
      ai_confidence?: number | null;
      note?: string | null;
    }) =>
      z
        .object({
          user_id: z.string().uuid().optional(),
          consumed_at: z.string().datetime(),
          name: z.string().trim().min(1).max(120),
          portion: z.string().trim().max(120).nullable().optional(),
          calories_kcal: z.number().nonnegative().max(20000).nullable().optional(),
          protein_g: z.number().nonnegative().max(2000).nullable().optional(),
          carbs_g: z.number().nonnegative().max(2000).nullable().optional(),
          fat_g: z.number().nonnegative().max(2000).nullable().optional(),
          photo_path: z.string().max(500).nullable().optional(),
          source: sourceEnum,
          ai_confidence: z.number().min(0).max(1).nullable().optional(),
          note: z.string().trim().max(500).nullable().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.user_id ?? userId;
    const isCaregiver = target !== userId;
    const { data: row, error } = await supabase
      .from("food_entries")
      .insert({
        user_id: target,
        consumed_at: data.consumed_at,
        name: data.name,
        portion: data.portion ?? null,
        calories_kcal: data.calories_kcal ?? null,
        protein_g: data.protein_g ?? null,
        carbs_g: data.carbs_g ?? null,
        fat_g: data.fat_g ?? null,
        photo_path: data.photo_path ?? null,
        source: data.source,
        ai_confidence: data.ai_confidence ?? null,
        note: data.note ?? null,
        created_by_kind: isCaregiver ? "caregiver" : "self",
        created_by_id: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteFoodEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("food_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recognizeIntakeFromPhoto = createServerFn({ method: "POST" })
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
    return recognizeFromImageBase64(context.supabase, context.userId, data.image_data_url);
  });

export const recognizeIntakeFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string }) =>
    z.object({ text: z.string().trim().min(2).max(800) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    return recognizeFromText(context.supabase, context.userId, data.text);
  });
