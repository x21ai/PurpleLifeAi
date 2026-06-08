export type ExportPoint = {
  at: string;
  value: number | null;
  value_text?: string | null;
  unit?: string | null;
  flag?: string | null;
  report?: string | null;
};

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadMetricCsv(filename: string, rows: ExportPoint[]) {
  const header = ["date", "value", "value_text", "unit", "flag", "report"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        (r.at ?? "").slice(0, 10),
        r.value ?? "",
        csvCell(r.value_text ?? ""),
        r.unit ?? "",
        r.flag ?? "",
        csvCell(r.report ?? ""),
      ].join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Share via Web Share API; copies to clipboard as fallback. Returns a status. */
export async function shareMetric(opts: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const url = opts.url ?? (typeof window !== "undefined" ? window.location.href : "");
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return "shared";
    }
  } catch {
    // user cancel or unsupported — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(`${opts.text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}