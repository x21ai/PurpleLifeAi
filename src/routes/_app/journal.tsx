import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/layout/placeholder-page";

export const Route = createFileRoute("/_app/journal")({
  head: () => ({ meta: [{ title: "Journal — Purple" }] }),
  component: () => (
    <Placeholder
      title="Your journal"
      body="Every entry — written, spoken, or snapped — will live here. Searchable, organized by day, never lost."
    />
  ),
});