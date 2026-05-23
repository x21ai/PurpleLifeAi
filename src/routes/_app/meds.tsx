import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/layout/placeholder-page";

export const Route = createFileRoute("/_app/meds")({
  head: () => ({ meta: [{ title: "Meds — Purple" }] }),
  component: () => (
    <Placeholder
      title="Medications"
      body="Schedules, gentle reminders, and an honest record of what you actually took."
    />
  ),
});