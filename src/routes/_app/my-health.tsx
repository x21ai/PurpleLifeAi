import { createFileRoute, redirect } from "@tanstack/react-router";

// Launch decision (docs/LAUNCH-AUDIT.md): the My Body hub previously rendered
// a static mock. Until the real hub is built, the route forwards to
// Biometrics so deep links and the sidebar group landing never 404.
export const Route = createFileRoute("/_app/my-health")({
  beforeLoad: () => {
    throw redirect({ to: "/biometrics", replace: true });
  },
});
