import { CURATED_RSID_SET, detectProvider, type DnaProvider } from "./dna-curated-rsids";
import { gunzipSync, unzipSync, strFromU8 } from "fflate";
import { parseTar } from "nanotar";

/**
 * Stream-parse a raw DNA file. Returns only rows whose RSID is in the
 * curated allow-list. Never returns the full genome.
 */
export interface ParsedVariant {
  rsid: string;
  genotype: string;
  chromosome: string | null;
  position: number | null;
}

export interface ParseResult {
  provider: DnaProvider;
  variants: ParsedVariant[];
  kind: "genotype" | "vcf" | "json" | "bam" | "cram" | "index" | "unknown";
  compression: "none" | "gz" | "zip" | "tar" | "tgz";
}

function normalizeGenotype(raw: string): string {
  return raw.replace(/[^ACGT0-9]/gi, "").toUpperCase();
}

/** Detect file kind/compression from filename + magic bytes. */
export function detectFileShape(filename: string, bytes: Uint8Array): {
  compression: ParseResult["compression"];
  kind: ParseResult["kind"];
} {
  const lower = filename.toLowerCase();
  let compression: ParseResult["compression"] = "none";
  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) compression = "tgz";
  else if (lower.endsWith(".tar")) compression = "tar";
  else if (lower.endsWith(".zip")) compression = "zip";
  else if (lower.endsWith(".gz")) compression = "gz";
  else if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) compression = "gz";
  else if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) compression = "zip";

  let kind: ParseResult["kind"] = "unknown";
  if (/\.bam$/.test(lower)) kind = "bam";
  else if (/\.cram$/.test(lower)) kind = "cram";
  else if (/\.(tbi|crai|bai|csi)$/.test(lower)) kind = "index";
  else if (/\.vcf(\.gz)?$/.test(lower)) kind = "vcf";
  else if (/\.json$/.test(lower)) kind = "json";
  else if (/\.(txt|tsv|csv)$/.test(lower)) kind = "genotype";
  return { compression, kind };
}

/** Decompress and return inner text + filename hint, or null if unsupported. */
function decompressToText(
  filename: string,
  bytes: Uint8Array,
  compression: ParseResult["compression"],
): { text: string; innerName: string } | null {
  try {
    if (compression === "none") {
      return { text: new TextDecoder().decode(bytes), innerName: filename };
    }
    if (compression === "gz") {
      const out = gunzipSync(bytes);
      const inner = filename.replace(/\.gz$/i, "");
      return { text: new TextDecoder().decode(out), innerName: inner };
    }
    if (compression === "zip") {
      const entries = unzipSync(bytes);
      const names = Object.keys(entries);
      const pick = names.find((n) => /\.(txt|tsv|csv|vcf|json)$/i.test(n)) ?? names[0];
      if (!pick) return null;
      return { text: strFromU8(entries[pick]), innerName: pick };
    }
    if (compression === "tar" || compression === "tgz") {
      const raw = compression === "tgz" ? gunzipSync(bytes) : bytes;
      const files = parseTar(raw);
      const pick = files.find((f) => /\.(txt|tsv|csv|vcf|json)$/i.test(f.name)) ?? files[0];
      if (!pick || !pick.data) return null;
      return { text: strFromU8(pick.data as Uint8Array), innerName: pick.name };
    }
  } catch {
    return null;
  }
  return null;
}

/** Top-level: choose strategy by detected kind + compression. */
export function parseDnaFileBytes(filename: string, bytes: Uint8Array): ParseResult {
  const shape = detectFileShape(filename, bytes);
  const empty: ParseResult = {
    provider: "unknown",
    variants: [],
    kind: shape.kind,
    compression: shape.compression,
  };

  // Alignment files & lone indexes: store metadata but skip parsing.
  if (shape.kind === "bam" || shape.kind === "cram" || shape.kind === "index") {
    return empty;
  }

  const decoded = decompressToText(filename, bytes, shape.compression);
  if (!decoded) return empty;

  const innerLower = decoded.innerName.toLowerCase();
  if (innerLower.endsWith(".json") || shape.kind === "json") {
    const { provider, variants } = parseDnaJson(decoded.text);
    return { provider, variants, kind: "json", compression: shape.compression };
  }
  const result = parseDnaText(decoded.text);
  return {
    provider: result.provider,
    variants: result.variants,
    kind: result.provider === "vcf" ? "vcf" : "genotype",
    compression: shape.compression,
  };
}

/** Parse JSON exports: { rsid: genotype } maps, or arrays of {rsid, genotype}. */
function parseDnaJson(text: string): { provider: DnaProvider; variants: ParsedVariant[] } {
  const out: ParsedVariant[] = [];
  const seen = new Set<string>();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { provider: "unknown", variants: out };
  }

  const push = (rsid: string, genotype: string) => {
    const id = rsid.trim();
    if (!id.startsWith("rs") || !CURATED_RSID_SET.has(id) || seen.has(id)) return;
    const g = normalizeGenotype(genotype);
    if (!g) return;
    seen.add(id);
    out.push({ rsid: id, genotype: g, chromosome: null, position: null });
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    // shape 1: { rs123: "AG", ... }
    // shape 2: { variants: [...] } / { genotypes: [...] }
    const obj = parsed as Record<string, unknown>;
    const nested = (obj.variants ?? obj.genotypes ?? obj.results) as unknown;
    if (Array.isArray(nested)) {
      for (const v of nested) {
        if (v && typeof v === "object") {
          const r = (v as Record<string, unknown>);
          const rsid = String(r.rsid ?? r.id ?? r.snp ?? "");
          const gt = String(r.genotype ?? r.gt ?? r.alleles ?? "");
          if (rsid && gt) push(rsid, gt);
        }
      }
    } else {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") push(k, v);
      }
    }
  } else if (Array.isArray(parsed)) {
    for (const v of parsed) {
      if (v && typeof v === "object") {
        const r = v as Record<string, unknown>;
        const rsid = String(r.rsid ?? r.id ?? r.snp ?? "");
        const gt = String(r.genotype ?? r.gt ?? r.alleles ?? "");
        if (rsid && gt) push(rsid, gt);
      }
    }
  }
  return { provider: "unknown", variants: out };
}

// Keep the original text parser available for the streamed path below.
type TextParseResult = { provider: DnaProvider; variants: ParsedVariant[] };

/**
 * Handles 23andMe (tsv: rsid\tchrom\tpos\tgenotype), AncestryDNA
 * (rsid\tchrom\tpos\tallele1\tallele2), MyHeritage (csv variant), and
 * minimal VCF (#CHROM POS ID ... + sample col with GT field).
 */
export function parseDnaText(text: string): TextParseResult {
  const headerSample = text.slice(0, 4000);
  const provider = detectProvider(headerSample);
  const out: ParsedVariant[] = [];
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();

  // VCF needs a different shape entirely.
  if (provider === "vcf") {
    let genoColIdx = -1;
    let formatColIdx = -1;
    for (const line of lines) {
      if (!line || line.startsWith("##")) continue;
      if (line.startsWith("#CHROM")) {
        const cols = line.split("\t");
        formatColIdx = cols.indexOf("FORMAT");
        genoColIdx = formatColIdx + 1;
        continue;
      }
      const cols = line.split("\t");
      if (cols.length < 5) continue;
      const rsid = cols[2];
      if (!rsid || !CURATED_RSID_SET.has(rsid) || seen.has(rsid)) continue;
      const ref = cols[3];
      const alt = cols[4];
      const genoCol = genoColIdx >= 0 ? cols[genoColIdx] : undefined;
      const gt = genoCol?.split(":")[0] ?? "";
      let genotype = "";
      for (const a of gt.split(/[\/|]/)) {
        if (a === "0") genotype += ref;
        else if (a === "1") genotype += alt;
      }
      genotype = normalizeGenotype(genotype);
      if (!genotype) continue;
      seen.add(rsid);
      out.push({
        rsid,
        genotype,
        chromosome: cols[0] || null,
        position: Number.isFinite(Number(cols[1])) ? Number(cols[1]) : null,
      });
    }
    return { provider, variants: out };
  }

  // Generic tabular: try tab first, then comma. Skip comments / blank.
  for (const raw of lines) {
    if (!raw || raw.startsWith("#")) continue;
    let cols = raw.split("\t");
    if (cols.length < 4) cols = raw.split(",");
    if (cols.length < 4) continue;
    const rsid = cols[0]?.trim().replace(/^"|"$/g, "");
    if (!rsid || !rsid.startsWith("rs") || !CURATED_RSID_SET.has(rsid)) continue;
    if (seen.has(rsid)) continue;
    const chromosome = cols[1]?.trim().replace(/^"|"$/g, "") || null;
    const posRaw = cols[2]?.trim().replace(/^"|"$/g, "");
    const position = posRaw && Number.isFinite(Number(posRaw)) ? Number(posRaw) : null;
    let genotype = "";
    if (cols.length >= 5) {
      // ancestry-style allele1, allele2
      genotype = normalizeGenotype(
        (cols[3] ?? "").trim().replace(/^"|"$/g, "") +
          (cols[4] ?? "").trim().replace(/^"|"$/g, ""),
      );
    } else {
      // 23andMe-style single genotype col
      genotype = normalizeGenotype((cols[3] ?? "").trim().replace(/^"|"$/g, ""));
    }
    if (!genotype || /^[-0]+$/.test(genotype)) continue;
    seen.add(rsid);
    out.push({ rsid, genotype, chromosome, position });
  }

  return { provider, variants: out };
}