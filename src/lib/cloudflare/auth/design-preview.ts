import { getBindings } from "../bindings";
import { findUserByEmail, findUserById } from "./service";
import { signJwt } from "./jwt";
import {
  designPreviewUserEmail,
  designPreviewUserId,
  isDesignPreviewEnabled,
} from "@/lib/design-preview";

export type DesignPreviewSessionPayload = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: {
    id: string;
    email: string | null;
    email_confirmed_at: string | null;
  };
};

export async function mintDesignPreviewSession(env?: {
  DESIGN_PREVIEW?: string;
  DESIGN_PREVIEW_USER_ID?: string;
  DESIGN_PREVIEW_USER_EMAIL?: string;
}): Promise<DesignPreviewSessionPayload | null> {
  if (!isDesignPreviewEnabled(env)) return null;

  const secret = getBindings().AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET not configured");
  }

  const userId = designPreviewUserId(env);
  let user = await findUserById(userId);
  if (!user) {
    const email = designPreviewUserEmail(env);
    user = await findUserByEmail(email);
  }
  if (!user) {
    throw new Error(
      `Design preview user not found (id=${userId}, email=${designPreviewUserEmail(env)})`,
    );
  }

  const accessToken = await signJwt(secret, {
    sub: user.id,
    email: user.email ?? undefined,
    expSeconds: 86400,
  });

  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 86400,
    user,
  };
}
