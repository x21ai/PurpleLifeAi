import { createFileRoute } from "@tanstack/react-router";
import { ReportShell } from "@/components/reports/report-shell";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { TrendsSection } from "@/components/reports/trends-section";

export const Route = createFileRoute("/_app/reports/metrics")({
  head: () => ({
    meta: [
      { title: "Metrics · Purple" },
      {
        name: "description",
        content: "Every lab value you've ever uploaded, trended over time with reference ranges.",
      },
    ],
  }),
  component: ReportsMetricsPage,
});

function ReportsMetricsPage() {
  return (
    <ReportShell title="Reports">
      <ReportsTabs />
      <header className="mb-2">
        <p className="report-eyebrow text-white/70">All your metrics</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl text-white leading-tight">
          Every value, every reading, in one place.
        </h2>
        <p className="mt-3 text-[15px] text-white/65 max-w-[560px]">
          Tap any metric to see the full history — exact values and dates, with the lab's reference range
          shaded so you can see when a result fell in or out of bounds.
        </p>
      </header>
      <TrendsSection />
    </ReportShell>
  );
}