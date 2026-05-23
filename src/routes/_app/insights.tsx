import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/layout/placeholder-page";

export const Route = createFileRoute("/_app/insights")({
  head: () => ({ meta: [{ title: "Insights — Purple" }] }),
  component: () => (
    <Placeholder
      title="Patterns"
      body="Once you've shared enough, Purple will quietly start to notice what changes around hard days."
    />
  ),
});