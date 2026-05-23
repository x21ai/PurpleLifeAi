import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/layout/placeholder-page";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Purple" }] }),
  component: () => (
    <Placeholder
      title="Settings"
      body="Account, privacy, integrations, and how Purple talks to you. All in your control."
    />
  ),
});