import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { getBindings, setRequestBindings } from "@/lib/cloudflare/bindings";
import { signInWithPassword } from "@/lib/cloudflare/auth/service";

const SIGN_IN_FAILED = "Sign-in failed";

function isSignInBody(value: unknown): value is { email?: string; password?: string } {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export const Route = createFileRoute("/api/auth/sign-in")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Refresh string secrets this env actually carries. Omitted strings
          // (including AUTH_JWT_SECRET) and Worker object bindings stay.
          setRequestBindings(process.env);
          if (!isCloudflareBackend(getBindings())) {
            return Response.json(
              { error: "Use Supabase client auth when DATA_BACKEND=supabase" },
              { status: 400 },
            );
          }

          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }

          if (!isSignInBody(body)) {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }

          if (
            typeof body.email !== "string" ||
            typeof body.password !== "string" ||
            !body.email ||
            !body.password
          ) {
            return Response.json({ error: "email and password required" }, { status: 400 });
          }

          const result = await signInWithPassword(body.email, body.password);
          if (!result) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
          }

          return Response.json({
            access_token: result.accessToken,
            token_type: "bearer",
            expires_in: 3600,
            user: result.user,
          });
        } catch (error) {
          // Returning a Response keeps h3 from rewriting the throw as the
          // HTML crash page (unhandled HTTPError). Do not echo the raw error:
          // D1 failures can include SQL text.
          console.error(error);
          return Response.json({ error: SIGN_IN_FAILED }, { status: 500 });
        }
      },
    },
  },
});
