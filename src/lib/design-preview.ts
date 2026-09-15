/**
 * Public design/staging preview (Ploy and similar crawlers).
 * Enabled only when DESIGN_PREVIEW=1 on the Worker AND VITE_DESIGN_PREVIEW=1 in the build.
 * Production www.purplelife.org never sets either flag.
 */

/** Founding-team account used for full-fidelity Ploy crawls (live D1/R2 data). */
export const DESIGN_PREVIEW_DEFAULT_USER_ID = "bb160030-2ed6-45d7-8a5a-7f6f7879e9bb";
export const DESIGN_PREVIEW_DEFAULT_EMAIL = "pmt@eigital.com";

export function isDesignPreviewClient(): boolean {
  return import.meta.env.VITE_DESIGN_PREVIEW === "1";
}

export function isDesignPreviewEnabled(env?: {
  DESIGN_PREVIEW?: string;
  VITE_DESIGN_PREVIEW?: string;
}): boolean {
  const raw =
    env?.DESIGN_PREVIEW ??
    (typeof process !== "undefined" ? process.env.DESIGN_PREVIEW : undefined);
  if (raw === "1" || raw === "true") return true;
  return false;
}

export function designPreviewUserId(env?: { DESIGN_PREVIEW_USER_ID?: string }): string {
  const fromEnv =
    env?.DESIGN_PREVIEW_USER_ID ??
    (typeof process !== "undefined" ? process.env.DESIGN_PREVIEW_USER_ID : undefined);
  return (fromEnv?.trim() || DESIGN_PREVIEW_DEFAULT_USER_ID).toLowerCase();
}

export function designPreviewUserEmail(env?: { DESIGN_PREVIEW_USER_EMAIL?: string }): string {
  const fromEnv =
    env?.DESIGN_PREVIEW_USER_EMAIL ??
    (typeof process !== "undefined" ? process.env.DESIGN_PREVIEW_USER_EMAIL : undefined);
  return (fromEnv?.trim() || DESIGN_PREVIEW_DEFAULT_EMAIL).toLowerCase();
}

export function designPreviewBlockedResponse(feature: string): Response {
  return Response.json(
    {
      error: "disabled_on_design_preview",
      message: `${feature} is disabled on the public design staging host.`,
    },
    { status: 403 },
  );
}
