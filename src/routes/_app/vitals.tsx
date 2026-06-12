import { createFileRoute, redirect } from "@tanstack/react-router";

// Launch decision (docs/LAUNCH-AUDIT.md): the standalone Vitals page was
// placeholder demo data. Insights carries the real vitals tiles; forward
// there until a dedicated page is built.
export const Route = createFileRoute("/_app/vitals")({
  beforeLoad: () => {
    throw redirect({ to: "/insights", replace: true });
  },
});
