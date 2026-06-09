import { CURATED_RSID_SET, detectProvider, type DnaProvider } from "./dna-curated-rsids";

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
}

function normalizeGenotype(raw: string): string {
  return raw.replace(/[^ACGT0-9]/gi, "").toUpperCase();
}

/**
 * Handles 23andMe (tsv: rsid\tchrom\tpos\tgenotype), AncestryDNA
 * (rsid\tchrom\tpos\tallele1\tallele2), MyHeritage (csv variant), and
 * minimal VCF (#CHROM POS ID ... + sample col with GT field).
 */
export function parseDnaText(text: string): ParseResult {
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
      const sample = sampleColIdx >= 0 ? cols[sampleColIdx] : undefined;
      const gt = sample?.split(":")[0] ?? "";
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