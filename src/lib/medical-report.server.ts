import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";

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
  c.page.drawText(
    `Purple — generated medical history. Not a medical record. Page ${c.pageNo}`,
    { x: MARGIN, y: 24, size: 8, font: c.font, color: MUTED },
  );
}

function H1(c: Ctx, text: string) {
  ensureSpace(c, 32);
  c.page.drawText(text, { x: MARGIN, y: c.y, size: 20, font: c.bold, color: BRAND });
  c.y -= 28;
}
function H2(c: Ctx, text: string) {
  ensureSpace(c, 26);
  c.page.drawText(text, { x: MARGIN, y: c.y, size: 14, font: c.bold, color: TEXT });
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
    c.page.drawText(line, { x: MARGIN, y: c.y, size, font, color });
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
    c.page.drawText(col.label, { x, y: c.y + 2, size: 9, font: c.bold, color: TEXT });
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
      c.page.drawText(txt, { x: tx, y: c.y + 2, size: 9, font: c.font, color: TEXT });
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

function lineChart(
  c: Ctx,
  points: Array<{ date: string; value: number }>,
  opts: { label: string; height?: number; unit?: string } = { label: "" },
) {
  const h = opts.height ?? 90;
  const w = PAGE_W - MARGIN * 2;
  ensureSpace(c, h + 16);
  const x0 = MARGIN;
  const y0 = c.y - h;
  // frame
  c.page.drawRectangle({ x: x0, y: y0, width: w, height: h, borderColor: FAINT, borderWidth: 0.5 });
  if (points.length < 2) {
    c.page.drawText("Not enough data", { x: x0 + 8, y: y0 + h / 2, size: 9, font: c.font, color: MUTED });
    c.y = y0 - 6;
    return;
  }
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const stepX = w / (points.length - 1);
  let prev = { x: x0, y: y0 + ((points[0].value - min) / span) * (h - 8) + 4 };
  for (let i = 1; i < points.length; i++) {
    const x = x0 + i * stepX;
    const y = y0 + ((points[i].value - min) / span) * (h - 8) + 4;
    c.page.drawLine({ start: prev, end: { x, y }, thickness: 1.1, color: BRAND });
    prev = { x, y };
  }
  // min/max labels
  c.page.drawText(`${formatNum(max)}${opts.unit ?? ""}`, {
    x: x0 + w - 50, y: y0 + h - 10, size: 8, font: c.font, color: MUTED,
  });
  c.page.drawText(`${formatNum(min)}${opts.unit ?? ""}`, {
    x: x0 + w - 50, y: y0 + 2, size: 8, font: c.font, color: MUTED,
  });
  c.page.drawText(`${points[0].date} → ${points[points.length - 1].date}`, {
    x: x0 + 4, y: y0 - 10, size: 8, font: c.font, color: MUTED,
  });
  c.y = y0 - 16;
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
  c.page.drawText("Medical history report", { x: MARGIN, y: c.y, size: 26, font: bold, color: BRAND });
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
    const entries = Object.entries(data.biometrics).filter(([, v]) => v.points.length > 1);
    if (entries.length === 0)
      P(c, "No biometric data in this window.", { color: MUTED });
    for (const [label, series] of entries) {
      H2(c, label);
      lineChart(c, series.points, { label, unit: series.unit ? ` ${series.unit}` : "" });
      P(c, series.hint, { color: MUTED, size: 9 });
      spacer(c, 8);
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