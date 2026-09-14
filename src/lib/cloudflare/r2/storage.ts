import { requireR2 } from "../bindings";

/** R2 bucket layout mirrors Supabase storage buckets. */
export const R2_BUCKETS = [
  "journal-media",
  "reports",
  "medical-reports",
  "care-chat-attachments",
  "dna-uploads",
] as const;

export type R2BucketName = (typeof R2_BUCKETS)[number];

/** Object key: `{bucket}/{userId}/{path}` */
export function r2ObjectKey(
  bucket: R2BucketName,
  userId: string,
  path: string,
): string {
  const clean = path.replace(/^\/+/, "");
  return `${bucket}/${userId}/${clean}`;
}

export async function r2PutObject(
  bucket: R2BucketName,
  userId: string,
  path: string,
  body: ArrayBuffer | ReadableStream | string,
  contentType?: string,
): Promise<void> {
  const key = r2ObjectKey(bucket, userId, path);
  await requireR2().put(key, body, {
    httpMetadata: contentType ? { contentType } : undefined,
    customMetadata: { bucket, userId },
  });
}

export async function r2GetObject(
  bucket: R2BucketName,
  userId: string,
  path: string,
): Promise<R2ObjectBody | null> {
  const key = r2ObjectKey(bucket, userId, path);
  return requireR2().get(key);
}

export async function r2DeleteObject(
  bucket: R2BucketName,
  userId: string,
  path: string,
): Promise<void> {
  const key = r2ObjectKey(bucket, userId, path);
  await requireR2().delete(key);
}

/** Signed URL substitute: return a Worker route that streams the object after auth. */
export function r2PublicPath(
  bucket: R2BucketName,
  userId: string,
  path: string,
): string {
  const encoded = encodeURIComponent(path.replace(/^\/+/, ""));
  return `/api/storage/${bucket}/${userId}/${encoded}`;
}
