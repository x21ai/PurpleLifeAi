import { d1First, d1Run } from "../d1/client";
import { getBindings } from "../bindings";
import { hashPassword, verifyPassword } from "./passwords";
import { signJwt } from "./jwt";

export type AuthUser = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
};

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  return d1First<AuthUser>(
    `SELECT id, email, email_confirmed_at FROM auth_users
     WHERE email = ? AND deleted_at IS NULL`,
    email.toLowerCase(),
  );
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  return d1First<AuthUser>(
    `SELECT id, email, email_confirmed_at FROM auth_users
     WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
}

export async function createUserWithPassword(
  email: string,
  password: string,
  id?: string,
): Promise<AuthUser> {
  const userId = id ?? crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await d1Run(
    `INSERT INTO auth_users (id, email, email_confirmed_at, password_hash, created_at, updated_at)
     VALUES (?, ?, datetime('now'), ?, datetime('now'), datetime('now'))`,
    userId,
    email.toLowerCase(),
    passwordHash,
  );
  return { id: userId, email: email.toLowerCase(), email_confirmed_at: new Date().toISOString() };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ accessToken: string; user: AuthUser } | null> {
  const row = await d1First<{ id: string; email: string; password_hash: string | null }>(
    `SELECT id, email, password_hash FROM auth_users
     WHERE email = ? AND deleted_at IS NULL`,
    email.toLowerCase(),
  );
  if (!row?.password_hash) return null;
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;

  await d1Run(
    `UPDATE auth_users SET last_sign_in_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    row.id,
  );

  const secret = getBindings().AUTH_JWT_SECRET;
  if (!secret) throw new Error("AUTH_JWT_SECRET not configured");

  const accessToken = await signJwt(secret, {
    sub: row.id,
    email: row.email,
    expSeconds: 3600,
  });

  return {
    accessToken,
    user: { id: row.id, email: row.email, email_confirmed_at: null },
  };
}

export async function importAuthUser(record: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: unknown;
  app_metadata?: unknown;
}): Promise<void> {
  await d1Run(
    `INSERT INTO auth_users (id, email, email_confirmed_at, user_metadata, app_metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       email_confirmed_at = excluded.email_confirmed_at,
       user_metadata = excluded.user_metadata,
       app_metadata = excluded.app_metadata,
       updated_at = datetime('now')`,
    record.id,
    record.email?.toLowerCase() ?? null,
    record.email_confirmed_at ?? null,
    JSON.stringify(record.user_metadata ?? {}),
    JSON.stringify(record.app_metadata ?? {}),
  );
}
