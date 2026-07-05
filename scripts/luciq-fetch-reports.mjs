#!/usr/bin/env node
/**
 * Summarize Luciq crash/health signals for Purple Flutter TestFlight.
 *
 * SDK token (LUCIQ_APP_TOKEN) is for the mobile app only. Dashboard queries need
 * optional Doppler secrets (MCP token in servers-teamkeys/dev LUCIQ_OAUTH_TOKEN;
 * synced to purple-life/prd as LUCIQ_API_TOKEN via luciq:sync-secrets):
 *   LUCIQ_API_TOKEN      — dashboard or MCP API token (runtime)
 *   LUCIQ_OAUTH_TOKEN    — alias accepted (source in servers-teamkeys/dev)
 *   LUCIQ_ACCOUNT_EMAIL  — Luciq account email
 *
 * Usage:
 *   doppler run --project purple-life --config prd -- node scripts/luciq-fetch-reports.mjs
 *   doppler run --project purple-life --config prd -- node scripts/luciq-fetch-reports.mjs --json
 */
const DASHBOARD_API = "https://dashboard-api.instabug.com";
const asJson = process.argv.includes("--json");

async function luciqFetch(pathname, token, email) {
  const res = await fetch(`${DASHBOARD_API}${pathname}`, {
    headers: {
      Authorization: `Token token="${token}", email="${email}"`,
      Accept: "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.message ?? body?.error ?? res.statusText;
    throw new Error(`Luciq GET ${pathname} failed (${res.status}): ${detail}`);
  }
  return body;
}

function pickApplications(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function appLabel(app) {
  return (
    app?.name ??
    app?.slug ??
    app?.target_os ??
    app?.id ??
    "unknown"
  );
}

function resolveApiToken() {
  const api = process.env.LUCIQ_API_TOKEN?.trim() ?? "";
  if (api) return api;
  return process.env.LUCIQ_OAUTH_TOKEN?.trim() ?? "";
}

async function main() {
  const apiToken = resolveApiToken();
  const email = process.env.LUCIQ_ACCOUNT_EMAIL?.trim() ?? "";
  const sdkConfigured = Boolean(process.env.LUCIQ_APP_TOKEN?.trim());

  const base = {
    sdkTokenConfigured: sdkConfigured,
    dashboardApiConfigured: Boolean(apiToken && email),
    dashboardProject: "Flutter - Purple - Beta",
    manualUrl: "https://dashboard.luciq.ai",
  };

  if (!apiToken || !email) {
    const msg = {
      ...base,
      status: "manual",
      hint:
        "Run bun run luciq:sync-secrets, then luciq:install-mcp for Cursor MCP. " +
        "SDK builds still use LUCIQ_APP_TOKEN via --dart-define.",
    };
    if (asJson) {
      console.log(JSON.stringify(msg, null, 2));
      return;
    }
    console.log("[luciq] Dashboard API credentials not in Doppler (optional).");
    console.log(`[luciq] SDK token in Doppler: ${sdkConfigured ? "yes" : "no"}`);
    console.log("[luciq] Open Luciq → Flutter - Purple - Beta → Crashes / App Health.");
    console.log(`[luciq] ${base.manualUrl}`);
    console.log(
      "[luciq] For agent automation: Luciq MCP token (Account Management → Luciq MCP) " +
        "or email support@luciq.ai for dashboard API access.",
    );
    return;
  }

  let appsPayload;
  try {
    appsPayload = await luciqFetch("/api/web/applications", apiToken, email);
  } catch (err) {
    const isAuth = /401|Authentication failed/i.test(String(err.message));
    const msg = {
      ...base,
      status: isAuth ? "mcp" : "error",
      dashboardApiConfigured: true,
      error: isAuth ? undefined : err.message,
      hint: isAuth
        ? "LUCIQ_OAUTH_TOKEN is for Luciq MCP (api.luciq.ai), not legacy REST. " +
          "Run bun run luciq:install-mcp, restart Cursor, query Flutter - Purple - Beta crashes via MCP."
        : "Check LUCIQ_API_TOKEN + LUCIQ_ACCOUNT_EMAIL or use manual dashboard.",
    };
    if (asJson) {
      console.log(JSON.stringify(msg, null, 2));
      process.exit(isAuth ? 0 : 1);
    }
    console.log("[luciq] Dashboard REST auth failed (MCP token is expected).");
    console.log("[luciq] Run: bun run luciq:install-mcp");
    console.log(`[luciq] ${base.manualUrl}`);
    return;
  }

  const apps = pickApplications(appsPayload);
  const purpleApps = apps.filter((a) => {
    const label = `${a?.name ?? ""} ${a?.slug ?? ""}`.toLowerCase();
    return label.includes("purple") || label.includes("flutter");
  });
  const selected = purpleApps.length > 0 ? purpleApps : apps.slice(0, 3);

  const summary = {
    ...base,
    status: "ok",
    applicationCount: apps.length,
    highlighted: selected.map((a) => ({
      id: a.id ?? a.slug,
      name: appLabel(a),
      platform: a.target_os ?? a.platform,
      slug: a.slug,
    })),
    note:
      "Full crash list requires app slug-specific endpoints; verify stacks in Luciq UI " +
      "or Luciq MCP list_crashes after TF install.",
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`[luciq] Applications visible to ${email}: ${apps.length}`);
  for (const app of summary.highlighted) {
    console.log(`  - ${app.name} (${app.platform ?? "?"}) id=${app.id ?? app.slug}`);
  }
  console.log("[luciq] Open Crashes / App Health in dashboard for stack traces.");
  console.log(`[luciq] ${base.manualUrl}`);
}

main().catch((err) => {
  if (asJson) {
    console.log(
      JSON.stringify(
        {
          status: "error",
          error: err.message,
          hint: "Check LUCIQ_API_TOKEN + LUCIQ_ACCOUNT_EMAIL or use manual dashboard.",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
  console.error(`[luciq] ${err.message}`);
  console.error("[luciq] Falling back to manual dashboard check.");
  process.exit(1);
});
