/**
 * Opaque refresh tokens and one-time password-reset tokens.
 * Access JWTs stay 1 hour. verifyJwt still rejects expired access tokens.
 */
import { d1First, d1Run } from "../d1/client";
import { getBindings } from "../bindings";
import { hashPassword } from "./passwords";
import { signJwt } from "./jwt";
import { findUserById, type AuthUser } from "./service";

export const ACCESS_TTL_SECONDS = 3600;
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;
export const RESET_TTL_SECONDS = 3600;

const ENSURE_SQL = `
CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS auth_password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export type IssuedSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "bearer";
  user: { id: string; email: string | null };
};

type RefreshRow = {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
};

function d1Changes(result: D1Result): number {
  const changes = result.meta?.changes;
  return typeof changes === "number" ? changes : 0;
}

type ResetRow = {
  id: string;
  user_id: string;
  expires_at: string;
  used_at: string | null;
};

let ensured = false;

export function resetAuthSchemaCacheForTests(): void {
  ensured = false;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function ensureAuthAuxTables(): Promise<void> {
  if (ensured) return;
  for (const statement of ENSURE_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
    await d1Run(statement);
  }
  ensured = true;
}

function isoAfter(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function isPast(iso: string): boolean {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return true;
  return ms <= Date.now();
}

export async function issueSession(user: {
  id: string;
  email: string | null;
}): Promise<IssuedSession> {
  await ensureAuthAuxTables();
  const secret = getBindings().AUTH_JWT_SECRET ?? process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("AUTH_JWT_SECRET not configured");

  const accessToken = await signJwt(secret, {
    sub: user.id,
    email: user.email ?? undefined,
    role: "authenticated",
    expSeconds: ACCESS_TTL_SECONDS,
  });
  const refreshToken = randomToken();
  const tokenHash = await sha256Hex(refreshToken);
  await d1Run(
    `INSERT INTO auth_refresh_tokens (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    crypto.randomUUID(),
    user.id,
    tokenHash,
    isoAfter(REFRESH_TTL_SECONDS),
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: ACCESS_TTL_SECONDS,
    token_type: "bearer",
    user: { id: user.id, email: user.email },
  };
}

export async function rotateRefreshToken(raw: string): Promise<IssuedSession | null> {
  if (!raw || raw.length < 32) return null;
  await ensureAuthAuxTables();
  const tokenHash = await sha256Hex(raw);
  const row = await d1First<RefreshRow>(
    `SELECT id, user_id, expires_at, revoked_at FROM auth_refresh_tokens WHERE token_hash = ?`,
    tokenHash,
  );
  if (!row) return null;
  if (row.revoked_at || isPast(row.expires_at)) {
    await d1Run(
      `UPDATE auth_refresh_tokens SET revoked_at = datetime('now')
       WHERE user_id = ? AND revoked_at IS NULL`,
      row.user_id,
    );
    return null;
  }

  const revoked = await d1Run(
    `UPDATE auth_refresh_tokens SET revoked_at = datetime('now') WHERE id = ? AND revoked_at IS NULL`,
    row.id,
  );
  if (d1Changes(revoked) < 1) return null;

  const user = await findUserById(row.user_id);
  if (!user) return null;
  return issueSession(user);
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await ensureAuthAuxTables();
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  await d1Run(
    `INSERT INTO auth_password_resets (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    crypto.randomUUID(),
    userId,
    tokenHash,
    isoAfter(RESET_TTL_SECONDS),
  );
  return token;
}

export async function redeemPasswordResetToken(
  raw: string,
  password: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string; status: number }> {
  if (!raw || password.length < 8) {
    return { ok: false, error: "Invalid or expired reset link", status: 401 };
  }
  await ensureAuthAuxTables();
  const tokenHash = await sha256Hex(raw);
  const row = await d1First<ResetRow>(
    `SELECT id, user_id, expires_at, used_at FROM auth_password_resets WHERE token_hash = ?`,
    tokenHash,
  );
  if (!row || row.used_at || isPast(row.expires_at)) {
    return { ok: false, error: "Invalid or expired reset link", status: 401 };
  }

  const marked = await d1Run(
    `UPDATE auth_password_resets SET used_at = datetime('now') WHERE id = ? AND used_at IS NULL`,
    row.id,
  );
  if (d1Changes(marked) < 1) {
    return { ok: false, error: "Invalid or expired reset link", status: 401 };
  }

  const passwordHash = await hashPassword(password);
  await d1Run(
    `UPDATE auth_users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
    passwordHash,
    row.user_id,
  );
  await d1Run(
    `UPDATE auth_refresh_tokens SET revoked_at = datetime('now')
     WHERE user_id = ? AND revoked_at IS NULL`,
    row.user_id,
  );

  const user = await findUserById(row.user_id);
  if (!user) return { ok: false, error: "Invalid or expired reset link", status: 401 };
  return { ok: true, user };
}
