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
      <TrendsSection />
    </ReportShell>
  );
}