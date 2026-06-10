import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_BYTES = 500 * 1024 * 1024;

const CreateInput = z.object({
  originalFilename: z.string().min(1).max(255),
  byteSize: z.number().int().min(1).max(MAX_BYTES),
});

/**
 * Reserves a `dna_files` row + a deterministic storage path the client
 * uploads to with the authenticated supabase client. Client then calls
 * `parseDnaFile({ fileId })`.
 */
export const createDnaUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const safe = data.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const { data: row, error } = await supabase
      .from("dna_files")
      .insert({
        user_id: userId,
        provider: "unknown",
        original_filename: data.originalFilename,
        storage_path: "pending",
        byte_size: data.byteSize,
        status: "uploaded",
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create DNA upload");
    const storagePath = `${userId}/${row.id}/${safe}`;
    const { error: upErr } = await supabase
      .from("dna_files")
      .update({ storage_path: storagePath })
      .eq("id", row.id);
    if (upErr) throw new Error(upErr.message);
    return { fileId: row.id, storagePath };
  });

const ParseInput = z.object({ fileId: z.string().uuid() });

export const parseDnaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ParseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: file, error } = await supabase
      .from("dna_files")
      .select("id, storage_path, byte_size")
      .eq("id", data.fileId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !file) throw new Error("DNA file not found");

    await supabase.from("dna_files").update({ status: "parsing", error_message: null }).eq("id", file.id);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: blob, error: dlErr } = await supabaseAdmin.storage
        .from("dna-uploads")
        .download(file.storage_path);
      if (dlErr || !blob) throw new Error(dlErr?.message ?? "Download failed");
      const { parseDnaFileBytes } = await import("./dna-parse.server");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const fileName = file.storage_path.split("/").pop() ?? "";
      const { provider, variants, kind, compression } = parseDnaFileBytes(fileName, bytes);

      // Replace any existing rows for this file (idempotent re-parse).
      await supabaseAdmin.from("dna_variants").delete().eq("file_id", file.id);
      if (variants.length > 0) {
        const rows = variants.map((v) => ({
          file_id: file.id,
          user_id: userId,
          rsid: v.rsid,
          genotype: v.genotype,
          chromosome: v.chromosome,
          position: v.position,
        }));
        const { error: insErr } = await supabaseAdmin.from("dna_variants").insert(rows);
        if (insErr) throw new Error(insErr.message);
      }
      await supabase
        .from("dna_files")
        .update({
          status: "parsed",
          provider,
          kind,
          compression,
          parsed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", file.id);
      return { ok: true as const, provider, variantCount: variants.length, kind, compression };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase
        .from("dna_files")
        .update({ status: "error", error_message: message.slice(0, 500) })
        .eq("id", file.id);
      throw new Error(message);
    }
  });

export const listDnaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: files, error } = await supabase
      .from("dna_files")
      .select(
        "id, provider, original_filename, byte_size, status, error_message, parsed_at, share_with_caregivers, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const fileIds = (files ?? []).map((f) => f.id);
    let variants: { file_id: string; rsid: string; genotype: string }[] = [];
    if (fileIds.length) {
      const { data: v } = await supabase
        .from("dna_variants")
        .select("file_id, rsid, genotype")
        .in("file_id", fileIds);
      variants = v ?? [];
    }
    return { files: files ?? [], variants };
  });

const DeleteInput = z.object({ fileId: z.string().uuid() });

export const deleteDnaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: file } = await supabase
      .from("dna_files")
      .select("id, storage_path")
      .eq("id", data.fileId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!file) return { ok: true as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (file.storage_path && file.storage_path !== "pending") {
      await supabaseAdmin.storage.from("dna-uploads").remove([file.storage_path]);
    }
    await supabase.from("dna_variants").delete().eq("file_id", file.id);
    await supabase.from("dna_files").delete().eq("id", file.id);
    return { ok: true as const };
  });

const ShareInput = z.object({ fileId: z.string().uuid(), share: z.boolean() });

export const setDnaShareWithCaregivers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ShareInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("dna_files")
      .update({ share_with_caregivers: data.share })
      .eq("id", data.fileId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });