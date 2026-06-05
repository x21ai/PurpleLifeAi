import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
// QA #19: pdf-lib Helvetica is WinAnsi-only. Strip/replace non-encodable chars.
function safe(input: string): string {
  return (input ?? "")
    .replace(/[\u2192\u279C\u27A4]/g, "->")
    .replace(/[\u2190]/g, "<-")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022]/g, "*")
    .replace(/[\u00A0]/g, " ")
    .replace(/[\u2026]/g, "...")
    // Drop any remaining non-WinAnsi (outside basic latin + latin-1 supplement)
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

import type { PatternCard } from "./insights-patterns.functions";

/**
 * Server-only PDF builder for the "Medical history report".
 * Pure pdf-lib (works in the Cloudflare Worker runtime — no native deps).
 */

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const BRAND = rgb(0.357, 0.173, 0.51); // ~#5B2C82
const TEXT = rgb(0.05, 0.05, 0.07);
const MUTED = rgb(0.4, 0.42, 0.46);
const FAINT = rgb(0.85, 0.86, 0.88);

export type ReportSourceData = {
  profile: {
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    conditions: string[] | null;
    conditions_note: string | null;
    email?: string | null;
  };
  window: { from: string; to: string };
  generatedAt: string;
  meds: Array<{
    name: string;
    dosage: string | null;
    schedule_summary: string;
    start_date: string | null;
    end_date: string | null;
    adherence_pct: number | null;
    last_taken: string | null;
    active: boolean;
  }>;
  seizures: Array<{
    started_at: string;
    duration_seconds: number | null;
    type: string | null;
    severity: number | null;
    notes: string | null;
  }>;
  /** Map metric label -> sorted [{date, value}] daily averages across sources. */
  biometrics: Record<
    string,
    {
      unit: string;
      direction: "higher_better" | "lower_better" | "neutral";
      points: Array<{ date: string; value: number }>;
      hint: string;
      series?: Record<string, Array<{ date: string; value: number }>>;
      refLow?: number;
      refHigh?: number;
    }
  >;
  labs: Array<{ title: string; created_at: string; metric_count: number }>;
  journalSummary: string | null;
  hydration: { total_logs: number; avg_ml_per_day: number | null } | null;
  auras: { count: number; led_to_seizure: number } | null;
  patterns?: PatternCard[];
  sections: {
    snapshot: boolean;
    meds: boolean;
    seizures: boolean;
    biometrics: boolean;
    labs: boolean;
    journal: boolean;
    extras: boolean;
    appendix: boolean;
  };
};

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  pageNo: number;
  total: () => number;
};

function newPage(c: Ctx) {
  c.page = c.doc.addPage([PAGE_W, PAGE_H]);
  c.pageNo += 1;
  c.y = PAGE_H - MARGIN;
  drawFooter(c);
}

function ensureSpace(c: Ctx, needed: number) {
  if (c.y - needed < MARGIN + 36) newPage(c);
}

function drawFooter(c: Ctx) {
  c.page.drawText(safe(`Purple — generated medical history. Not a medical record. Page ${c.pageNo}`), { x: MARGIN, y: 24, size: 8, font: c.font, color: MUTED },
  );
}

function H1(c: Ctx, text: string) {
  ensureSpace(c, 32);
  c.page.drawText(safe(text), { x: MARGIN, y: c.y, size: 20, font: c.bold, color: BRAND });
  c.y -= 28;
}
function H2(c: Ctx, text: string) {
  ensureSpace(c, 26);
  c.page.drawText(safe(text), { x: MARGIN, y: c.y, size: 14, font: c.bold, color: TEXT });
  c.y -= 18;
}
function P(c: Ctx, text: string, opts: { size?: number; color?: ReturnType<typeof rgb>; bold?: boolean } = {}) {
  const size = opts.size ?? 10;
  const color = opts.color ?? TEXT;
  const font = opts.bold ? c.bold : c.font;
  const maxW = PAGE_W - MARGIN * 2;
  const lines = wrap(text || "—", font, size, maxW);
  for (const line of lines) {
    ensureSpace(c, size + 4);
    c.page.drawText(safe(line), { x: MARGIN, y: c.y, size, font, color });
    c.y -= size + 4;
  }
}
function spacer(c: Ctx, h = 8) {
  c.y -= h;
}
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function table(
  c: Ctx,
  cols: Array<{ key: string; label: string; w: number; align?: "left" | "right" }>,
  rows: Array<Record<string, string>>,
) {
  const x0 = MARGIN;
  const rowH = 14;
  // header
  ensureSpace(c, rowH + 4);
  c.page.drawRectangle({
    x: x0, y: c.y - 2, width: PAGE_W - MARGIN * 2, height: rowH,
    color: rgb(0.95, 0.94, 0.97),
  });
  let x = x0 + 4;
  for (const col of cols) {
    c.page.drawText(safe(col.label), { x, y: c.y + 2, size: 9, font: c.bold, color: TEXT });
    x += col.w;
  }
  c.y -= rowH;
  // rows
  for (const row of rows) {
    ensureSpace(c, rowH);
    let xc = x0 + 4;
    for (const col of cols) {
      const raw = row[col.key] ?? "—";
      const txt = truncate(raw, col.w - 6, c.font, 9);
      const tx = col.align === "right"
        ? xc + col.w - 6 - c.font.widthOfTextAtSize(txt, 9)
        : xc;
      c.page.drawText(safe(txt), { x: tx, y: c.y + 2, size: 9, font: c.font, color: TEXT });
      xc += col.w;
    }
    c.page.drawLine({
      start: { x: x0, y: c.y },
      end: { x: PAGE_W - MARGIN, y: c.y },
      thickness: 0.4, color: FAINT,
    });
    c.y -= rowH;
  }
  spacer(c, 6);
}
function truncate(s: string, maxW: number, font: PDFFont, size: number): string {
  if (font.widthOfTextAtSize(s, size) <= maxW) return s;
  let lo = 0, hi = s.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (font.widthOfTextAtSize(s.slice(0, mid) + "…", size) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return s.slice(0, lo) + "…";
}

const SERIES_COLORS = [
  rgb(0.357, 0.173, 0.51), // purple (brand)
  rgb(0.13, 0.49, 0.78),   // blue
  rgb(0.86, 0.45, 0.16),   // orange
  rgb(0.20, 0.56, 0.30),   // green
  rgb(0.55, 0.27, 0.55),   // magenta
];

function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function overlayChart(
  c: Ctx,
  series: Record<string, Array<{ date: string; value: number }>>,
  opts: {
    label: string;
    height?: number;
    unit?: string;
    refLow?: number;
    refHigh?: number;
    seizureDates?: Set<string>;
    windowFrom: string;
    windowTo: string;
  },
) {
  const h = opts.height ?? 96;
  const w = PAGE_W - MARGIN * 2;
  ensureSpace(c, h + 30);
  const x0 = MARGIN;
  const y0 = c.y - h;

  c.page.drawRectangle({
    x: x0, y: y0, width: w, height: h, borderColor: FAINT, borderWidth: 0.5,
  });

  const dates = dateRange(opts.windowFrom, opts.windowTo);
  const sourceNames = Object.keys(series).filter((s) => (series[s]?.length ?? 0) > 0);
  const allVals: number[] = [];
  for (const s of sourceNames) for (const p of series[s]) allVals.push(p.value);
  if (opts.refLow != null) allVals.push(opts.refLow);
  if (opts.refHigh != null) allVals.push(opts.refHigh);

  if (allVals.length === 0 || dates.length < 2) {
    c.page.drawText(safe("Not enough data"), {
      x: x0 + 8, y: y0 + h / 2, size: 9, font: c.font, color: MUTED,
    });
    c.y = y0 - 12;
    return;
  }

  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const span = max - min || 1;
  const xFor = (d: string) => {
    const idx = dates.indexOf(d);
    if (idx < 0) return -1;
    return x0 + (idx / (dates.length - 1)) * w;
  };
  const yFor = (v: number) => y0 + ((v - min) / span) * (h - 10) + 5;

  // Reference band
  if (opts.refLow != null && opts.refHigh != null && opts.refHigh > opts.refLow) {
    const ya = yFor(opts.refLow);
    const yb = yFor(opts.refHigh);
    c.page.drawRectangle({
      x: x0, y: ya, width: w, height: yb - ya,
      color: rgb(0.6, 0.85, 0.6), opacity: 0.12,
    });
  }

  // Seizure markers as vertical ticks along the x-axis
  if (opts.seizureDates && opts.seizureDates.size > 0) {
    for (const d of opts.seizureDates) {
      const x = xFor(d);
      if (x < 0) continue;
      c.page.drawLine({
        start: { x, y: y0 }, end: { x, y: y0 + 8 },
        thickness: 0.8, color: rgb(0.78, 0.17, 0.17),
      });
    }
  }

  // Series lines
  sourceNames.forEach((src, idx) => {
    const color = SERIES_COLORS[idx % SERIES_COLORS.length];
    const pts = [...series[src]].sort((a, b) => (a.date < b.date ? -1 : 1));
    let prev: { x: number; y: number } | null = null;
    for (const p of pts) {
      const x = xFor(p.date);
      if (x < 0) continue;
      const y = yFor(p.value);
      if (prev) {
        c.page.drawLine({ start: prev, end: { x, y }, thickness: 1.2, color });
      }
      prev = { x, y };
    }
  });

  // Min/max labels
  c.page.drawText(safe(`${formatNum(max)}${opts.unit ?? ""}`), {
    x: x0 + w - 54, y: y0 + h - 10, size: 8, font: c.font, color: MUTED,
  });
  c.page.drawText(safe(`${formatNum(min)}${opts.unit ?? ""}`), {
    x: x0 + w - 54, y: y0 + 2, size: 8, font: c.font, color: MUTED,
  });
  c.page.drawText(safe(`${dates[0]} → ${dates[dates.length - 1]}`), {
    x: x0 + 4, y: y0 - 10, size: 8, font: c.font, color: MUTED,
  });

  // Legend
  let lx = x0;
  const ly = y0 - 22;
  sourceNames.forEach((src, idx) => {
    const color = SERIES_COLORS[idx % SERIES_COLORS.length];
    c.page.drawLine({
      start: { x: lx, y: ly + 3 }, end: { x: lx + 14, y: ly + 3 },
      thickness: 1.5, color,
    });
    const label = src.length > 0 ? src : "other";
    c.page.drawText(safe(label), {
      x: lx + 18, y: ly, size: 8, font: c.font, color: TEXT,
    });
    lx += 24 + c.font.widthOfTextAtSize(label, 8);
  });
  if (opts.seizureDates && opts.seizureDates.size > 0) {
    c.page.drawLine({
      start: { x: lx, y: ly + 3 }, end: { x: lx + 14, y: ly + 3 },
      thickness: 0.8, color: rgb(0.78, 0.17, 0.17),
    });
    c.page.drawText(safe("seizure day"), {
      x: lx + 18, y: ly, size: 8, font: c.font, color: TEXT,
    });
  }

  c.y = y0 - 30;
}
function formatNum(n: number): string {
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
}
function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}
function fmtDuration(sec: number | null | undefined): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export async function buildMedicalReportPdf(data: ReportSourceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Purple — Medical history");
  doc.setAuthor("Purple");
  doc.setProducer("Purple");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const c: Ctx = {
    doc, page: undefined as unknown as PDFPage, y: 0, font, bold, pageNo: 0,
    total: () => doc.getPageCount(),
  };
  newPage(c);

  // Cover
  c.page.drawText(safe("Medical history report"), { x: MARGIN, y: c.y, size: 26, font: bold, color: BRAND });
  c.y -= 36;
  const name = [data.profile.first_name, data.profile.last_name].filter(Boolean).join(" ") || "Patient";
  P(c, name, { size: 16, bold: true });
  P(c, `Date of birth: ${fmtDate(data.profile.date_of_birth)}`, { color: MUTED });
  if (data.profile.email) P(c, `Email: ${data.profile.email}`, { color: MUTED });
  spacer(c, 6);
  P(c, `Window: ${data.window.from} → ${data.window.to}`);
  P(c, `Generated: ${new Date(data.generatedAt).toLocaleString()}`, { color: MUTED });
  spacer(c, 12);
  if (data.profile.conditions?.length) {
    P(c, "Conditions", { bold: true, size: 12 });
    P(c, data.profile.conditions.join(", "));
  }
  if (data.profile.conditions_note) {
    spacer(c, 4);
    P(c, data.profile.conditions_note, { color: MUTED });
  }
  spacer(c, 16);
  P(
    c,
    "This document was generated from self-tracked data in the Purple app. It is not a medical record and is intended to support — not replace — clinical judgement.",
    { color: MUTED, size: 9 },
  );

  // Snapshot
  if (data.sections.snapshot) {
    newPage(c);
    H1(c, "Snapshot");
    P(c, `Active medications: ${data.meds.filter((m) => m.active).length}`);
    P(c, `Seizures in window: ${data.seizures.length}`);
    const adh = data.meds.filter((m) => m.adherence_pct != null);
    const avgAdh = adh.length
      ? Math.round(adh.reduce((a, b) => a + (b.adherence_pct ?? 0), 0) / adh.length)
      : null;
    P(c, `Average medication adherence: ${avgAdh != null ? avgAdh + "%" : "—"}`);
    const sleep = data.biometrics["Total sleep"]?.points ?? [];
    if (sleep.length) {
      const avg = sleep.reduce((a, b) => a + b.value, 0) / sleep.length;
      P(c, `Average sleep: ${(avg / 60).toFixed(1)} h`);
    }
    const hrv = data.biometrics["HRV"]?.points ?? [];
    if (hrv.length) {
      const avg = hrv.reduce((a, b) => a + b.value, 0) / hrv.length;
      P(c, `Average HRV: ${avg.toFixed(0)} ms`);
    }
  }

  // Patterns Purple noticed (descriptive, cited to the patient's own data)
  if (data.sections.snapshot && data.patterns && data.patterns.length > 0) {
    newPage(c);
    H1(c, "Patterns Purple noticed");
    P(
      c,
      "Descriptive observations from the patient's own logs over the window above. Not causal claims — for discussion.",
      { color: MUTED, size: 9 },
    );
    spacer(c, 6);
    for (const card of data.patterns) {
      ensureSpace(c, 40);
      P(c, card.title, { bold: true, size: 11 });
      P(c, card.detail);
      if (card.evidence) P(c, card.evidence, { color: MUTED, size: 9 });
      spacer(c, 6);
    }
  }

  // Medications
  if (data.sections.meds) {
    newPage(c);
    H1(c, "Medications");
    if (data.meds.length === 0) P(c, "No medications recorded in this window.", { color: MUTED });
    else
      table(
        c,
        [
          { key: "name", label: "Name", w: 130 },
          { key: "dosage", label: "Dose", w: 80 },
          { key: "schedule", label: "Schedule", w: 130 },
          { key: "adherence", label: "Adherence", w: 60, align: "right" },
          { key: "last", label: "Last taken", w: 110 },
        ],
        data.meds.map((m) => ({
          name: m.name + (m.active ? "" : " (inactive)"),
          dosage: m.dosage ?? "—",
          schedule: m.schedule_summary,
          adherence: m.adherence_pct != null ? `${m.adherence_pct}%` : "—",
          last: fmtDate(m.last_taken),
        })),
      );
  }

  // Seizures
  if (data.sections.seizures) {
    newPage(c);
    H1(c, "Seizures & events");
    if (data.seizures.length === 0) P(c, "No seizure events recorded in this window.", { color: MUTED });
    else
      table(
        c,
        [
          { key: "date", label: "Date", w: 110 },
          { key: "duration", label: "Duration", w: 70 },
          { key: "type", label: "Type", w: 110 },
          { key: "severity", label: "Severity", w: 60, align: "right" },
          { key: "notes", label: "Notes", w: 160 },
        ],
        data.seizures.map((s) => ({
          date: new Date(s.started_at).toLocaleString(),
          duration: fmtDuration(s.duration_seconds),
          type: s.type ?? "—",
          severity: s.severity != null ? String(s.severity) : "—",
          notes: s.notes ?? "—",
        })),
      );
  }

  // Biometrics trends
  if (data.sections.biometrics) {
    newPage(c);
    H1(c, "Biometric trends");
    const seizureDates = new Set<string>();
    for (const s of data.seizures) {
      seizureDates.add(s.started_at.slice(0, 10));
    }
    const entries = Object.entries(data.biometrics).filter(([, v]) => v.points.length > 1);
    if (entries.length === 0)
      P(c, "No biometric data in this window.", { color: MUTED });
    for (const [label, series] of entries) {
      H2(c, label);
      const seriesMap = series.series && Object.keys(series.series).length > 0
        ? series.series
        : { combined: series.points };
      overlayChart(c, seriesMap, {
        label,
        unit: series.unit ? ` ${series.unit}` : "",
        refLow: series.refLow,
        refHigh: series.refHigh,
        seizureDates,
        windowFrom: data.window.from,
        windowTo: data.window.to,
      });
      P(c, series.hint, { color: MUTED, size: 9 });
      const sources = Object.keys(series.series ?? {});
      if (sources.length > 0) {
        P(c, `Sources: ${sources.join(", ")}`, { color: MUTED, size: 8 });
      }
      spacer(c, 10);
    }
  }

  // Lab reports
  if (data.sections.labs && data.labs.length) {
    newPage(c);
    H1(c, "Lab reports");
    table(
      c,
      [
        { key: "date", label: "Uploaded", w: 110 },
        { key: "title", label: "Title", w: 280 },
        { key: "metrics", label: "Metrics", w: 80, align: "right" },
      ],
      data.labs.map((l) => ({
        date: fmtDate(l.created_at),
        title: l.title,
        metrics: String(l.metric_count),
      })),
    );
  }

  // Journal highlights
  if (data.sections.journal && data.journalSummary) {
    newPage(c);
    H1(c, "Journal highlights");
    P(c, data.journalSummary);
  }

  // Extras
  if (data.sections.extras && (data.hydration || data.auras)) {
    newPage(c);
    H1(c, "Other tracked data");
    if (data.hydration) {
      H2(c, "Hydration");
      P(c, `Logs: ${data.hydration.total_logs}`);
      P(c, `Average per day: ${data.hydration.avg_ml_per_day ?? "—"} ml`);
      spacer(c, 6);
    }
    if (data.auras) {
      H2(c, "Aura events");
      P(c, `Recorded: ${data.auras.count}`);
      P(c, `Led to seizure: ${data.auras.led_to_seizure}`);
    }
  }

  // Appendix — raw biometrics table
  if (data.sections.appendix) {
    newPage(c);
    H1(c, "Appendix — daily biometrics");
    const metrics = Object.keys(data.biometrics);
    if (metrics.length === 0) {
      P(c, "No raw data.", { color: MUTED });
    } else {
      // Pivot by date
      const byDate = new Map<string, Record<string, number>>();
      for (const [m, s] of Object.entries(data.biometrics)) {
        for (const p of s.points) {
          if (!byDate.has(p.date)) byDate.set(p.date, {});
          byDate.get(p.date)![m] = p.value;
        }
      }
      const dates = Array.from(byDate.keys()).sort();
      const shown = metrics.slice(0, 5); // keep narrow
      const colW = (PAGE_W - MARGIN * 2 - 80) / shown.length;
      table(
        c,
        [
          { key: "date", label: "Date", w: 80 },
          ...shown.map((m) => ({ key: m, label: m, w: colW, align: "right" as const })),
        ],
        dates.map((d) => {
          const row: Record<string, string> = { date: d };
          for (const m of shown) {
            const v = byDate.get(d)?.[m];
            row[m] = v == null ? "—" : formatNum(v);
          }
          return row;
        }),
      );
    }
  }

  return await doc.save();
}