import type { StagingEnv } from "./env";
import { signJwt } from "./jwt";

const DEFAULT_USER_ID = "bb160030-2ed6-45d7-8a5a-7f6f7879e9bb";
const DEFAULT_EMAIL = "pmt@eigital.com";

type AuthUser = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
};

function isDesignPreviewEnabled(env: StagingEnv): boolean {
  const raw = env.DESIGN_PREVIEW;
  return raw === "1" || raw === "true";
}

async function findUserById(db: D1Database, id: string): Promise<AuthUser | null> {
  return db
    .prepare(
      `SELECT id, email, email_confirmed_at FROM auth_users
       WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(id)
    .first<AuthUser>();
}

async function findUserByEmail(db: D1Database, email: string): Promise<AuthUser | null> {
  return db
    .prepare(
      `SELECT id, email, email_confirmed_at FROM auth_users
       WHERE email = ? AND deleted_at IS NULL`,
    )
    .bind(email.toLowerCase())
    .first<AuthUser>();
}

function hasDesignPreviewBypass(env: StagingEnv, request: Request): boolean {
  const secret = env.DESIGN_PREVIEW_BYPASS_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("X-Purple-Design-Preview-Secret")?.trim();
  return Boolean(header && header === secret);
}

/** Operator-only session mint. Disabled when DESIGN_PREVIEW=0 unless bypass header matches. */
export async function handleDesignPreviewSession(
  env: StagingEnv,
  request: Request,
): Promise<Response> {
  const bypass = hasDesignPreviewBypass(env, request);
  if (!bypass && !isDesignPreviewEnabled(env)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (env.STAGING_REAL_AUTH === "1" && !bypass) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (env.DATA_BACKEND !== "cloudflare") {
    return Response.json(
      { error: "Design preview requires DATA_BACKEND=cloudflare" },
      { status: 503 },
    );
  }

  const secret = env.AUTH_JWT_SECRET;
  if (!secret) {
    return Response.json({ error: "AUTH_JWT_SECRET not configured" }, { status: 503 });
  }

  const userId = (env.DESIGN_PREVIEW_USER_ID?.trim() || DEFAULT_USER_ID).toLowerCase();
  const fallbackEmail = (env.DESIGN_PREVIEW_USER_EMAIL?.trim() || DEFAULT_EMAIL).toLowerCase();

  let user = await findUserById(env.DB, userId);
  if (!user) {
    user = await findUserByEmail(env.DB, fallbackEmail);
  }
  if (!user) {
    return Response.json(
      { error: `Design preview user not found (id=${userId}, email=${fallbackEmail})` },
      { status: 503 },
    );
  }

  const accessToken = await signJwt(secret, {
    sub: user.id,
    email: user.email ?? undefined,
    expSeconds: 86400,
  });

  return Response.json(
    {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: 86400,
      user,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Purple-Design-Preview": "1",
      },
    },
  );
}
