// Free US drug reference lookup. Pulls a medication's typical dosage form and
// common strengths from openFDA (NDC directory) with an RxNorm (RxNav) fallback.
// Both APIs are free and need no key. Responses are cached at the edge via the
// Cloudflare Cache API so repeat lookups are instant and cost nothing.

export type DrugDefaults = {
  genericName: string | null;
  dosageForm: string | null;
  defaultUnit: string | null;
  commonStrengths: string[];
};

const EMPTY: DrugDefaults = {
  genericName: null,
  dosageForm: null,
  defaultUnit: null,
  commonStrengths: [],
};

const KNOWN_UNITS = ["mg", "mcg", "ug", "g", "ml", "iu", "unit", "units", "%"];

/** Map openFDA / RxNorm dosage form text onto the app's form options. */
function normalizeForm(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("tablet")) return "tablet";
  if (s.includes("capsule")) return "capsule";
  if (
    s.includes("solution") ||
    s.includes("suspension") ||
    s.includes("syrup") ||
    s.includes("liquid") ||
    s.includes("elixir")
  )
    return "liquid";
  if (s.includes("injection") || s.includes("injectable")) return "injection";
  if (s.includes("drop")) return "drops";
  if (s.includes("patch") || s.includes("transdermal")) return "patch";
  if (s.includes("inhal") || s.includes("aerosol") || s.includes("spray")) return "inhaler";
  if (s.includes("powder")) return "powder";
  if (s.includes("gummy") || s.includes("lozenge")) return "gummy";
  if (s.includes("pill")) return "pill";
  return null;
}

/** Pull a leading numeric amount and unit from a strength string like "5 mg/1". */
function parseStrength(
  raw: string | null | undefined,
): { amount: string; unit: string | null } | null {
  if (!raw) return null;
  const m = raw.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)?/);
  if (!m) return null;
  const amount = m[1];
  const unitRaw = (m[2] ?? "").toLowerCase();
  let unit: string | null = null;
  if (unitRaw) {
    if (unitRaw === "ug") unit = "mcg";
    else if (KNOWN_UNITS.includes(unitRaw)) unit = unitRaw === "units" ? "units" : unitRaw;
    else unit = unitRaw;
  }
  // Normalize common casing.
  if (unit === "iu") unit = "IU";
  if (unit === "ml") unit = "mL";
  return { amount, unit };
}

function dedupeSortStrengths(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  out.sort((a, b) => parseFloat(a) - parseFloat(b));
  return out.slice(0, 8);
}

/** GET JSON with edge caching. Falls back to a direct fetch when Cache API is absent (dev/Node). */
async function cachedJson(url: string, ttlSeconds = 60 * 60 * 24 * 7): Promise<unknown | null> {
  const cacheGlobal = (globalThis as { caches?: { default?: Cache } }).caches;
  const cache = cacheGlobal?.default;
  const req = new Request(url);
  try {
    if (cache) {
      const hit = await cache.match(req);
      if (hit) return await hit.json();
    }
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const body = await res.text();
    if (cache) {
      const toStore = new Response(body, {
        headers: {
          "content-type": "application/json",
          "cache-control": `public, max-age=${ttlSeconds}`,
        },
      });
      // Do not block the response on cache write.
      void cache.put(req, toStore.clone());
    }
    return JSON.parse(body);
  } catch {
    return null;
  }
}

type OpenFdaResult = {
  results?: Array<{
    generic_name?: string;
    dosage_form?: string;
    active_ingredients?: Array<{ name?: string; strength?: string }>;
  }>;
};

async function fromOpenFda(name: string): Promise<DrugDefaults | null> {
  const q = encodeURIComponent(`(brand_name:"${name}" OR generic_name:"${name}")`);
  const url = `https://api.fda.gov/drug/ndc.json?search=${q}&limit=25`;
  const data = (await cachedJson(url)) as OpenFdaResult | null;
  const results = data?.results;
  if (!results || results.length === 0) return null;

  let dosageForm: string | null = null;
  let defaultUnit: string | null = null;
  let genericName: string | null = null;
  const strengths: string[] = [];

  for (const r of results) {
    if (!genericName && r.generic_name) genericName = r.generic_name.toLowerCase();
    if (!dosageForm) dosageForm = normalizeForm(r.dosage_form);
    const ing = r.active_ingredients?.[0];
    const parsed = parseStrength(ing?.strength);
    if (parsed) {
      strengths.push(parsed.amount);
      if (!defaultUnit && parsed.unit) defaultUnit = parsed.unit;
    }
  }

  return {
    genericName,
    dosageForm,
    defaultUnit,
    commonStrengths: dedupeSortStrengths(strengths),
  };
}

type RxcuiResult = { idGroup?: { rxnormId?: string[] } };
type RelatedResult = {
  relatedGroup?: {
    conceptGroup?: Array<{ tty?: string; conceptProperties?: Array<{ name?: string }> }>;
  };
};

async function fromRxNorm(name: string): Promise<DrugDefaults | null> {
  const idUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=2`;
  const idData = (await cachedJson(idUrl)) as RxcuiResult | null;
  const rxcui = idData?.idGroup?.rxnormId?.[0];
  if (!rxcui) return null;

  const relUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=SCD+SBD`;
  const relData = (await cachedJson(relUrl)) as RelatedResult | null;
  const groups = relData?.relatedGroup?.conceptGroup ?? [];

  let dosageForm: string | null = null;
  let defaultUnit: string | null = null;
  const strengths: string[] = [];

  for (const g of groups) {
    for (const c of g.conceptProperties ?? []) {
      const nm = c.name ?? "";
      const parsed = parseStrength(nm);
      if (parsed) {
        strengths.push(parsed.amount);
        if (!defaultUnit && parsed.unit) defaultUnit = parsed.unit;
      }
      if (!dosageForm) dosageForm = normalizeForm(nm);
    }
  }

  if (strengths.length === 0 && !dosageForm) return null;
  return {
    genericName: null,
    dosageForm,
    defaultUnit,
    commonStrengths: dedupeSortStrengths(strengths),
  };
}

/** Look up typical dosage form and common strengths for a US medication name. */
export async function lookupDrugDefaults(name: string): Promise<DrugDefaults> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return EMPTY;

  const fda = await fromOpenFda(trimmed);
  if (fda && (fda.dosageForm || fda.commonStrengths.length > 0)) return fda;

  const rx = await fromRxNorm(trimmed);
  if (rx) return rx;

  return fda ?? EMPTY;
}
